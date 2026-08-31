import { test } from "node:test";
import assert from "node:assert/strict";

import { isDailyGoalMet, updateDailyProgress } from "./daily-goal";
import { emptyDailyProgress } from "./types";

test("updateDailyProgress: first activity of a fresh day starts the count at what was just completed", () => {
  const result = updateDailyProgress(emptyDailyProgress, "2026-08-12", 3);
  assert.deepEqual(result, { date: "2026-08-12", sentencesCompleted: 3, goal: 5 });
});

test("updateDailyProgress: same-day activity accumulates", () => {
  const state = { date: "2026-08-12", sentencesCompleted: 3, goal: 5 };
  const result = updateDailyProgress(state, "2026-08-12", 2);
  assert.equal(result.sentencesCompleted, 5);
});

test("updateDailyProgress: a new calendar day resets the count rather than accumulating", () => {
  const state = { date: "2026-08-11", sentencesCompleted: 8, goal: 5 };
  const result = updateDailyProgress(state, "2026-08-12", 1);
  assert.deepEqual(result, { date: "2026-08-12", sentencesCompleted: 1, goal: 5 });
});

test("isDailyGoalMet: below goal is not met", () => {
  assert.equal(isDailyGoalMet({ date: "2026-08-12", sentencesCompleted: 4, goal: 5 }), false);
});

test("isDailyGoalMet: exactly at goal is met", () => {
  assert.equal(isDailyGoalMet({ date: "2026-08-12", sentencesCompleted: 5, goal: 5 }), true);
});

test("isDailyGoalMet: above goal is met", () => {
  assert.equal(isDailyGoalMet({ date: "2026-08-12", sentencesCompleted: 9, goal: 5 }), true);
});
