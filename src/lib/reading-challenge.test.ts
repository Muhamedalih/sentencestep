import assert from "node:assert/strict";
import { test } from "node:test";

import { computeMonthlyReadingChallenge } from "./reading-challenge";

test("computeMonthlyReadingChallenge: not yet met caps completed at the raw count", () => {
  assert.deepEqual(computeMonthlyReadingChallenge(1, 3), {
    completed: 1,
    goal: 3,
    isComplete: false,
  });
});

test("computeMonthlyReadingChallenge: exactly meeting the goal is complete", () => {
  assert.deepEqual(computeMonthlyReadingChallenge(3, 3), {
    completed: 3,
    goal: 3,
    isComplete: true,
  });
});

test("computeMonthlyReadingChallenge: exceeding the goal caps the displayed count at the goal", () => {
  assert.deepEqual(computeMonthlyReadingChallenge(5, 3), {
    completed: 3,
    goal: 3,
    isComplete: true,
  });
});

test("computeMonthlyReadingChallenge: zero completed this month", () => {
  assert.deepEqual(computeMonthlyReadingChallenge(0, 3), {
    completed: 0,
    goal: 3,
    isComplete: false,
  });
});
