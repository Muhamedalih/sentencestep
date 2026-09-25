"use client";

import { motion } from "framer-motion";

import { BookCard } from "@/components/app/book-card";
import { FeaturedNovel } from "@/components/app/featured-novel";
import { LibraryEmptyState } from "@/components/app/library-empty-state";
import { useLocale } from "@/components/providers/locale-provider";
import { staggerChildren } from "@/lib/motion";
import type { Book, ContinueReadingEntry } from "@/types/library";

interface NovelsHomeProps {
  novels: Book[];
  featuredNovels: Book[];
  continueReading: ContinueReadingEntry[];
  completedNovels: Book[];
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
}: NovelsHomeProps) {
  const { t } = useLocale();

  const isEmpty = novels.length === 0;

  return (
    <div className="flex flex-col gap-12">
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
