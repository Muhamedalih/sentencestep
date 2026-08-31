import { createClient } from "@/lib/supabase/server";
import { splitPage } from "@/lib/book-progress/marks";
import { getContentTranslations, resolveScalarField } from "@/lib/i18n/content-translations";
import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * "My Saves" reads — the Lightweight Save + Notes system's unified personal
 * library (Sections 9/16/18 of that spec): every sentence this learner has
 * saved and/or annotated, across every book, with just enough context to
 * place it (book + chapter) and act on it (Practice). Always the session-
 * aware client, same as book-marks.ts, since book_sentence_marks' RLS scopes
 * every row to auth.uid() = user_id — there is no "my saves" without a
 * signed-in learner.
 */

const DEFAULT_PAGE_SIZE = 20;

export interface SavedSentenceItem {
  sentenceId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  sectionId: string;
  sectionTitle: string;
  en: string;
  /** Locale-resolved translation, same resolution rules as BookSentence.supportText — undefined when no locale was given or no translation exists yet. */
  supportText?: string;
  note: string | null;
  updatedAt: string;
}

/**
 * One page of this learner's saved sentences, most-recently-touched first.
 * A "saved" row is one that's either bookmarked or annotated — a note
 * always implies a save going forward (see upsertNote's doc comment), but a
 * row can still hold a note with is_bookmarked false (a legacy row, or one
 * explicitly un-saved while keeping its note — see upsertBookmark), and
 * that annotation should stay reachable here rather than silently
 * disappearing. Bounded to `limit` rows per call (never the learner's whole
 * library at once) — `hasMore` comes from fetching one extra row rather
 * than a separate COUNT query.
 */
export async function fetchMySavedSentences(
  userId: string,
  {
    offset = 0,
    limit = DEFAULT_PAGE_SIZE,
    locale,
  }: { offset?: number; limit?: number; locale?: SupportLocale } = {},
): Promise<{ items: SavedSentenceItem[]; hasMore: boolean }> {
  const supabase = await createClient();

  const { data: markRows, error: markError } = await supabase
    .from("book_sentence_marks")
    .select("sentence_id, book_id, note, updated_at")
    .eq("user_id", userId)
    .or("is_bookmarked.eq.true,note.not.is.null")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit);
  if (markError) throw markError;

  const { page, hasMore } = splitPage(markRows ?? [], limit);
  if (page.length === 0) return { items: [], hasMore: false };

  const sentenceIds = page.map((row) => row.sentence_id);
  const { data: sentenceRows, error: sentenceError } = await supabase
    .from("book_sentences")
    .select("id, section_id, en")
    .in("id", sentenceIds);
  if (sentenceError) throw sentenceError;

  const sectionIds = [...new Set((sentenceRows ?? []).map((row) => row.section_id))];
  const bookIds = [...new Set(page.map((row) => row.book_id))];

  const [sectionsResult, booksResult, translations] = await Promise.all([
    supabase.from("book_sections").select("id, title").in("id", sectionIds),
    supabase.from("books").select("id, title, author").in("id", bookIds),
    locale
      ? getContentTranslations("book_sentence", sentenceIds, locale)
      : Promise.resolve(new Map<string, unknown>()),
  ]);
  if (sectionsResult.error) throw sectionsResult.error;
  if (booksResult.error) throw booksResult.error;

  const sentenceById = new Map((sentenceRows ?? []).map((row) => [row.id, row]));
  const sectionById = new Map((sectionsResult.data ?? []).map((row) => [row.id, row]));
  const bookById = new Map((booksResult.data ?? []).map((row) => [row.id, row]));

  const items: SavedSentenceItem[] = [];
  for (const mark of page) {
    // A sentence/section/book can vanish between being saved and being
    // listed here (content edited or removed) — skipped rather than shown
    // as a broken card, same "never fabricate content" rule the rest of the
    // Library follows.
    const sentence = sentenceById.get(mark.sentence_id);
    if (!sentence) continue;
    const section = sectionById.get(sentence.section_id);
    const book = bookById.get(mark.book_id);
    if (!section || !book) continue;

    const supportText = locale
      ? resolveScalarField(translations, sentence.id, "text", undefined, locale)
      : undefined;

    items.push({
      sentenceId: sentence.id,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      sectionId: section.id,
      sectionTitle: section.title,
      en: sentence.en,
      ...(supportText !== undefined && { supportText }),
      note: mark.note,
      updatedAt: mark.updated_at,
    });
  }

  return { items, hasMore };
}

/** Just the count — the header's saved-items badge (see AppHeader) needs a number, not the sentences themselves, so this skips the book/section joins fetchMySavedSentences does. */
export async function fetchMySavedSentencesCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("book_sentence_marks")
    .select("sentence_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .or("is_bookmarked.eq.true,note.not.is.null");
  if (error) throw error;
  return count ?? 0;
}
