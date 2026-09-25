"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

import { BookCard } from "@/components/app/book-card";
import { FeaturedNovel } from "@/components/app/featured-novel";
import { LibraryEmptyState } from "@/components/app/library-empty-state";
import { ReadingChallengeBanner } from "@/components/app/reading-challenge-banner";
import { useLocale } from "@/components/providers/locale-provider";
import { computeRecommendedBooks } from "@/lib/library-recommendations";
import { staggerChildren } from "@/lib/motion";
import type { MonthlyReadingChallenge } from "@/lib/reading-challenge";
import type { Book, ContinueReadingEntry } from "@/types/library";

interface NovelsHomeProps {
  novels: Book[];
  featuredNovels: Book[];
  continueReading: ContinueReadingEntry[];
  completedNovels: Book[];
  /** Same shared monthly challenge as LibraryHome — see its own doc comment. */
  monthlyChallenge: MonthlyReadingChallenge;
}

/**
 * The Novels homepage — same section order as LibraryHome (Continue
 * Reading, Completed, Featured, then the main catalog), deliberately
 * without LibraryHome's search box or category filter row: the Novels
 * catalog is a small, hand-curated set (a handful of titles), so neither
 * earns its keep the way they do over dozens of books. Admin-only route for
 * now — see this page's own isAdmin() gate in page.tsx — while the catalog
 * is still being written and reviewed as drafts.
 */
export function NovelsHome({
  novels,
  featuredNovels,
  continueReading,
  completedNovels,
  monthlyChallenge,
}: NovelsHomeProps) {
  const { t } = useLocale();

  const isEmpty = novels.length === 0;
  // Same zero-cost personalization as LibraryHome (competitor report,
  // Section 6.2) — reuses the exact shared ranking function over data this
  // page already fetched, so Books and Novels get it from one code path.
  const recommendedNovels = useMemo(
    () =>
      computeRecommendedBooks({
        allBooks: novels,
        completedBooks: completedNovels,
        continueReading,
      }),
    [novels, completedNovels, continueReading],
  );

  return (
    <div className="flex flex-col gap-12">
      <ReadingChallengeBanner challenge={monthlyChallenge} />
      <header className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.bookLibrary.novelsHeading}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">{t.bookLibrary.novelsSubtitle}</p>
          <p className="text-muted-foreground/80 mt-2 text-sm">{t.bookLibrary.novelsDisclaimer}</p>
        </div>
      </header>

      {isEmpty ? (
        <LibraryEmptyState
          heading={t.bookLibrary.novelsEmptyHeading}
          body={t.bookLibrary.novelsEmptyBody}
        />
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

          {recommendedNovels.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {t.bookLibrary.recommendedHeading}
              </h2>
              <BookGrid books={recommendedNovels} />
            </section>
          )}

          {completedNovels.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {t.bookLibrary.completedNovelsHeading}
              </h2>
              <BookGrid books={completedNovels} completed />
            </section>
          )}

          {featuredNovels.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {t.bookLibrary.featuredHeading}
              </h2>
              <FeaturedNovel book={featuredNovels[0]!} />
            </section>
          )}

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              {t.bookLibrary.allNovelsHeading}
            </h2>
            <BookGrid books={novels} />
          </section>
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
