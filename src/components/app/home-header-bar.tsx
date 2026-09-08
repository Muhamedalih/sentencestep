"use client";

import { InitialsAvatar } from "@/components/app/initials-avatar";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { isDailyGoalMet } from "@/lib/progress/daily-goal";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/supabase/auth";
import type { LessonStatsMap } from "@/components/app/home-hero";

function BigStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-3xl leading-none font-extrabold tabular-nums" dir="ltr">
        {value}
      </div>
      <div className="text-muted-foreground mt-2 text-[10.5px] font-bold tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

/**
 * The Home dashboard's borderless header (replaces the old HomeGreeting +
 * DashboardSummary two-card row): identity and raw totals float directly on
 * the page background with no card/border at all, per a reference screen
 * the user picked out (Line by Line's profile header) and explicitly asked
 * to have applied. The daily-goal ring around the avatar reuses the exact
 * InitialsAvatar/ringPercent mechanism AccountMenu's own header avatar
 * already relies on (see that component) rather than a new one.
 *
 * Streak, the daily-goal number, level/XP, and lessons-completed-overall —
 * all shown in the old DashboardSummary — are deliberately not reproduced
 * here; this header shows only identity plus sessions/lines/words, matching
 * exactly the screen fragment that was approved. If those other numbers
 * need a home elsewhere on the page, that's a separate follow-up.
 */
export function HomeHeaderBar({
  user,
  lessonStats,
  sessionCount,
  className,
}: {
  user: CurrentUser | null;
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  className?: string;
}) {
  const { t } = useLocale();
  const { isLoaded, completions, dailyProgress } = useSharedProgress();

  if (!isLoaded) {
    return (
      <div
        className={cn("flex flex-wrap items-center justify-between gap-6", className)}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3.5">
          <div className="bg-muted size-14 animate-pulse rounded-full" />
          <div className="flex flex-col gap-2">
            <div className="bg-muted h-4 w-28 animate-pulse rounded" />
            <div className="bg-muted h-6 w-36 animate-pulse rounded" />
          </div>
        </div>
        <div className="flex gap-8">
          <div className="bg-muted h-10 w-14 animate-pulse rounded" />
          <div className="bg-muted h-10 w-14 animate-pulse rounded" />
          <div className="bg-muted h-10 w-14 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  const ringPercent =
    dailyProgress.goal > 0
      ? Math.min(100, Math.round((dailyProgress.sentencesCompleted / dailyProgress.goal) * 100))
      : undefined;
  const goalMet = isDailyGoalMet(dailyProgress);

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

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-6", className)}>
      <div className="flex items-center gap-3.5">
        {user && (
          <InitialsAvatar
            seed={user.id}
            displayName={user.displayName}
            email={user.email}
            className="size-14 text-lg"
            ringPercent={goalMet ? 100 : ringPercent}
          />
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-sm font-medium">
            {t.progress.welcomeBackLabel}
          </span>
          {user?.displayName ? (
            <span dir="ltr" className="truncate text-lg font-extrabold tracking-tight">
              {user.displayName}
            </span>
          ) : (
            <span className="truncate text-lg font-extrabold tracking-tight">
              {t.auth.loginHeading}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        <BigStat value={totals.words} label={t.stats.wordsLabel} />
        <BigStat value={totals.sentences} label={t.stats.linesLabel} />
        <BigStat value={sessions} label={t.stats.sessionsLabel} />
      </div>
    </div>
  );
}
