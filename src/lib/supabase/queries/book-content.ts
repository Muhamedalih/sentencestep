import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getContentTranslations,
  resolveScalarField,
  resolveWordArrayField,
  warnIfMissing,
} from "@/lib/i18n/content-translations";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { Database } from "@/types/database";
import type { BookSection, BookSectionWithSentences, BookSentence } from "@/types/library";

/**
 * Learner-facing reads for a book's Sections/Sentences — the Book Learning
 * Engine's counterpart to src/lib/supabase/queries/library.ts (Book/
 * Category reads) and src/lib/supabase/queries/content.ts (Lesson/Sentence
 * reads). Anonymous public client throughout: RLS already gates a section/
 * sentence to its parent book's published (and, once premium is actually
 * enforced, free/subscribed) status — see 20250128000000_book_learning_engine.sql
 * — so there's no session-aware client needed here the way word groups' RLS
 * needs one (word groups check a real subscription per row; books don't
 * enforce that yet).
 */

type BookSectionRow = Database["public"]["Tables"]["book_sections"]["Row"];
type BookSentenceRow = Database["public"]["Tables"]["book_sentences"]["Row"];

function toSection(row: BookSectionRow): BookSection {
  return {
    id: row.id,
    bookId: row.book_id,
    orderIndex: row.order_index,
    title: row.title,
    description: row.description,
  };
}

function toSentence(row: BookSentenceRow): BookSentence {
  return {
    id: row.id,
    sectionId: row.section_id,
    orderIndex: row.order_index,
    en: row.en,
    audioUrl: row.audio_url,
  };
}

async function applySectionTranslations(
  sections: BookSection[],
  locale: SupportLocale | undefined,
): Promise<BookSection[]> {
  if (!locale || sections.length === 0) return sections;

  const translations = await getContentTranslations(
    "book_section",
    sections.map((s) => s.id),
    locale,
  );

  return sections.map((section) => {
    // No legacy `_ar` column to fall back to (see the migration's header
    // comment) — a missing translation just falls through to undefined here,
    // same as Spanish/Turkish already do for lesson content; callers render
    // section.title (English) in that case, exactly like Sentence.supportText's
    // documented fallback.
    const supportTitle = resolveScalarField(translations, section.id, "title", undefined, locale);
    warnIfMissing(supportTitle, "book_section", section.id, "title", locale);
    const supportDescription = resolveScalarField(
      translations,
      section.id,
      "description",
      undefined,
      locale,
    );

    return {
      ...section,
      ...(supportTitle !== undefined && { supportTitle }),
      ...(supportDescription !== undefined && { supportDescription }),
    };
  });
}

async function applySentenceTranslations(
  sentences: BookSentence[],
  locale: SupportLocale | undefined,
): Promise<BookSentence[]> {
  if (!locale || sentences.length === 0) return sentences;

  const translations = await getContentTranslations(
    "book_sentence",
    sentences.map((s) => s.id),
    locale,
  );

  return sentences.map((sentence) => {
    const supportText = resolveScalarField(translations, sentence.id, "text", undefined, locale);
    warnIfMissing(supportText, "book_sentence", sentence.id, "text", locale);

    const supportWordTranslations = resolveWordArrayField(
      translations,
      sentence.id,
      "word_translations",
      undefined,
      locale,
    );

    return {
      ...sentence,
      ...(supportText !== undefined && { supportText }),
      ...(supportWordTranslations !== undefined && { supportWordTranslations }),
    };
  });
}

/** Every section of a book, in order — the Book Overview's section list (Section 19 of the spec: title/description/sentence count, nothing heavier). Empty for a book with no sections yet, never an error. */
export async function fetchBookSections(
  bookId: string,
  locale?: SupportLocale,
): Promise<BookSection[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("book_sections")
    .select("*")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true });
  if (error) throw error;

  return applySectionTranslations((data ?? []).map(toSection), locale);
}

/**
 * One section with its ordered sentences — the reading screen's per-section
 * content unit. Deliberately never fetches every section's sentences at
 * once (Section 26 of the spec: performance) — the reading session fetches
 * exactly one section at a time, on mount and again each time a section
 * boundary is crossed (see fetchSectionForReadingAction).
 *
 * The section row and its sentences are two entirely independent queries —
 * neither needs the other's result — but used to run one after the other.
 * Fetched in parallel now (2026-09-11, found while chasing reader reports of
 * the section-complete transition taking multiple seconds): this function
 * sits on that same critical path (via fetchSectionAfter), so its own two
 * sequential round trips were real, avoidable latency stacked on top of
 * fetchSectionAfter's own next-section-id lookup (which, as of 2026-09-12,
 * no longer needs a preceding lookup of its own — see that function's doc
 * comment).
 */
