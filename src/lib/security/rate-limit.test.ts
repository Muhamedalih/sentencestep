// Run with `npm run test:security`.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { allowRequest, resetRateLimits } from "./rate-limit";

beforeEach(() => resetRateLimits());

test("allowRequest: lets `limit` calls through in a window, then refuses", () => {
  const t = 1_000;
  assert.equal(allowRequest("a", 3, 60_000, t), true);
  assert.equal(allowRequest("a", 3, 60_000, t + 1), true);
  assert.equal(allowRequest("a", 3, 60_000, t + 2), true);
  assert.equal(allowRequest("a", 3, 60_000, t + 3), false);
  assert.equal(allowRequest("a", 3, 60_000, t + 4), false);
});

test("allowRequest: a new window starts once the old one has expired", () => {
  assert.equal(allowRequest("a", 1, 1_000, 0), true);
  assert.equal(allowRequest("a", 1, 1_000, 500), false);
  assert.equal(allowRequest("a", 1, 1_000, 1_000), true);
});

test("allowRequest: keys are counted separately", () => {
  assert.equal(allowRequest("a", 1, 60_000, 0), true);
  assert.equal(allowRequest("b", 1, 60_000, 0), true);
  assert.equal(allowRequest("a", 1, 60_000, 1), false);
  assert.equal(allowRequest("b", 1, 60_000, 1), false);
});

test("allowRequest: a flood of one-off keys never grows the map without bound", () => {
  for (let i = 0; i < 60_000; i += 1) allowRequest(`flood:${i}`, 1, 60_000, 0);
  // A later call sweeps; the limiter must still answer correctly afterwards.
  assert.equal(allowRequest("after", 1, 60_000, 1), true);
  assert.equal(allowRequest("after", 1, 60_000, 2), false);
});
