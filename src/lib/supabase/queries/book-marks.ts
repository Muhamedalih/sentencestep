import { createClient } from "@/lib/supabase/server";
import { buildNoteMarkFields, EMPTY_MARK } from "@/lib/book-progress/marks";
import type { BookSentenceMark } from "@/lib/book-progress/marks";

export type { BookSentenceMark };
export { EMPTY_MARK };

/**
 * Signed-in-only reads/writes for book_sentence_marks (bookmarks + notes) —
 * always the session-aware server client, since RLS scopes every row to
 * auth.uid() = user_id (same convention as book-progress.ts/word-progress.ts).
 * A bookmark and a note share one row per (user, sentence) — see the
 * migration's own doc comment for why — so a missing row is simply "neither
 * set yet," not an error.
 *
 * BookSentenceMark/EMPTY_MARK are re-exported (not defined) here — see
 * src/lib/book-progress/marks.ts's own doc comment for why they live in
 * that client-safe, server-import-free module instead.
 */

/** This learner's bookmark/note state for one sentence — always a real value, never null, so callers never need an extra "no row yet" branch. */
export async function fetchBookSentenceMark(
  userId: string,
  sentenceId: string,
): Promise<BookSentenceMark> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_sentence_marks")
    .select("is_bookmarked, note")
    .eq("user_id", userId)
    .eq("sentence_id", sentenceId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_MARK;

  return { isBookmarked: data.is_bookmarked, note: data.note };
}

/**
 * The same per-sentence state as fetchBookSentenceMark, batched for every
 * sentence on the currently-viewed reading page/section in one query —
 * avoids firing one independent request per rendered sentence (a real N+1:
 * a reading page can show several BookSentenceReader instances at once, each
 * of which needs its own Save/Note state). A sentence with no row is simply
 * absent from the returned map — callers fall back to EMPTY_MARK themselves
 * (see useBookSentenceMark), same "no row yet" convention as the single-
 * sentence read above.
 */
export async function fetchBookSentenceMarks(
  userId: string,
  sentenceIds: string[],
): Promise<Map<string, BookSentenceMark>> {
  const map = new Map<string, BookSentenceMark>();
  if (sentenceIds.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_sentence_marks")
    .select("sentence_id, is_bookmarked, note")
    .eq("user_id", userId)
    .in("sentence_id", sentenceIds);
  if (error) throw error;

  for (const row of data ?? []) {
    map.set(row.sentence_id, { isBookmarked: row.is_bookmarked, note: row.note });
  }
  return map;
}

/**
 * Sets (or clears) this sentence's bookmark flag, leaving any existing note
 * on the same row untouched — Supabase's upsert only writes the columns
 * given here, so `note` never gets clobbered by a bookmark-only toggle.
 */
export async function upsertBookmark(
  userId: string,
  bookId: string,
  sentenceId: string,
  isBookmarked: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("book_sentence_marks")
    .upsert(
      {
        user_id: userId,
        book_id: bookId,
        sentence_id: sentenceId,
        is_bookmarked: isBookmarked,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,sentence_id" },
    );
  if (error) throw error;
}

/**
 * Sets (or clears, with `note: null`) this sentence's note, leaving any
 * existing bookmark flag on the same row untouched when clearing (same
 * upsert-only-given-columns reasoning as upsertBookmark) — EXCEPT that
 * writing a real note also sets is_bookmarked true (Lightweight Save +
 * Notes system: "Adding a Note implicitly saves the sentence if it is not
 * already saved" — the user should never have to press Save first). Never
 * the reverse: clearing a note never un-saves the sentence, since Save and
 * Note are otherwise independent states. An empty/whitespace-only string is
 * normalized to null — "no note" has exactly one representation.
 */
export async function upsertNote(
  userId: string,
  bookId: string,
  sentenceId: string,
  note: string | null,
): Promise<void> {
  const supabase = await createClient();
  const fields = buildNoteMarkFields(note);
  const { error } = await supabase.from("book_sentence_marks").upsert(
    {
      user_id: userId,
      book_id: bookId,
      sentence_id: sentenceId,
      note: fields.note,
      ...(fields.isBookmarked ? { is_bookmarked: true } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,sentence_id" },
  );
  if (error) throw error;
}
