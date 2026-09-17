import type { StreakState } from "@/lib/progress/types";

export function todayLocalISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isYesterday(dateISO: string, todayISO: string): boolean {
  const today = new Date(`${todayISO}T00:00:00`);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return dateISO === todayLocalISODate(yesterday);
}

/**
 * True when exactly one calendar day was missed between the last recorded
 * activity and today (e.g. active Monday, next active Wednesday) — the one
 * quiet grace day a streak is allowed before it resets. A gap of two or more
 * missed days is not covered by this and still resets the streak.
 */
export function isGraceDay(lastActiveDate: string | null, todayISO: string): boolean {
  if (lastActiveDate === null) return false;
  const today = new Date(`${todayISO}T00:00:00`);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  return lastActiveDate === todayLocalISODate(twoDaysAgo);
}

/**
 * Advances the streak for activity happening "today" (local time). A no-op
 * if activity was already recorded today; resets to 1 if there's a gap —
 * unless that gap is exactly one missed day, which is quietly forgiven (see
 * isGraceDay) rather than breaking the streak, since a single missed day is
 * one of the most common reasons learners abandon a habit app entirely.
 */
export function updateStreak(
  streak: StreakState,
  todayISO: string = todayLocalISODate(),
): StreakState {
  if (streak.lastActiveDate === todayISO) return streak;

  const isConsecutive =
    streak.lastActiveDate !== null && isYesterday(streak.lastActiveDate, todayISO);
  const isGrace = isGraceDay(streak.lastActiveDate, todayISO);
  const currentStreak = isConsecutive || isGrace ? streak.currentStreak + 1 : 1;

  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastActiveDate: todayISO,
  };
}
