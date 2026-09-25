import type { Book, ContinueReadingEntry } from "@/types/library";

/**
 * "Recommended for You" — a pure, in-memory ranking over books the caller
 * already fetched for the Library/Novels homepage (its full book list plus
 * that learner's own completedBooks/continueReading), never a new query: the
 * whole point of this function is a personalization signal that costs zero
 * extra Supabase round trips. Signal comes from the categories and
 * difficulty level of the books the learner has actually engaged with
 * (in-progress first, then completed — both already most-recent-first, see
 * fetchContinueReadingBooks/fetchCompletedBooks), weighted toward the most
 * recent ones. A reader with no signal yet (a guest, or nobody's started a
 * book) falls back to the easiest unstarted books, so the section never
 * renders empty on a first visit.
 */
export function computeRecommendedBooks({
  allBooks,
  completedBooks,
  continueReading,
  limit = 10,
}: {
  allBooks: Book[];
  completedBooks: Book[];
  continueReading: ContinueReadingEntry[];
  limit?: number;
}): Book[] {
  const engagedIds = new Set<string>([
    ...continueReading.map((entry) => entry.book.id),
    ...completedBooks.map((book) => book.id),
  ]);
  const candidates = allBooks.filter((book) => !engagedIds.has(book.id));
  if (candidates.length === 0) return [];

  const signalBooks = [...continueReading.map((entry) => entry.book), ...completedBooks];
  if (signalBooks.length === 0) {
    return [...candidates]
      .sort((a, b) => a.difficultyLevel - b.difficultyLevel || a.orderIndex - b.orderIndex)
      .slice(0, limit);
  }

  // A more recently engaged book counts for more than an older one, so the
  // ranking tracks what the learner is into now, not their all-time total.
  const categoryWeight = new Map<string, number>();
  for (const [index, book] of signalBooks.entries()) {
    const weight = signalBooks.length - index;
    for (const link of book.categories) {
      categoryWeight.set(link.category.id, (categoryWeight.get(link.category.id) ?? 0) + weight);
    }
  }
  const targetDifficulty = signalBooks[0]!.difficultyLevel;

  function score(book: Book): number {
    const categoryScore = book.categories.reduce(
      (total, link) => total + (categoryWeight.get(link.category.id) ?? 0),
      0,
    );
    const difficultyScore = book.difficultyLevel === targetDifficulty ? 1 : 0;
    return categoryScore * 2 + difficultyScore;
  }

  return [...candidates]
    .sort((a, b) => score(b) - score(a) || a.orderIndex - b.orderIndex)
    .slice(0, limit);
}
