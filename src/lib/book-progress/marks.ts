// Pure, no I/O — the Lightweight Save + Notes system's note-normalization
// and "a note implies a save" rules, factored out of book-marks.ts/
// saved-sentences.ts so they're independently testable without a database.
// BookSentenceMark/EMPTY_MARK live here (not in book-marks.ts) specifically
// so client components (e.g. BookReadingSession) can import EMPTY_MARK as a
// real value without pulling in book-marks.ts's createClient, which imports
// "next/headers" — a server-only module that breaks the client bundle if
// any non-type-only binding from that file reaches client code.

export interface BookSentenceMark {
  isBookmarked: boolean;
  note: string | null;
}

/** "Neither bookmarked nor noted yet" — the fallback for a sentence with no book_sentence_marks row. */
export const EMPTY_MARK: BookSentenceMark = { isBookmarked: false, note: null };

/** "" / whitespace-only collapses to null — "no note" has exactly one representation, never an empty string sitting in the column. */
export function normalizeNote(note: string | null | undefined): string | null {
  return note?.trim() ? note.trim() : null;
}

/**
 * The column values a note write should apply — writing a real note also
 * sets is_bookmarked true (Lightweight Save + Notes system, Section 8:
 * "Adding a Note implicitly saves the sentence if it is not already saved" —
 * the learner should never have to press Save first). Clearing a note
 * (null) never touches is_bookmarked: Save and Note stay independent in
 * that direction, so un-setting a note can never silently un-save the
 * sentence (Section 7: "Removing a note must not automatically remove the
 * saved sentence").
 */
export function buildNoteMarkFields(note: string | null | undefined): {
  note: string | null;
  isBookmarked?: true;
} {
  const normalized = normalizeNote(note);
  return normalized ? { note: normalized, isBookmarked: true } : { note: normalized };
}

/**
 * Splits a "fetch limit+1 rows" result into the real page plus whether more
 * exist beyond it — one extra row fetched is cheaper than a separate COUNT
 * query just to answer "is there a next page" (see fetchMySavedSentences).
 */
export function splitPage<T>(rows: T[], limit: number): { page: T[]; hasMore: boolean } {
  const hasMore = rows.length > limit;
  return { page: hasMore ? rows.slice(0, limit) : rows, hasMore };
}
