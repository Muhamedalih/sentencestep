"use client";

import Link from "next/link";
import { BookOpen, ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookSectionList } from "@/components/app/book-section-list";
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import type { ChapterStateInfo } from "@/lib/book-progress/chapter-state";
import type { Book, BookProgressSummary } from "@/types/library";

/**
 * The Book Overview page (Section 18 of the Book Learning Engine spec) —
 * cover, title, author, description, difficulty, real section/sentence
 * counts, progress when it exists, and Start/Continue Reading. Estimated
 * reading time is deliberately still "—": computing a real one needs every
 * sentence's actual text (see estimateMinutes in src/lib/levels.ts, which
 * sums word counts), and this page only fetches counts — never a fabricated
 * number, just an honestly-unavailable one, same principle as the disabled-
 * book case below. A book with zero sentences stays exactly as
 * non-playable as before (Section 18: "A book with zero sentences should
 * remain non-playable") — the reading button only ever appears once
 * `sentenceCount` is real.
 */
export function BookOverview({
  book,
  sectionCount,
  sentenceCount,
  progress,
  chapterStates,
}: {
  book: Book;
  sectionCount: number;
  sentenceCount: number;
  progress: BookProgressSummary;
  /** Every section's unlock state, in reading order — see deriveChapterStates. Empty for a book with no sections yet. */
  chapterStates: ChapterStateInfo[];
}) {
  const { locale, dir, t } = useLocale();
  const difficulty = difficultyForLevel(book.difficultyLevel);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;
  const primaryCategory = book.categories.find((link) => link.isPrimary)?.category;
  const isPlayable = sentenceCount > 0;
  const hasStarted = progress.completedSentenceCount > 0;
  const percent = isPlayable
    ? Math.min(100, (progress.completedSentenceCount / sentenceCount) * 100)
    : 0;
  const completedSectionCount = chapterStates.filter((entry) => entry.state === "completed").length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:py-16">
      <Link
        href="/learn/library"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        {t.bookLibrary.backToLibrary}
      </Link>

      <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
        <div className="bg-muted aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-2xl shadow-sm">
          {book.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL, see BookCard's identical choice.
            <img src={book.coverImageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="from-brand-muted to-muted flex size-full items-center justify-center bg-gradient-to-br">
              <BookOpen className="text-muted-foreground/50 size-12" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{tierText}</Badge>
            {primaryCategory && <Badge variant="secondary">{primaryCategory.name}</Badge>}
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight" dir="ltr">
              {book.title}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg" dir="ltr">
              {t.bookLibrary.byAuthor.replace("{author}", book.author)}
            </p>
          </div>

          {(book.supportDescription ?? book.description) && (
            <p
              className="text-muted-foreground max-w-2xl"
              dir={book.supportDescription ? dir : "ltr"}
            >
              {book.supportDescription ?? book.description}
            </p>
          )}

          <p className="text-muted-foreground/80 max-w-2xl text-sm" dir={dir}>
            {t.bookLibrary.libraryDisclaimer}
          </p>

          <dl
            className="text-muted-foreground grid grid-cols-3 gap-x-6 gap-y-2 text-sm sm:w-fit"
            dir={dir}
          >
            <div>
              <dt className="font-medium">{t.bookLibrary.sections}</dt>
              <dd>{sectionCount > 0 ? sectionCount : "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">{t.bookLibrary.sentences}</dt>
              <dd>{sentenceCount > 0 ? sentenceCount : "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">{t.bookLibrary.estimatedTime}</dt>
              <dd>—</dd>
            </div>
          </dl>

          {isPlayable && hasStarted && (
            <div className="max-w-xs">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {t.bookLibrary.percentComplete.replace("{percent}", String(Math.round(percent)))}
                </span>
              </div>
              <Progress value={percent} />
            </div>
          )}

          <div>
            {isPlayable ? (
              <Button size="lg" asChild>
                <Link href={`/learn/library/${book.id}/read`}>
                  {hasStarted ? t.bookLibrary.continueReading : t.bookLibrary.startReading}
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" disabled title={t.bookLibrary.overviewComingSoonBody}>
                  {t.bookLibrary.startReading}
                </Button>
                <p className="text-muted-foreground mt-2 text-sm">
                  {t.bookLibrary.overviewComingSoonBody}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {chapterStates.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4" dir={dir}>
            <h2 className="text-lg font-semibold tracking-tight">
              {t.bookLibrary.sectionsListHeading}
            </h2>
            <span className="text-muted-foreground text-sm font-medium tabular-nums">
              {t.bookLibrary.sectionsProgressLabel
                .replace("{completed}", String(completedSectionCount))
                .replace("{total}", String(chapterStates.length))}
            </span>
          </div>
          <BookSectionList bookId={book.id} states={chapterStates} />
        </div>
      )}
    </div>
  );
}
