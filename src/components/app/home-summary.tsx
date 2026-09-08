"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { cn } from "@/lib/utils";
import type { LessonUnit } from "@/types/content";
import type { LessonStatsMap } from "@/components/app/home-hero";

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-base font-bold tabular-nums" dir="ltr">
        {value}
      </span>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
    </div>
  );
}

/**
 * The Home dashboard's single top card — merges what used to be two adjacent
 * cards, HomeGreeting's identity/CTA and DashboardSummary's daily-goal/
 * streak/session stats, into one bordered card, streak-led: the current
 * streak renders as a large hero number with a faint flame watermark behind
 * it (the one number most likely to bring a learner back tomorrow), with
 * identity/CTA beside it, the daily goal below, and sessions/lines/words as
 * quiet secondary context under a divider. Drops the overall-lessons-complete
 * and level/XP line the old DashboardSummary used to close with — that line
 * repeated numbers already shown elsewhere (the account menu) and was
 * consistently the least-needed information competing for attention on
 * first paint, per user feedback.
 *
 * The violet used for the streak number/watermark/goal-bar fill is a
 * dedicated muted color, not --accent (kept local to this component) so
 * recoloring it here doesn't also recolor XP badges/icons elsewhere in the
 * app that read --accent directly.
 */
export function HomeSummary({
  displayName,
  units,
  isPremiumUser,
  lessonStats,
  sessionCount,
  className,
}: {
  displayName: string | null;
  units: LessonUnit[];
  isPremiumUser: boolean;
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  className?: string;
}) {
  const { t } = useLocale();
  const progress = useSharedProgress();
  const { isLoaded, completedIds, currentLesson } = useCurrentLesson(
    units,
    isPremiumUser,
    progress,
  );
  const { completions, streak, dailyProgress } = progress;

  if (!isLoaded) {
    // Neutral pulse instead of flashing "no streak" / "0 lessons complete"
    // for a returning learner whose real progress hasn't loaded yet.
    return (
      <div
        className={cn("border-border/60 bg-card/60 rounded-2xl border p-6 sm:p-7", className)}
        aria-hidden="true"
      >
        <div className="flex flex-wrap items-end gap-6">
          <div className="bg-muted h-14 w-20 animate-pulse rounded" />
          <div className="flex min-w-[200px] flex-1 flex-col gap-2.5">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-9 w-40 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-muted mt-6 h-5 w-full animate-pulse rounded" />
        <div className="border-border/50 mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-4">
          <div className="bg-muted h-5 w-40 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  const totals = completions.reduce(
    (acc, completion) => {
      const stat = lessonStats[`${completion.mode}:${completion.lessonId}`];
      if (stat) {
        acc.sentences += stat.sentences;
        acc.words += stat.words;
      }
      return acc;
    },
    { sentences: 0, words: 0 },
  );
  const sessions = sessionCount ?? completions.length;
  const dailyGoalPercent = Math.min(
    100,
    Math.round((dailyProgress.sentencesCompleted / (dailyProgress.goal || 1)) * 100),
  );
  const ctaLabel = completedIds.length > 0 ? t.common.continueLearning : t.common.startLearning;

  const violetText = "text-[oklch(0.52_0.09_296)] dark:text-[oklch(0.6_0.045_296)]";
  const violetBg = "bg-[oklch(0.52_0.09_296)] dark:bg-[oklch(0.6_0.045_296)]";

  return (
    <div
      className={cn(
        "border-border/60 bg-card/60 relative overflow-hidden rounded-2xl border p-6 sm:p-7",
        className,
      )}
    >
      {/* Faint flame watermark behind the streak number — purely decorative. */}
      <svg
        className={cn("pointer-events-none absolute -start-5 -bottom-8 size-48", violetText)}
        style={{ opacity: 0.1 }}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 22c-4 0-7-3-7-6.5 0-3 2-5 3-7 .5 1.5 1.5 2.5 2.5 2.5 1 0 1-1 1-2 0-2 1-4 3-5.5 0 2 1 3.5 2.5 5C18.5 10 19 12 19 14c0 4.5-3 8-7 8Z"
          fill="currentColor"
        />
      </svg>

      {/* Streak — the largest, most prominent number on this card, since
          it's the one stat most likely to bring a learner back tomorrow.
          Muted violet instead of --accent (amber), scoped to this component. */}
      <div className="relative flex flex-wrap items-end gap-6">
        <div>
          <div
            className={cn(
              "font-mono text-5xl leading-none font-extrabold tabular-nums",
              violetText,
            )}
            dir="ltr"
          >
            {streak.currentStreak}
          </div>
          <div className="text-muted-foreground mt-1.5 text-xs font-semibold">
            {streak.currentStreak === 1
              ? t.progress.streakUnitSingular
              : t.progress.streakUnitPlural}{" "}
            🔥
          </div>
        </div>

        <div className="flex min-w-[200px] flex-1 flex-col gap-2.5">
          <span className="text-muted-foreground text-sm font-medium">
            {t.progress.welcomeBackLabel}
          </span>
          {displayName ? (
            <span dir="ltr" className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              {displayName}
            </span>
          ) : (
            <span className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              {t.auth.loginHeading}
            </span>
          )}
          {currentLesson && (
            <Button asChild className="mt-1 w-fit">
              <Link href={`/learn/normal/${currentLesson.id}`}>
                {ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Daily goal — its own full-width line, violet fill matching the
          streak above (hand-rolled here rather than the shared Progress
          component, which hardcodes its fill to bg-primary). */}
      <div className="relative mt-6">
        <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-sm">
          <span className="font-semibold">{t.lesson.dailyGoalLabel}</span>
          <span className="tabular-nums">
            {Math.min(dailyProgress.sentencesCompleted, dailyProgress.goal)} / {dailyProgress.goal}{" "}
            {t.lesson.sentencesUnit}
          </span>
        </div>
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500 ease-out", violetBg)}
            style={{ width: `${dailyGoalPercent}%` }}
          />
        </div>
      </div>

      {/* Secondary context — sessions/lines/words, visually quieter than the
          streak and daily goal above. */}
      <div className="border-border/50 text-muted-foreground relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4">
        <MiniStat value={sessions} label={t.stats.sessionsLabel} />
        <MiniStat value={totals.sentences} label={t.stats.linesLabel} />
        <MiniStat value={totals.words} label={t.stats.wordsLabel} />
      </div>
    </div>
  );
}
