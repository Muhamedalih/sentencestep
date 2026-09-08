"use client";

import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
 * The Home dashboard's single top card (visual redesign pass) — merges what
 * used to be two adjacent cards, HomeGreeting's identity/CTA and
 * DashboardSummary's daily-goal/streak/session stats, into one bordered
 * card. Also drops the overall-lessons-complete and level/XP line the old
 * DashboardSummary used to close with: that line repeated numbers already
 * shown elsewhere (the account menu) and was consistently the least-needed
 * information competing for attention on first paint, per user feedback.
 * Sessions/lines/words and the daily goal/streak stay exactly as before —
 * only the wrapping and that one trailing line changed.
 *
 * The streak flame uses a dedicated muted violet instead of --accent
 * (kept local to this component, not a theme token) so recoloring it here
 * doesn't also recolor XP badges/icons elsewhere in the app that read
 * --accent directly.
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
        className={cn("border-border/60 bg-card/60 rounded-2xl border p-5 sm:p-6", className)}
        aria-hidden="true"
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
          <div className="bg-muted h-9 w-40 animate-pulse rounded" />
          <div className="bg-muted h-9 w-16 animate-pulse rounded" />
          <div className="bg-muted h-5 min-w-[180px] flex-1 animate-pulse rounded" />
        </div>
        <div className="border-border/50 mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-4">
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

  return (
    <div className={cn("border-border/60 bg-card/60 rounded-2xl border p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        {/* Identity + CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-sm font-medium">
              {t.progress.welcomeBackLabel}
            </p>
            {displayName ? (
              <div
                dir="ltr"
                className="w-fit -rotate-1 rounded-xl bg-[oklch(0.96_0.015_85)] px-4 py-2 text-[oklch(0.32_0.03_60)] shadow-[0_2px_0_0_oklch(0.85_0.03_80)]"
              >
                <span
                  dir="auto"
                  className="block truncate text-lg font-bold tracking-tight sm:text-xl"
                >
                  {displayName}
                </span>
              </div>
            ) : (
              <p className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                {t.auth.loginHeading}
              </p>
            )}
          </div>
          {currentLesson && (
            <Button asChild>
              <Link href={`/learn/normal/${currentLesson.id}`}>
                {ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>

        {/* Streak — deliberately the largest number on this card, since it's
            the one stat most likely to bring a learner back tomorrow. Muted
            violet instead of --accent (amber), scoped to this component. */}
        <div className="flex items-center gap-2.5">
          <Flame
            className={cn(
              "size-7",
              streak.currentStreak > 0
                ? "text-[oklch(0.52_0.09_296)] dark:text-[oklch(0.6_0.045_296)]"
                : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span
              className="text-2xl leading-none font-extrabold tabular-nums sm:text-3xl"
              dir="ltr"
            >
              {streak.currentStreak}
            </span>
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {streak.currentStreak === 1
                ? t.progress.streakUnitSingular
                : t.progress.streakUnitPlural}
            </span>
          </div>
        </div>

        {/* Daily goal */}
        <div className="min-w-[180px] flex-1">
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold">{t.lesson.dailyGoalLabel}</span>
            <span className="tabular-nums">
              {Math.min(dailyProgress.sentencesCompleted, dailyProgress.goal)} /{" "}
              {dailyProgress.goal} {t.lesson.sentencesUnit}
            </span>
          </div>
          <Progress value={dailyGoalPercent} className="h-2" />
        </div>
      </div>

      {/* Secondary context — sessions/lines/words, visually quieter than the
          streak and daily goal above. */}
      <div className="border-border/50 text-muted-foreground mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4">
        <MiniStat value={sessions} label={t.stats.sessionsLabel} />
        <MiniStat value={totals.sentences} label={t.stats.linesLabel} />
        <MiniStat value={totals.words} label={t.stats.wordsLabel} />
      </div>
    </div>
  );
}
