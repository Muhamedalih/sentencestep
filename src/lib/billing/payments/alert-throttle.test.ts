// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createAlertThrottle } from "./alert-throttle";

const MINUTE = 60_000;

test("throttle: the first alert goes out, and the same one right after is held back", () => {
  const throttle = createAlertThrottle();

  assert.equal(throttle.shouldSend("needs_review:ss_a", 0), true);
  assert.equal(throttle.shouldSend("needs_review:ss_a", 5 * MINUTE), false);
});

test("throttle: the same alert is allowed again once the repeat window has passed", () => {
  const throttle = createAlertThrottle({ repeatWindowMs: 30 * MINUTE });

  assert.equal(throttle.shouldSend("k", 0), true);
  assert.equal(throttle.shouldSend("k", 29 * MINUTE), false);
  assert.equal(throttle.shouldSend("k", 30 * MINUTE), true);
});

test("throttle: different alerts don't hold each other back", () => {
  const throttle = createAlertThrottle();

  assert.equal(throttle.shouldSend("needs_review:ss_a", 0), true);
  assert.equal(throttle.shouldSend("needs_review:ss_b", 0), true);
  assert.equal(throttle.shouldSend("amount_mismatch:ss_a", 0), true);
});

test("throttle: a burst of different alerts is cut off at the cap, then recovers", () => {
  const throttle = createAlertThrottle({ cap: 3, capWindowMs: 10 * MINUTE });

  assert.equal(throttle.shouldSend("a", 0), true);
  assert.equal(throttle.shouldSend("b", 1), true);
  assert.equal(throttle.shouldSend("c", 2), true);
  assert.equal(throttle.shouldSend("d", 3), false);
  assert.equal(throttle.shouldSend("e", 9 * MINUTE), false);
  assert.equal(throttle.shouldSend("f", 10 * MINUTE + 5), true);
});

test("throttle: an alert held back by the cap isn't remembered as sent", () => {
  const throttle = createAlertThrottle({ cap: 1, capWindowMs: 10 * MINUTE });

  assert.equal(throttle.shouldSend("a", 0), true);
  assert.equal(throttle.shouldSend("b", 1), false);
  assert.equal(throttle.shouldSend("b", 11 * MINUTE), true);
});
