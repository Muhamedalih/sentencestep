"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Flame, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { popIn } from "@/lib/motion";
import { learnerLevelSupportLabel, type LearnerLevelProgress } from "@/lib/progress/learner-level";
import type { DailyProgressState } from "@/lib/progress/types";
import type { Book } from "@/types/library";

/**
 * The dedicated Book Completion state (Section 13 of the spec) — shown once
 * a book's very last sentence is completed. Shares BookSectionIntro's "book
 * cover" visual language (same book-intro-* classes, same admin-configurable
 * --lesson-book-cover) but in a closed/finished state — a checkmark badge
 * instead of a chapter numeral, and no progress dots, since there's nothing
 * left to advance through. The quote under the lead line is the book's own
 * `description` (the same real field Book Overview already shows), reframed
 * retrospectively as a takeaway — never an invented "what you learned"
 * field. XP/streak/level rows are only shown when `isSignedIn` — a guest
 * reading a book never had those tracked in the first place (Continue
 * Reading, and therefore all book-progress persistence, has been signed-in-
 * only since it was first built), so showing zeroed-out reward stats here
 * would be misleading rather than honest.
 */
export function BookCompletion({
  book,
  sectionCount,
  sentenceCount,
  isSignedIn,
  sessionXpEarned,
  xp,
  streak,
  dailyProgress,
  learnerLevel,
}: {
  book: Book;
  sectionCount: number;
  sentenceCount: number;
  isSignedIn: boolean;
  sessionXpEarned: number;
  xp: number;
  streak: number;
  dailyProgress: DailyProgressState;
  learnerLevel: LearnerLevelProgress;
}) {
  const reducedMotion = useReducedMotion();
  const { t, dir } = useLocale();
  const dailyGoalPercent = Math.min(
    100,
    Math.round((dailyProgress.sentencesCompleted / (dailyProgress.goal || 1)) * 100),
  );

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      className="book-intro-frame w-full max-w-md overflow-hidden rounded-2xl"
    >
      <div className="book-intro-cover px-8 pt-8 pb-7 text-center">
        <div className="book-intro-ribbon" aria-hidden="true" />
        <p
          className="relative text-[0.62rem] font-semibold tracking-[0.22em] text-[color-mix(in_oklch,var(--lesson-book-cover-foreground)_68%,transparent)]"
          dir="ltr"
        >
          {book.title.toUpperCase()}
        </p>
        <div className="relative mx-auto mt-3 flex size-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--lesson-book-cover)]">
          <Check className="size-6" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <p className="relative mt-2 text-sm font-semibold text-[color-mix(in_oklch,var(--lesson-book-cover-foreground)_90%,transparent)]">
          {t.bookLibrary.bookCompleteHeading}
        </p>
      </div>

      <div className="book-intro-page bg-card flex flex-col items-center gap-4 px-7 pt-7 pb-8 text-center">
        <p className="text-muted-foreground text-sm">{book.title}</p>

        {book.description && (
          <div className="w-full text-start" dir={dir}>
            <span className="text-primary mb-1 block text-xs font-bold">
              {t.bookLibrary.bookCompleteLead}
            </span>
            <p className="border-primary/50 text-foreground border-s-2 ps-3.5 text-sm leading-relaxed">
              {book.description}
            </p>
          </div>
        )}

        <div className="divide-border grid w-full grid-cols-3 divide-x">
          <Stat value={sectionCount} label={t.bookLibrary.sections} />
          <Stat value={sentenceCount} label={t.bookLibrary.sentences} />
          {isSignedIn && (
            <Stat
              value={
                <span className="inline-flex items-center gap-1">
                  <Flame
                    className={streak > 0 ? "size-4 text-[var(--lesson-xp)]" : "size-4"}
                    aria-hidden="true"
                  />
                  {streak}
                </span>
              }
              label={t.lesson.streakLabel}
            />
          )}
        </div>

        {isSignedIn && sessionXpEarned > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--lesson-xp)]">
            <Sparkles className="size-4 shrink-0" aria-hidden="true" />+{sessionXpEarned}{" "}
            {t.lesson.xpEarnedLabel}
          </div>
        )}

        {isSignedIn && (
          <>
            <div className="w-full max-w-sm text-left">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">{t.lesson.dailyGoalLabel}</span>
                <span className="text-muted-foreground">
                  {Math.min(dailyProgress.sentencesCompleted, dailyProgress.goal)} /{" "}
                  {dailyProgress.goal} {t.lesson.sentencesUnit}
                </span>
              </div>
              <Progress value={dailyGoalPercent} />
            </div>

            <div className="w-full max-w-sm text-left">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {learnerLevelSupportLabel(learnerLevel.level.name, t)}
                </span>
                {learnerLevel.next && (
                  <span className="text-muted-foreground" dir="ltr">
                    {xp - learnerLevel.level.minXp} /{" "}
                    {learnerLevel.next.minXp - learnerLevel.level.minXp} XP
                  </span>
                )}
              </div>
              <Progress value={learnerLevel.progress * 100} />
            </div>
          </>
        )}

        <div className="mt-1 flex w-full flex-wrap items-center justify-center gap-3">
          <Button variant="outline" asChild className="flex-1 rounded-full">
            <Link href="/learn/library">{t.bookLibrary.backToLibrary}</Link>
          </Button>
          <Button asChild className="flex-1 rounded-full">
            <Link href={`/learn/library/${book.id}`}>{t.bookLibrary.backToBookOverview}</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="px-2 text-center first:ps-0 last:pe-0">
      <div className="text-base font-semibold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}
