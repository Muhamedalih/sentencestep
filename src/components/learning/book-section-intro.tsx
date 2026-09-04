"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { estimateMinutes } from "@/lib/levels";
import { popIn } from "@/lib/motion";
import type { Book, BookSectionWithSentences } from "@/types/library";

/**
 * Shown once, right before a section's first sentence — Section 19 of the
 * spec ("before starting a section, the user should understand what
 * they're about to read... keep it simple"). Only shown when the reader is
 * actually at a section's start (a fresh book, or one just advanced into) —
 * resuming mid-section skips straight to the sentence itself (see
 * BookReadingSession), since there's nothing to "begin" there.
 *
 * Styled as a book cover that has just opened to its first page (the
 * "book-intro-*" classes in globals.css) rather than a generic app card —
 * a cover panel in --lesson-book-cover (defaults to --brand, but is its own
 * admin-configurable role — see Admin -> Color Settings — precisely so it
 * can go off-white/cream without recoloring the rest of the lesson player),
 * a chapter numeral, and a layered page-stack shadow behind the whole card,
 * so this reads as "you're opening a book" instead of a popup/dialog. The
 * lighter panel below is the "page" the cover opened onto: title, this
 * section's own description (still the single field BookSection actually
 * has — no invented second field), real sentence/time counts, and the
 * start button.
 */
export function BookSectionIntro({
  book,
  section,
  sectionNumber,
  totalSectionCount,
  onBegin,
}: {
  book: Book;
  section: BookSectionWithSentences;
  /** 1-based position of this section within the book (section.orderIndex + 1) — drives both the cover numeral and the "Section N of Total" label. */
  sectionNumber: number;
  totalSectionCount: number;
  onBegin: () => void;
}) {
  const { t, dir } = useLocale();
  const minutes = estimateMinutes({ sentences: section.sentences });
  const coverProgress =
    totalSectionCount > 0 ? Math.min(100, (sectionNumber / totalSectionCount) * 100) : 0;

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      className="book-intro-frame w-full max-w-md overflow-hidden rounded-2xl"
    >
      <div className="book-intro-cover px-8 pt-8 pb-6 text-center">
        <div className="book-intro-ribbon" aria-hidden="true" />
        <p
          className="relative text-[0.62rem] font-semibold tracking-[0.22em] text-[color-mix(in_oklch,var(--lesson-book-cover-foreground)_68%,transparent)]"
          dir="ltr"
        >
          {book.title.toUpperCase()}
        </p>
        <p
          className="font-book relative mt-2 text-5xl leading-none font-bold text-[var(--lesson-book-cover-foreground)] [text-shadow:0_2px_12px_oklch(0_0_0/0.28)]"
          dir="ltr"
        >
          {sectionNumber}
        </p>
        <p className="relative mt-1.5 text-sm font-semibold text-[color-mix(in_oklch,var(--lesson-book-cover-foreground)_85%,transparent)]">
          {t.bookLibrary.sectionOfTotal
            .replace("{n}", String(sectionNumber))
            .replace("{total}", String(totalSectionCount))}
        </p>
        <div className="relative mx-auto mt-4 h-1 w-24 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--lesson-book-cover-foreground)_25%,transparent)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
            style={{ width: `${coverProgress}%` }}
          />
        </div>
      </div>

      <div className="book-intro-page bg-card flex flex-col items-center gap-4 px-7 pt-7 pb-8 text-center">
        <h2 className="font-book text-xl leading-snug font-bold text-balance" dir={dir}>
          {section.supportTitle ?? section.title}
        </h2>
        <span className="h-0.5 w-9 rounded-full bg-[var(--accent)]" aria-hidden="true" />

        {(section.supportDescription ?? section.description) && (
          <p
            className="border-primary/50 text-foreground w-full border-s-2 ps-3.5 text-start text-sm leading-relaxed"
            dir={dir}
          >
            {section.supportDescription ?? section.description}
          </p>
        )}

        <p className="text-muted-foreground text-xs">
          {section.sentences.length} {t.bookLibrary.sentences}
          <span className="mx-1.5 opacity-50">·</span>
          {t.bookLibrary.estimatedMinutes.replace("{minutes}", String(minutes))}
        </p>

        <Button onClick={onBegin} size="lg" className="w-full gap-2 rounded-full">
          <Play className="size-4" fill="currentColor" aria-hidden="true" />
          {t.bookLibrary.beginSection}
        </Button>
      </div>
    </motion.div>
  );
}
