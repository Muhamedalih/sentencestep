"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { BookCard } from "@/components/app/book-card";
import { FeaturedBook } from "@/components/app/featured-book";
import { LibraryCategoryNav } from "@/components/app/library-category-nav";
import { LibraryEmptyState } from "@/components/app/library-empty-state";
import { LibrarySearch } from "@/components/app/library-search";
import { ReadingChallengeBanner } from "@/components/app/reading-challenge-banner";
import { useLocale } from "@/components/providers/locale-provider";
import { computeRecommendedBooks } from "@/lib/library-recommendations";
import { staggerChildren } from "@/lib/motion";
import type { MonthlyReadingChallenge } from "@/lib/reading-challenge";
import type { Book, CategoryWithBooks, ContinueReadingEntry } from "@/types/library";

interface LibraryHomeProps {
  categoriesWithBooks: CategoryWithBooks[];
  featuredBooks: Book[];
  continueReading: ContinueReadingEntry[];
  /** Books this learner has fully finished, most-recently-completed first — empty for a guest or a learner who hasn't finished one yet, in which case the shelf below simply doesn't render (see fetchCompletedBooks). */
  completedBooks: Book[];
  /** This month's reading-challenge progress (competitor report, Section 6.3) — server-computed from book_progress, renders nothing for a guest (see ReadingChallengeBanner). */
  monthlyChallenge: MonthlyReadingChallenge;
}

/**
 * The Library homepage (Section 3/21 of the spec): header, search, a
 * category filter row, Continue Reading when the learner has started
 * something, a single editorial Featured placement, then one section per
 * *populated* category — never a giant grid of every book, and never an
 * empty section taking up space. Search and the category filter combine
 * into one client-side filter over the already-fetched book list — Library
 * is small enough at this catalog size that a server round trip per
 * keystroke/click would be pure overhead; src/lib/supabase/queries/
 * library.ts's searchBooks exists for a future server-side search surface
 * if the catalog grows past what's reasonable to ship to the client.
 */
export function LibraryHome({
  categoriesWithBooks,
  featuredBooks,
  continueReading,
  completedBooks,
  monthlyChallenge,
}: LibraryHomeProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const allBooks = useMemo(() => {
    const byId = new Map<string, Book>();
    for (const book of featuredBooks) byId.set(book.id, book);
    for (const { books } of categoriesWithBooks) for (const book of books) byId.set(book.id, book);
    return [...byId.values()];
  }, [categoriesWithBooks, featuredBooks]);

  const trimmedQuery = query.trim().toLowerCase();
  const isFiltering = trimmedQuery !== "" || selectedCategoryId !== null;

  const filteredBooks = useMemo(() => {
    if (!isFiltering) return null;
    return allBooks.filter((book) => {
      const matchesCategory =
        !selectedCategoryId ||
        book.categories.some((link) => link.category.id === selectedCategoryId);
      const matchesQuery =
        !trimmedQuery ||
        book.title.toLowerCase().includes(trimmedQuery) ||
        book.author.toLowerCase().includes(trimmedQuery) ||
        book.categories.some((link) => link.category.name.toLowerCase().includes(trimmedQuery));
      return matchesCategory && matchesQuery;
    });
  }, [allBooks, isFiltering, selectedCategoryId, trimmedQuery]);

  const libraryIsEmpty = allBooks.length === 0;
  const populatedCategories = categoriesWithBooks.filter(({ books }) => books.length > 0);

  // Zero-cost personalization (competitor report, Section 6.2): ranked
  // entirely from data this page already fetched (allBooks + this learner's
  // own completedBooks/continueReading) — never a new Supabase query.
  const recommendedBooks = useMemo(
    () => computeRecommendedBooks({ allBooks, completedBooks, continueReading }),
    [allBooks, completedBooks, continueReading],
  );

  return (
    <div className="flex flex-col gap-12">
      <ReadingChallengeBanner challenge={monthlyChallenge} />
      <header className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.bookLibrary.heading}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">{t.bookLibrary.subtitle}</p>
          <p className="text-muted-foreground/80 mt-2 text-sm">{t.bookLibrary.libraryDisclaimer}</p>
        </div>
        <LibrarySearch value={query} onChange={setQuery} />
        <LibraryCategoryNav
          categories={populatedCategories.map(({ category }) => category)}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      </header>

      {isFiltering ? (
        <section>
          {filteredBooks && filteredBooks.length === 0 ? (
            trimmedQuery ? (
              <LibraryEmptyState
                icon="search"
                heading={t.bookLibrary.noSearchResultsHeading}
                body={t.bookLibrary.noSearchResultsBody}
              />
            ) : (
              <LibraryEmptyState
                heading={t.bookLibrary.categoryEmptyHeading}
                body={t.bookLibrary.categoryEmptyBody}
              />
            )
          ) : (
            <BookGrid books={filteredBooks ?? []} />
          )}
        </section>
      ) : libraryIsEmpty ? (
        <LibraryEmptyState heading={t.bookLibrary.emptyHeading} body={t.bookLibrary.emptyBody} />
      ) : (
        <>
          {continueReading.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {t.bookLibrary.continueReading}
              </h2>
              <BookGrid
                books={continueReading.map((entry) => entry.book)}
                progressById={
                  new Map(continueReading.map((entry) => [entry.book.id, entry.progressPercent]))
                }
              />
            </section>
          )}

          {recommendedBooks.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {t.bookLibrary.recommendedHeading}
              </h2>
              <BookGrid books={recommendedBooks} />
            </section>
          )}

          {completedBooks.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {t.bookLibrary.completedBooksHeading}
              </h2>
              <BookGrid books={completedBooks} completed />
            </section>
          )}

          {featuredBooks.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {t.bookLibrary.featuredHeading}
              </h2>
              <FeaturedBook book={featuredBooks[0]!} />
            </section>
          )}

          {populatedCategories.map(({ category, books }) => (
            <section key={category.id} className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">{category.name}</h2>
              <BookGrid books={books} />
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function BookGrid({
  books,
  progressById,
  completed = false,
}: {
  books: Book[];
  progressById?: Map<string, number>;
  /** True when every book in this grid is a finished one (the Completed Books shelf) — passed straight through to each BookCard's own `completed` badge. */
  completed?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5"
    >
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          progressPercent={progressById?.get(book.id)}
          completed={completed}
        />
      ))}
    </motion.div>
  );
}
