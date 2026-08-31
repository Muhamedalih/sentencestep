"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, PartyPopper, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { popIn } from "@/lib/motion";
import { learnerLevelSupportLabel, type LearnerLevelProgress } from "@/lib/progress/learner-level";
import type { DailyProgressState } from "@/lib/progress/types";
import type { Book } from "@/types/library";

/**
 * The dedicated Book Completion state (Section 13 of the spec) — shown once
 * a book's very last sentence is completed. Reuses LessonCompletion's exact
 * visual language (the same Stat/Progress pattern, the same t.lesson.* XP/
 * streak/daily-goal strings) rather than inventing a parallel style, so
 * finishing a book feels like the same app as finishing a lesson. XP/
 * streak/level rows are only shown when `isSignedIn` — a guest reading a
 * book never had those tracked in the first place (Continue Reading, and
 * therefore all book-progress persistence, has been signed-in-only since it
 * was first built), so showing zeroed-out reward stats here would be
 * misleading rather than honest.
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
  const { t } = useLocale();
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
      className="border-border bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-12 text-center"
    >
      <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
        <PartyPopper className="size-7" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {t.bookLibrary.bookCompleteHeading}
        </h2>
        <p className="text-muted-foreground mt-1" dir="ltr">
          {book.title}
        </p>
        <p className="text-muted-foreground mt-1">{t.bookLibrary.bookCompleteBody}</p>
      </div>

      <div className="grid w-full max-w-sm auto-cols-fr grid-flow-col gap-2">
        <Stat label={t.bookLibrary.sections} value={`${sectionCount}`} />
        <Stat label={t.bookLibrary.sentences} value={`${sentenceCount}`} />
        {isSignedIn && (
          <Stat
            label={t.lesson.streakLabel}
            value={
              <span className="inline-flex items-center gap-1">
                <Flame
                  className={streak > 0 ? "size-4 text-[var(--lesson-xp)]" : "size-4"}
                  aria-hidden="true"
                />
                {streak}
              </span>
            }
          />
        )}
      </div>

      {isSignedIn && sessionXpEarned > 0 && (
        <div className="text-accent-foreground flex items-center gap-1.5 rounded-lg border border-[var(--lesson-xp)]/40 bg-[var(--lesson-xp)]/10 px-4 py-2.5 text-sm font-medium">
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

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/learn/library">{t.bookLibrary.backToLibrary}</Link>
        </Button>
        <Button asChild>
          <Link href={`/learn/library/${book.id}`}>{t.bookLibrary.backToBookOverview}</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2 text-center">
      <div className="text-base font-semibold">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}
