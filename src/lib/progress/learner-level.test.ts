import { test } from "node:test";
import assert from "node:assert/strict";

import { getLearnerLevel } from "./learner-level";

test("getLearnerLevel: zero XP is Beginner", () => {
  const result = getLearnerLevel(0);
  assert.equal(result.level.name, "Beginner");
  assert.equal(result.next?.name, "Explorer");
});

test("getLearnerLevel: exactly on a threshold lands on that tier, not the one below", () => {
  const result = getLearnerLevel(200);
  assert.equal(result.level.name, "Explorer");
});

test("getLearnerLevel: just below a threshold stays on the lower tier", () => {
  const result = getLearnerLevel(199);
  assert.equal(result.level.name, "Beginner");
});

test("getLearnerLevel: progress is 0 right at a tier's start", () => {
  const result = getLearnerLevel(200);
  assert.equal(result.progress, 0);
});

test("getLearnerLevel: progress approaches 1 near the next tier", () => {
  // Explorer starts at 200, Builder at 600 — halfway is 400.
  const result = getLearnerLevel(400);
  assert.equal(result.progress, 0.5);
});

test("getLearnerLevel: the highest tier has no next level and full progress", () => {
  const result = getLearnerLevel(10_000);
  assert.equal(result.level.name, "Advanced");
  assert.equal(result.next, null);
  assert.equal(result.progress, 1);
});
