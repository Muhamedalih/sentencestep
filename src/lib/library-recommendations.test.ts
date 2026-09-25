import assert from "node:assert/strict";
import { test } from "node:test";

import { computeRecommendedBooks } from "./library-recommendations";
import type { Book, BookCategoryLink, Category, ContinueReadingEntry } from "@/types/library";

function makeCategory(id: string): Category {
  return { id, name: id, description: null, orderIndex: 0, isActive: true };
}

function makeBook(id: string, overrides: Partial<Book> & { categoryIds?: string[] } = {}): Book {
  const { categoryIds = [], ...bookOverrides } = overrides;
  const categories: BookCategoryLink[] = categoryIds.map((categoryId, index) => ({
    category: makeCategory(categoryId),
    isPrimary: index === 0,
  }));
  return {
    id,
    title: id,
    author: "Author",
    description: null,
    coverImageUrl: null,
    difficultyLevel: 1,
    isFeatured: false,
    isFree: true,
    freePreviewSentenceCount: 0,
    status: "published",
    orderIndex: 0,
    voiceId: null,
    type: "book",
    categories,
    ...bookOverrides,
  };
}

function toContinueReading(book: Book, progressPercent = 40): ContinueReadingEntry {
  return { book, progressPercent };
}

test("computeRecommendedBooks: falls back to the easiest unstarted books when there is no signal yet", () => {
  const easy = makeBook("easy", { difficultyLevel: 1, orderIndex: 2 });
  const hard = makeBook("hard", { difficultyLevel: 3, orderIndex: 1 });
  const result = computeRecommendedBooks({
    allBooks: [hard, easy],
    completedBooks: [],
    continueReading: [],
  });
  assert.deepEqual(
    result.map((b) => b.id),
    ["easy", "hard"],
  );
});

test("computeRecommendedBooks: excludes books the learner is already reading or has completed", () => {
  const inProgress = makeBook("in-progress", { orderIndex: 1 });
  const completed = makeBook("completed", { orderIndex: 2 });
  const untouched = makeBook("untouched", { orderIndex: 3 });
  const result = computeRecommendedBooks({
    allBooks: [inProgress, completed, untouched],
    completedBooks: [completed],
    continueReading: [toContinueReading(inProgress)],
  });
  assert.deepEqual(
    result.map((b) => b.id),
    ["untouched"],
  );
});

test("computeRecommendedBooks: ranks candidates that share a category with the learner's signal above those that don't", () => {
  const inProgress = makeBook("in-progress", { categoryIds: ["fiction"], orderIndex: 1 });
  const sameCategory = makeBook("same-category", { categoryIds: ["fiction"], orderIndex: 5 });
  const otherCategory = makeBook("other-category", { categoryIds: ["history"], orderIndex: 2 });
  const result = computeRecommendedBooks({
    allBooks: [otherCategory, sameCategory],
    completedBooks: [],
    continueReading: [toContinueReading(inProgress)],
  });
  assert.deepEqual(
    result.map((b) => b.id),
    ["same-category", "other-category"],
  );
});

test("computeRecommendedBooks: returns an empty list once every published book is already engaged with", () => {
  const onlyBook = makeBook("only");
  const result = computeRecommendedBooks({
    allBooks: [onlyBook],
    completedBooks: [onlyBook],
    continueReading: [],
  });
  assert.deepEqual(result, []);
});

test("computeRecommendedBooks: respects the limit", () => {
  const books = Array.from({ length: 15 }, (_, i) => makeBook(`book-${i}`, { orderIndex: i }));
  const result = computeRecommendedBooks({
    allBooks: books,
    completedBooks: [],
    continueReading: [],
    limit: 3,
  });
  assert.equal(result.length, 3);
});
