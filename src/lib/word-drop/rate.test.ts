import assert from "node:assert/strict";
import test from "node:test";

import { MAX_ROUNDS_PER_DAY, MIN_GAP_MS, createScoreLimiter } from "@/lib/word-drop/rate";

test("a second score within 90 seconds is refused, a later one is accepted", () => {
  let now = Date.parse("2026-11-23T10:00:00Z");
  const limiter = createScoreLimiter(() => now);
  assert.equal(limiter.check("u1"), "ok");
  now += MIN_GAP_MS - 1;
  assert.equal(limiter.check("u1"), "too-soon");
  // A refused try does not push the window further.
  now += 1;
  assert.equal(limiter.check("u1"), "ok");
});

test("learners do not hold each other up", () => {
  const now = Date.parse("2026-11-23T10:00:00Z");
  const limiter = createScoreLimiter(() => now);
  assert.equal(limiter.check("u1"), "ok");
  assert.equal(limiter.check("u2"), "ok");
  assert.equal(limiter.check("u1"), "too-soon");
});

test("a learner gets at most 30 rounds a day, and the count starts again the next day", () => {
  let now = Date.parse("2026-11-23T00:10:00Z");
  const limiter = createScoreLimiter(() => now);
  for (let i = 0; i < MAX_ROUNDS_PER_DAY; i += 1) {
    assert.equal(limiter.check("u1"), "ok");
    now += MIN_GAP_MS;
  }
  assert.equal(limiter.check("u1"), "too-many");
  now = Date.parse("2026-11-24T00:05:00Z");
  assert.equal(limiter.check("u1"), "ok");
});

test("only a bounded number of learners is remembered", () => {
  const now = Date.parse("2026-11-23T10:00:00Z");
  const limiter = createScoreLimiter(() => now);
  for (let i = 0; i < 5_200; i += 1) limiter.check(`user-${i}`);
  assert.ok(limiter.size() <= 5_000);
});
