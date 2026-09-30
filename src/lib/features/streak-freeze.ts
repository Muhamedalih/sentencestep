import type { StreakState } from "@/lib/progress/types";
import { todayLocalISODate, updateStreak } from "@/lib/progress/streak";

/**
 * Streak protection, layered on top of the existing one-missed-day grace
 * rule (src/lib/progress/streak.ts): a single missed day is always forgiven
 * for free; every ADDITIONAL consecutive missed day beyond that can be
 * covered by a streak freeze from the learner's monthly balance, consumed
 * automatically. Without enough freezes the streak resets exactly as before.
 *
 * Pure and dependency-light on purpose (dates as local YYYY-MM-DD strings,
 * like streak.ts) so it runs identically wherever it's used and is directly
 * unit-testable.
 */

/** A day the streak was carried across without the learner practicing: "grace" = the free forgiven day, "frozen" = covered by a freeze. */
export type BridgeKind = "grace" | "frozen";

export interface StreakBridgeDay {
  day: string;
  kind: BridgeKind;
}

export interface StreakPlan {
  streak: StreakState;
  /** How many freezes this completion needs to spend (0 when none). */
  freezesUsed: number;
  /** Missed days the streak was carried across, oldest first. Empty for a normal consecutive day or a reset. */
  bridges: StreakBridgeDay[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseLocalDate(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  // UTC arithmetic on a date-only value: immune to DST shifts, which would
  // make "24h" days occasionally 23 or 25 hours in local time.
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Whole calendar days from `fromISO` to `toISO` (positive when `toISO` is later). */
export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parseLocalDate(toISO) - parseLocalDate(fromISO)) / MS_PER_DAY);
}

export function addDays(iso: string, delta: number): string {
  const date = new Date(parseLocalDate(iso) + delta * MS_PER_DAY);
  return todayLocalISODate(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** "YYYY-MM" of a local date — the key the monthly freeze allowance resets on. */
export function monthPeriod(iso: string): string {
  return iso.slice(0, 7);
}

/**
 * Decides what completing a lesson on `todayISO` does to the streak, given
 * how many freezes the learner has left this month. Never spends a freeze
 * unless it actually saves the streak.
 */
export function planStreakUpdate(
  streak: StreakState,
  todayISO: string,
  freezesAvailable: number,
): StreakPlan {
  const last = streak.lastActiveDate;
  if (last === todayISO) return { streak, freezesUsed: 0, bridges: [] };

  const gap = last === null ? null : daysBetween(last, todayISO);
  // No history, or a clock that went backwards (timezone travel): the
  // original rules decide, exactly as before this feature existed.
  if (last === null || gap === null || gap < 1) {
    return { streak: updateStreak(streak, todayISO), freezesUsed: 0, bridges: [] };
  }

  const missed = gap - 1;
  if (missed === 0) {
    return { streak: updateStreak(streak, todayISO), freezesUsed: 0, bridges: [] };
  }

  // One missed day is always forgiven; the rest each cost a freeze.
  const freezesNeeded = missed - 1;
  if (freezesNeeded > freezesAvailable) {
    return { streak: updateStreak(streak, todayISO), freezesUsed: 0, bridges: [] };
  }

  const currentStreak = streak.currentStreak + 1;
  const bridges: StreakBridgeDay[] = [];
  for (let offset = 1; offset <= missed; offset++) {
    bridges.push({ day: addDays(last, offset), kind: offset === 1 ? "grace" : "frozen" });
  }
  return {
    streak: {
      currentStreak,
      longestStreak: Math.max(streak.longestStreak, currentStreak),
      lastActiveDate: todayISO,
    },
    freezesUsed: freezesNeeded,
    bridges,
  };
}

/** Freezes left this month: the admin's monthly allowance minus what this month's usage row records (a stale row from an earlier month counts as unused). */
export function freezesRemaining(
  usage: { period: string; used: number } | null,
  currentPeriod: string,
  monthlyAllowance: number,
): number {
  const used = usage && usage.period === currentPeriod ? usage.used : 0;
  return Math.max(0, monthlyAllowance - used);
}
