import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  daysBetween,
  freezesRemaining,
  monthPeriod,
  planStreakUpdate,
} from "@/lib/features/streak-freeze";
import { updateStreak } from "@/lib/progress/streak";
import type { StreakState } from "@/lib/progress/types";

const streakOf = (currentStreak: number, lastActiveDate: string | null): StreakState => ({
  currentStreak,
  longestStreak: currentStreak,
  lastActiveDate,
});

test("daysBetween / addDays: calendar arithmetic across month and DST boundaries", () => {
  assert.equal(daysBetween("2026-03-30", "2026-04-02"), 3);
  assert.equal(daysBetween("2026-03-28", "2026-03-30"), 2); // spring-forward week
  assert.equal(daysBetween("2026-10-24", "2026-10-26"), 2); // fall-back week
  assert.equal(addDays("2026-02-27", 2), "2026-03-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(monthPeriod("2026-09-30"), "2026-09");
});

test("planStreakUpdate: already active today changes nothing", () => {
  const streak = streakOf(4, "2026-09-10");
  const plan = planStreakUpdate(streak, "2026-09-10", 2);
  assert.equal(plan.streak, streak);
  assert.equal(plan.freezesUsed, 0);
});

test("planStreakUpdate: consecutive and one-missed-day cases match the original rules exactly", () => {
  for (const last of ["2026-09-09", "2026-09-08"]) {
    const streak = streakOf(4, last);
    const plan = planStreakUpdate(streak, "2026-09-10", 2);
    assert.deepEqual(plan.streak, updateStreak(streak, "2026-09-10"));
    assert.equal(plan.freezesUsed, 0);
  }
});

test("planStreakUpdate: a single missed day is forgiven for free and recorded as a grace bridge", () => {
  const plan = planStreakUpdate(streakOf(4, "2026-09-08"), "2026-09-10", 0);
  assert.equal(plan.streak.currentStreak, 5);
  assert.equal(plan.freezesUsed, 0);
  assert.deepEqual(plan.bridges, [{ day: "2026-09-09", kind: "grace" }]);
});

test("planStreakUpdate: two missed days spend one freeze on top of the free grace day", () => {
  const plan = planStreakUpdate(streakOf(4, "2026-09-07"), "2026-09-10", 1);
  assert.equal(plan.streak.currentStreak, 5);
  assert.equal(plan.streak.lastActiveDate, "2026-09-10");
  assert.equal(plan.freezesUsed, 1);
  assert.deepEqual(plan.bridges, [
    { day: "2026-09-08", kind: "grace" },
    { day: "2026-09-09", kind: "frozen" },
  ]);
});

test("planStreakUpdate: three missed days need two freezes", () => {
  const plan = planStreakUpdate(streakOf(9, "2026-09-06"), "2026-09-10", 2);
  assert.equal(plan.streak.currentStreak, 10);
  assert.equal(plan.streak.longestStreak, 10);
  assert.equal(plan.freezesUsed, 2);
  assert.equal(plan.bridges.length, 3);
});

test("planStreakUpdate: without enough freezes the streak resets and nothing is spent", () => {
  const streak = streakOf(9, "2026-09-06");
  const plan = planStreakUpdate(streak, "2026-09-10", 1);
  assert.equal(plan.streak.currentStreak, 1);
  assert.equal(plan.streak.longestStreak, 9);
  assert.equal(plan.freezesUsed, 0);
  assert.deepEqual(plan.bridges, []);
  assert.deepEqual(plan.streak, updateStreak(streak, "2026-09-10"));
});

test("planStreakUpdate: first ever activity and a clock that went backwards fall back to the original rules", () => {
  assert.equal(planStreakUpdate(streakOf(0, null), "2026-09-10", 2).streak.currentStreak, 1);
  const future = streakOf(3, "2026-09-12");
  assert.deepEqual(
    planStreakUpdate(future, "2026-09-10", 2).streak,
    updateStreak(future, "2026-09-10"),
  );
});

test("freezesRemaining: allowance minus this month's usage; an old month's usage doesn't count", () => {
  assert.equal(freezesRemaining(null, "2026-09", 2), 2);
  assert.equal(freezesRemaining({ period: "2026-09", used: 1 }, "2026-09", 2), 1);
  assert.equal(freezesRemaining({ period: "2026-08", used: 2 }, "2026-09", 2), 2);
  assert.equal(freezesRemaining({ period: "2026-09", used: 5 }, "2026-09", 2), 0);
  assert.equal(freezesRemaining(null, "2026-09", 0), 0);
});
