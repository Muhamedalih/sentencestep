import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { countsAsFailure, decideAttempt } from "./attempts";

const NOW = new Date("2026-11-01T12:00:00.000Z");
const MINUTE = 60 * 1000;
const ago = (ms: number) => NOW.getTime() - ms;
const none: number[] = [];

describe("countsAsFailure", () => {
  it("counts a wrong code but not a typo, a success or a repeat", () => {
    for (const outcome of ["unknown", "used", "voided", "expired"] as const) {
      assert.equal(countsAsFailure(outcome), true, outcome);
    }
    for (const outcome of ["ok", "used_by_you", "unlimited", "bad_format"] as const) {
      assert.equal(countsAsFailure(outcome), false, outcome);
    }
  });
});

describe("decideAttempt", () => {
  it("allows a learner with no failures", () => {
    assert.deepEqual(decideAttempt({ userFailures: none, ipFailures: none, now: NOW }), {
      allowed: true,
    });
  });

  it("allows four failures in ten minutes and pauses at five", () => {
    const four = [1, 2, 3, 4].map((minutes) => ago(minutes * MINUTE));
    assert.deepEqual(decideAttempt({ userFailures: four, ipFailures: none, now: NOW }), {
      allowed: true,
    });
    const five = [1, 2, 3, 4, 5].map((minutes) => ago(minutes * MINUTE));
    const decision = decideAttempt({ userFailures: five, ipFailures: none, now: NOW });
    assert.equal(decision.allowed, false);
  });

  it("says how long until the oldest failure leaves the ten-minute window", () => {
    const five = [9, 8, 7, 6, 5].map((minutes) => ago(minutes * MINUTE));
    // The oldest is 9 minutes old; it leaves the window in 1 minute and then four remain.
    assert.deepEqual(decideAttempt({ userFailures: five, ipFailures: none, now: NOW }), {
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("lets old failures go", () => {
    const old = [11, 12, 13, 14, 15].map((minutes) => ago(minutes * MINUTE));
    assert.deepEqual(decideAttempt({ userFailures: old, ipFailures: none, now: NOW }), {
      allowed: true,
    });
  });

  it("also pauses a learner at twenty failures in a day, spread out", () => {
    const spread = Array.from({ length: 20 }, (_, index) => ago((15 + index * 30) * MINUTE));
    const decision = decideAttempt({ userFailures: spread, ipFailures: none, now: NOW });
    assert.equal(decision.allowed, false);
    if (!decision.allowed) assert.ok(decision.retryAfterSeconds > 0);
    const nineteen = spread.slice(1);
    assert.deepEqual(decideAttempt({ userFailures: nineteen, ipFailures: none, now: NOW }), {
      allowed: true,
    });
  });

  it("pauses an address at forty failures an hour whoever they were", () => {
    const forty = Array.from({ length: 40 }, (_, index) => ago((index + 1) * MINUTE));
    assert.equal(decideAttempt({ userFailures: none, ipFailures: forty, now: NOW }).allowed, false);
    assert.equal(
      decideAttempt({ userFailures: none, ipFailures: forty.slice(1), now: NOW }).allowed,
      true,
    );
  });

  it("waits for the longest of the limits that apply", () => {
    const user = [9, 8, 7, 6, 5].map((minutes) => ago(minutes * MINUTE));
    const ip = Array.from({ length: 40 }, (_, index) => ago((55 - index) * MINUTE));
    // The address's oldest failure is 55 minutes old, so it waits 5 minutes (300 s); the learner 60 s.
    assert.deepEqual(decideAttempt({ userFailures: user, ipFailures: ip, now: NOW }), {
      allowed: false,
      retryAfterSeconds: 300,
    });
  });

  it("waits at least a second, never zero", () => {
    const five = [10, 3, 2, 1, 0].map((minutes) => ago(minutes * MINUTE - 1));
    const decision = decideAttempt({ userFailures: five, ipFailures: none, now: NOW });
    assert.equal(decision.allowed, false);
    if (!decision.allowed) assert.ok(decision.retryAfterSeconds >= 1);
  });
});
