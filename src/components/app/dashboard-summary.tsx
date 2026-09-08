"use client";

import { Flame } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { learnerLevelSupportLabel } from "@/lib/progress/learner-level";
import { cn } from "@/lib/utils";
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
 * The Home dashboard's top progress/statistics block (redesign, Section 1;
 * reorganized in the Home organization pass) — every value here is still
 * computed exactly as it always was. Reordered top-to-bottom by how often a
 * returning learner actually needs each number: the daily goal (the one
 * "what do I do today" answer) first, the streak second (large — the single
 * most motivating number on this whole page, per the reorganization
 * request), then Sessions/Lines/Words/level+XP as smaller secondary context
 * rather than three equally-weighted headline numbers competing with the
 * streak for attention.
 */
export function DashboardSummary({
  totalLessons,
  lessonStats,
  sessionCount,
  className,
}: {
  totalLessons: number;
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  className?: string;
}) {
  const { isLoaded, completions, streak, xp, learnerLevel, dailyProgress } = useSharedProgress();
  const { t } = useLocale();

  if (!isLoaded) {
    // Neutral pulse instead of flashing "no streak" / "0 lessons complete"
    // for a returning learner whose real progress hasn't loaded yet.
    return (
      <div
        className={cn("border-border/60 bg-card/60 rounded-2xl border p-5 sm:p-6", className)}
        aria-hidden="true"
      >
        <div className="bg-muted h-5 w-full max-w-xs animate-pulse rounded" />
        <div className="border-border/50 mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-4">
          <div className="bg-muted h-10 w-24 animate-pulse rounded" />
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
  const overallPercent =
    totalLessons > 0 ? Math.round((completions.length / totalLessons) * 100) : 0;

  return (
    <div className={cn("border-border/60 bg-card/60 rounded-2xl border p-5 sm:p-6", className)}>
      {/* Daily goal — the page's single "what should I do today" answer,
          shown first and full-width rather than as a corner detail. */}
      <div>
        <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-sm">
          <span className="font-semibold">{t.lesson.dailyGoalLabel}</span>
          <span className="tabular-nums">
            {Math.min(dailyProgress.sentencesCompleted, dailyProgress.goal)} / {dailyProgress.goal}{" "}
            {t.lesson.sentencesUnit}
          </span>
        </div>
        <Progress value={dailyGoalPercent} className="h-2" />
      </div>

      <div className="border-border/50 mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t pt-4">
        {/* Streak — deliberately the largest, most prominent number on this
            card now (flame icon + big tabular digit), since it's the one
            stat most likely to bring a learner back tomorrow. */}
        <div className="flex items-center gap-2.5">
          <Flame
            className={cn(
              "size-7",
              streak.currentStreak > 0 ? "text-accent" : "text-muted-foreground",
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

        {/* Secondary context — same numbers as before, just visually quieter
            than the streak now: sessions/lines/words plus overall/level/XP. */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2">
          <MiniStat value={sessions} label={t.stats.sessionsLabel} />
          <MiniStat value={totals.sentences} label={t.stats.linesLabel} />
          <MiniStat value={totals.words} label={t.stats.wordsLabel} />
        </div>
      </div>

      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          {t.progress.lessonsCompleteOverall
            .replace("{completed}", String(completions.length))
            .replace("{total}", String(totalLessons))}
          {totalLessons > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {overallPercent}%
            </Badge>
          )}
        </span>
        <span>
          {learnerLevelSupportLabel(learnerLevel.level.name, t)} · {xp} XP
        </span>
      </div>
    </div>
  );
}
