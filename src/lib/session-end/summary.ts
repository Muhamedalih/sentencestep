import { estimateSessionMinutes } from "@/lib/features/daily-session";
import { todayLocalISODate } from "@/lib/progress/streak";

/** The weekly rhythm the finish screen reports against: this many days with a session, out of the last seven. */
export const WEEK_TARGET_DAYS = 4;
export const WEEK_WINDOW_DAYS = 7;

/** A new lesson tomorrow is quoted as this long on the finish screen. */
export const LESSON_MINUTES = 3;

/**
 * How many of the last `windowDays` days (today included, learner-local) had at least one finished
 * lesson. Today always counts: the learner is finishing a session right now, and a completion that
 * is still being saved may not be in `completedAt` yet.
 */
export function activeDaysInWindow(
  completedAt: readonly string[],
  now: Date,
  windowDays: number = WEEK_WINDOW_DAYS,
): number {
  const days = new Set<string>([todayLocalISODate(now)]);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (windowDays - 1));
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  for (const iso of completedAt) {
    const when = new Date(iso);
    if (Number.isNaN(when.getTime()) || when < start || when > end) continue;
    days.add(todayLocalISODate(when));
  }
  return days.size;
}

/** Minutes quoted for tomorrow: the words that come back for review (about 20 seconds each) plus a new lesson, when one is waiting. */
export function estimateTomorrowMinutes(reviewWords: number, hasLesson: boolean): number {
  const review = reviewWords > 0 ? estimateSessionMinutes(reviewWords) : 0;
  return review + (hasLesson ? LESSON_MINUTES : 0);
}
