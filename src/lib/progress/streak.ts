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
 * Advances the streak for activity happening "today" (local time). A no-op
 * if activity was already recorded today; resets to 1 if there's a gap.
 */
export function updateStreak(
  streak: StreakState,
  todayISO: string = todayLocalISODate(),
): StreakState {
  if (streak.lastActiveDate === todayISO) return streak;

  const isConsecutive =
    streak.lastActiveDate !== null && isYesterday(streak.lastActiveDate, todayISO);
  const currentStreak = isConsecutive ? streak.currentStreak + 1 : 1;

  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastActiveDate: todayISO,
  };
}
