import { test } from "node:test";
import assert from "node:assert/strict";

import { calculateLessonXp } from "./xp";

test("calculateLessonXp: base case, no bonuses", () => {
  assert.equal(
    calculateLessonXp({ accuracy: 0.8, isFirstCompletion: false, dailyGoalMet: false }),
    20,
  );
});

test("calculateLessonXp: high accuracy adds a bonus", () => {
  assert.equal(
    calculateLessonXp({ accuracy: 0.95, isFirstCompletion: false, dailyGoalMet: false }),
    30,
  );
});

test("calculateLessonXp: below the high-accuracy threshold gets no bonus", () => {
  assert.equal(
    calculateLessonXp({ accuracy: 0.94, isFirstCompletion: false, dailyGoalMet: false }),
    20,
  );
});

test("calculateLessonXp: first completion adds a bonus", () => {
  assert.equal(
    calculateLessonXp({ accuracy: 0.8, isFirstCompletion: true, dailyGoalMet: false }),
    35,
  );
});

test("calculateLessonXp: meeting the daily goal adds a bonus", () => {
  assert.equal(
    calculateLessonXp({ accuracy: 0.8, isFirstCompletion: false, dailyGoalMet: true }),
    30,
  );
});

test("calculateLessonXp: all bonuses stack", () => {
  assert.equal(calculateLessonXp({ accuracy: 1, isFirstCompletion: true, dailyGoalMet: true }), 55);
});
