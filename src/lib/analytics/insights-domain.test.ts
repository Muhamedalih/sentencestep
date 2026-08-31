// Deterministic unit tests for the insights arithmetic — no database.
// Run with `npm run test:analytics`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  computeAbandonmentRate,
  computeAverageDurationSeconds,
  computeCompletionRate,
  pairDurationsSeconds,
} from "./insights-domain";

test("computeCompletionRate: half of started lessons completed is 0.5", () => {
  assert.equal(computeCompletionRate(10, 5), 0.5);
});

test("computeCompletionRate: zero started lessons is 0, not NaN/Infinity", () => {
  assert.equal(computeCompletionRate(0, 0), 0);
});

test("computeCompletionRate: never exceeds 1 even with more completions than starts (e.g. re-completions)", () => {
  assert.equal(computeCompletionRate(3, 5), 1);
});

test("computeAbandonmentRate: complements completion rate", () => {
  assert.equal(computeAbandonmentRate(10, 3), 0.7);
});

test("computeAbandonmentRate: fully completed content has zero abandonment", () => {
  assert.equal(computeAbandonmentRate(10, 10), 0);
});

test("computeAverageDurationSeconds: averages a list of durations", () => {
  assert.equal(computeAverageDurationSeconds([10, 20, 30]), 20);
});

test("computeAverageDurationSeconds: null for no data, not zero (zero would be misleading)", () => {
  assert.equal(computeAverageDurationSeconds([]), null);
});

test("pairDurationsSeconds: matches a single start/complete pair", () => {
  const started = [1000];
  const completed = [4000];
  assert.deepEqual(pairDurationsSeconds(started, completed), [3]);
});

test("pairDurationsSeconds: a completion pairs with the most recent prior start (repeat attempts)", () => {
  const started = [0, 10_000]; // started, then re-started later
  const completed = [15_000]; // completed after the second start
  assert.deepEqual(pairDurationsSeconds(started, completed), [5]);
});

test("pairDurationsSeconds: a completion with no prior start is skipped, not guessed at", () => {
  const started = [10_000];
  const completed = [5_000]; // completed before any start — shouldn't happen, but must not crash or fabricate a negative duration
  assert.deepEqual(pairDurationsSeconds(started, completed), []);
});

test("pairDurationsSeconds: multiple independent completions each get their own duration", () => {
  const started = [0, 100_000];
  const completed = [5_000, 110_000];
  assert.deepEqual(pairDurationsSeconds(started, completed), [5, 10]);
});
