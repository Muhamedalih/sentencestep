"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, Flame, RotateCcw, Snowflake } from "lucide-react";

import type { LessonStatsMap } from "@/components/app/home-hero";
import { InitialsAvatar } from "@/components/app/initials-avatar";
import { StreakStrip } from "@/components/app/streak-strip";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import type { StreakCalendarData } from "@/lib/features/calendar-actions";
import { addDays } from "@/lib/features/streak-freeze";
import { isDailyGoalMet } from "@/lib/progress/daily-goal";
import type { CurrentUser } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

/** The last seven days as dots: practised, forgiven, covered by a freeze, or still to do (today dashed). */
function WeekDots({ today, strip }: { today: string; strip: StreakCalendarData }) {
  const days = Array.from({ length: 7 }, (_unused, index) => addDays(today, index - 6));
  return (
    <span className="flex items-center gap-1.5" dir="ltr" aria-hidden="true">
      {days.map((iso) => {
        const kind = strip.days.find((day) => day.day === iso)?.kind ?? "none";
        return (
          <span
            key={iso}
            className={cn(
              "size-3.5 rounded-full border-2",
              kind === "active" && "border-primary bg-primary",
              kind === "grace" && "border-primary/50",
              kind === "frozen" && "border-sky-400 bg-sky-400/15",
              kind === "none" &&
                (iso === today ? "border-primary/60 border-dashed" : "border-border"),
            )}
          />
        );
      })}
    </span>
  );
}

/** The small button for the words waiting to be reviewed: where Home still says so (the review itself is in Word Lists). */
function ReviewPill({ count }: { count: number }) {
  const { t } = useLocale();
  return (
    <Link
      href="/learn/word-lists/review"
      className="border-border bg-card hover:bg-muted/50 focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 pointer-coarse:h-11"
    >
      <RotateCcw className="text-primary size-4" aria-hidden="true" strokeWidth={1.8} />
      <span
        className="bg-primary/15 text-primary rounded-full px-2 text-xs font-semibold tabular-nums"
        dir="ltr"
      >
        {count}
      </span>
      <span dir="auto">
        {count === 1 ? t.lesson.wordReadyToReview : t.lesson.wordsReadyToReview}
      </span>
    </Link>
  );
}

/**
 * The top of the new Home page: the learner's avatar (ringed with today's goal), the greeting, the
 * three totals as one small line, and on the right the review button and the week (a flame, seven
 * dots, the freezes left). Tapping the week opens, right under it, the streak card of the current
 * Home — the same one, with its freezes and the month — so nothing is lost by it leaving the top
 * of the page. The totals come from the progress and the lessons Home already holds; the streak
 * arrives with the page (null when the feature is not open: the week is simply not drawn).
 */
export function HomeTopBar({
  user,
  lessonStats,
  sessionCount,
  reviewCount,
  today,
  streak,
  className,
}: {
  user: CurrentUser;
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  /** Words waiting for review (0: no button). */
  reviewCount: number;
  /** The learner's local date the week was loaded for. */
  today: string;
  streak: StreakCalendarData | null;
  className?: string;
}) {
  const { t } = useLocale();
  const { isLoaded, completions, dailyProgress } = useSharedProgress();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const ringPercent =
    dailyProgress.goal > 0
      ? Math.min(100, Math.round((dailyProgress.sentencesCompleted / dailyProgress.goal) * 100))
      : undefined;
  const totals = completions.reduce(
    (sum, completion) => {
      const stat = lessonStats[`${completion.mode}:${completion.lessonId}`];
      if (stat) {
        sum.sentences += stat.sentences;
        sum.words += stat.words;
      }
      return sum;
    },
    { sentences: 0, words: 0 },
  );
  const sessions = sessionCount ?? completions.length;
  const items: [string, number][] = [
    [t.stats.wordsLabel, totals.words],
    [t.stats.linesLabel, totals.sentences],
    [t.stats.sessionsLabel, sessions],
  ];
  const remaining = streak?.freezesRemaining ?? 0;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5">
        <div className="flex items-center gap-3.5">
          {isLoaded ? (
            <InitialsAvatar
              seed={user.id}
              displayName={user.displayName}
              email={user.email}
              className="size-12 text-lg"
              ringPercent={isDailyGoalMet(dailyProgress) ? 100 : ringPercent}
            />
          ) : (
            <span className="bg-muted size-12 animate-pulse rounded-full" aria-hidden="true" />
          )}
          <div className="flex flex-col gap-0.5">
            {user.displayName && (
              <span className="text-muted-foreground text-sm font-medium">
                {t.progress.welcomeBackLabel}
              </span>
            )}
            <span
              dir="ltr"
              className="truncate text-lg leading-tight font-extrabold tracking-tight"
            >
              {user.displayName ?? t.auth.loginHeading}
            </span>
            {isLoaded && (
              <span className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3.5 text-xs">
                {items.map(([label, value]) => (
                  <span key={label} className="inline-flex items-baseline gap-1">
                    <b className="text-foreground text-[13px] tabular-nums" dir="ltr">
                      {value}
                    </b>
                    {label}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          {reviewCount > 0 && <ReviewPill count={reviewCount} />}
          {streak && (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={t.streakCalendar.heading}
              className="hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex cursor-pointer items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors outline-none focus-visible:ring-2 pointer-coarse:min-h-11"
            >
              <Flame
                className="size-5 shrink-0 text-orange-500 dark:text-orange-400"
                aria-hidden="true"
              />
              <WeekDots today={today} strip={streak} />
              {remaining > 0 && (
                <span
                  className="text-muted-foreground flex items-center gap-1 text-xs"
                  title={t.streakCalendar.freezesLeft.replace("{n}", String(remaining))}
                >
                  <Snowflake className="size-3.5 text-sky-500" aria-hidden="true" />
                  <span dir="ltr">{remaining}</span>
                </span>
              )}
              <ChevronDown
                className={cn(
                  "text-muted-foreground size-4 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>
      {open && streak && (
        <div id={panelId} className="mt-4">
          <StreakStrip today={today} strip={streak} />
        </div>
      )}
    </div>
  );
}