export async function fetchBookSectionWithSentences(
  sectionId: string,
  locale?: SupportLocale,
): Promise<BookSectionWithSentences | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const [{ data: sectionRow, error: sectionError }, { data: sentenceRows, error: sentenceError }] =
    await Promise.all([
      supabase.from("book_sections").select("*").eq("id", sectionId).maybeSingle(),
      supabase
        .from("book_sentences")
        .select("*")
        .eq("section_id", sectionId)
        .order("order_index", { ascending: true }),
    ]);
  if (sectionError) throw sectionError;
  if (!sectionRow) return null;
  if (sentenceError) throw sentenceError;

  const [[section], sentences] = await Promise.all([
    applySectionTranslations([toSection(sectionRow)], locale),
    applySentenceTranslations((sentenceRows ?? []).map(toSentence), locale),
  ]);

  return { ...section!, sentences };
}

/** The book's first section (by order), with its sentences — where a never-started read begins. Null for a book with no sections yet. */
export async function fetchFirstBookSection(
  bookId: string,
  locale?: SupportLocale,
): Promise<BookSectionWithSentences | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("book_sections")
    .select("id")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return fetchBookSectionWithSentences(data.id, locale);
}

/** Honest, real counts for the Book Overview (Section 15/18 of the spec: never a fabricated number) — sections and sentences across the whole book. Accepts an already-created client so a caller issuing several queries in one request can share a single createPublicClient() instance — see fetchCategories's doc comment in library.ts for why. */
export async function fetchBookContentCounts(
  bookId: string,
  client?: ReturnType<typeof createPublicClient>,
): Promise<{ sectionCount: number; sentenceCount: number }> {
  if (!isSupabaseConfigured()) return { sectionCount: 0, sentenceCount: 0 };

  const supabase = client ?? createPublicClient();
  const { data: sectionIds, error: sectionError } = await supabase
    .from("book_sections")
    .select("id")
    .eq("book_id", bookId);
  if (sectionError) throw sectionError;
  const ids = (sectionIds ?? []).map((row) => row.id);
  if (ids.length === 0) return { sectionCount: 0, sentenceCount: 0 };

  const { count, error: countError } = await supabase
    .from("book_sentences")
    .select("*", { count: "exact", head: true })
    .in("section_id", ids);
  if (countError) throw countError;

  return { sectionCount: ids.length, sentenceCount: count ?? 0 };
}

/**
 * The section immediately after `afterOrderIndex` in book order, with its
 * sentences — null when `afterOrderIndex` belongs to the book's last
 * section. This is the ONE navigation primitive the reading session uses to
 * move between sections, for both guest and signed-in readers alike (see
 * BookReadingSession's doc comment): "was this the section's last sentence?
 * If so, is there a next section?" is answered the same way regardless of
 * who's reading, independent of — and never trusting — the signed-in-only
 * book_progress pointer, which exists purely to persist/reward progress,
 * not to drive what's shown next.
 *
 * Takes the CURRENT section's order_index directly rather than its id
 * (2026-09-12, chasing reader reports of section transitions being slow or,
 * for larger books, hanging outright): every caller already has the current
 * section loaded client-side — id AND order_index both — so re-deriving
 * order_index from id here was a whole extra sequential round trip to
 * Supabase, on a call already on the reading session's most latency-
 * sensitive path (see fetchSectionAfterAction's own doc comment on the
 * "loadingNextSection" spinner). Dropping it removes one of the four
 * sequential round trips this one navigation used to require.
 */
export async function fetchSectionAfter(
  bookId: string,
  afterOrderIndex: number,
  locale?: SupportLocale,
): Promise<BookSectionWithSentences | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data: next, error: nextError } = await supabase
    .from("book_sections")
    .select("id")
    .eq("book_id", bookId)
    .gt("order_index", afterOrderIndex)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (nextError) throw nextError;
  if (!next) return null;

  return fetchBookSectionWithSentences(next.id, locale);
}

/** The book's very first sentence, in reading order — the resume target for a reader who has never started this book. Null for a book with no sentences yet (not playable — see Section 18/21 of the spec). */
export async function fetchFirstSentenceRef(
  bookId: string,
): Promise<{ sectionId: string; sentenceId: string } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data: sentence, error } = await supabase
    .from("book_sentences")
    .select("id, section_id, book_sections!inner(book_id, order_index)")
    .eq("book_sections.book_id", bookId)
    .order("order_index", { foreignTable: "book_sections", ascending: true })
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!sentence) return null;

  return { sectionId: sentence.section_id, sentenceId: sentence.id };
}
