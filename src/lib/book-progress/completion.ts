// Pure, no I/O — the book-completion determination used by
// fetchBookProgressAction (src/lib/book-progress/actions.ts). Split out so
// this specific piece of logic — the one that decides whether a reader sees
// the Book Completion screen — can be unit tested without a live database.

/**
 * Whether a reader has genuinely finished a book, given how many sentences
 * they've completed and how many currently exist in it.
 *
 * Deliberately NOT "the reader's current-sentence pointer is null" — that
 * alone can't distinguish genuine completion from a pointer nulled by an
 * admin content edit (book_progress's pointer columns are `on delete set
 * null`, and both scenarios produce the identical null-pointer row shape).
 * completedSentenceCount is a real counter, only ever incremented by
 * complete_book_sentence on a genuine advance and never touched by a
 * content edit; totalSentenceCount is a live count of the book's current
 * sentences. Comparing the two is true exactly when the reader has advanced
 * through at least as many sentences as currently exist — what "finished"
 * means — regardless of whether their pointer happens to be null right now
 * for an unrelated reason.
 */
export function isBookProgressComplete(
  completedSentenceCount: number,
  totalSentenceCount: number,
): boolean {
  return totalSentenceCount > 0 && completedSentenceCount >= totalSentenceCount;
}
