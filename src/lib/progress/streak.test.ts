import { test } from "node:test";
import assert from "node:assert/strict";

import { todayLocalISODate, updateStreak } from "./streak";
import { emptyStreak } from "./types";

test("updateStreak: first-ever activity starts the streak at 1", () => {
  const result = updateStreak(emptyStreak, "2026-08-10");
  assert.deepEqual(result, {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: "2026-08-10",
  });
});

test("updateStreak: activity on the very next calendar day extends the streak", () => {
  const state = { currentStreak: 1, longestStreak: 1, lastActiveDate: "2026-08-10" };
  const result = updateStreak(state, "2026-08-11");
  assert.deepEqual(result, {
    currentStreak: 2,
    longestStreak: 2,
    lastActiveDate: "2026-08-11",
  });
});

test("updateStreak: a third consecutive day keeps extending", () => {
  const state = { currentStreak: 2, longestStreak: 2, lastActiveDate: "2026-08-11" };
  const result = updateStreak(state, "2026-08-12");
  assert.equal(result.currentStreak, 3);
  assert.equal(result.longestStreak, 3);
});

test("updateStreak: activity already recorded today is a no-op — same-day repeats never inflate the streak", () => {
  const state = { currentStreak: 4, longestStreak: 4, lastActiveDate: "2026-08-12" };
  const result = updateStreak(state, "2026-08-12");
  assert.deepEqual(result, state);
});

test("updateStreak: a gap of more than one day resets the streak to 1, not 0", () => {
  const state = { currentStreak: 5, longestStreak: 5, lastActiveDate: "2026-08-10" };
  const result = updateStreak(state, "2026-08-13");
  assert.deepEqual(result, {
    currentStreak: 1,
    longestStreak: 5,
    lastActiveDate: "2026-08-13",
  });
});

test("updateStreak: longestStreak never decreases, even after a reset", () => {
  const state = { currentStreak: 1, longestStreak: 7, lastActiveDate: "2026-08-01" };
  const result = updateStreak(state, "2026-08-05");
  assert.equal(result.longestStreak, 7);
});

test("updateStreak: a gap resetting to 1, then extending again, rebuilds correctly", () => {
  const afterGap = updateStreak(
    { currentStreak: 3, longestStreak: 3, lastActiveDate: "2026-08-01" },
    "2026-08-05",
  );
  const nextDay = updateStreak(afterGap, "2026-08-06");
  assert.equal(afterGap.currentStreak, 1);
  assert.equal(nextDay.currentStreak, 2);
});

test("todayLocalISODate: formats as YYYY-MM-DD", () => {
  const result = todayLocalISODate(new Date(2026, 7, 13, 23, 59));
  assert.equal(result, "2026-08-13");
});
