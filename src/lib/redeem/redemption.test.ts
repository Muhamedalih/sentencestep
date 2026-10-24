import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SubscriptionRow } from "@/lib/billing/domain";

import { decideRedemption, displayStatus } from "./redemption";
import type { CodeForRedemption } from "./redemption";

const NOW = new Date("2026-11-01T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

const code = (patch: Partial<CodeForRedemption> = {}): CodeForRedemption => ({
  status: "unused",
  batchStatus: "active",
  validUntil: iso(NOW.getTime() + 60 * DAY_MS),
  days: 90,
  redeemedBy: null,
  ...patch,
});

const premium = (endMs: number | null): SubscriptionRow => ({
  plan: "premium",
  status: "active",
  currentPeriodStart: iso(NOW.getTime() - 10 * DAY_MS),
  currentPeriodEnd: endMs === null ? null : iso(endMs),
  cancelAtPeriodEnd: true,
  providerCustomerId: "u",
  providerSubscriptionId: "s",
});

describe("decideRedemption", () => {
  it("knows no code that is not stored", () => {
    assert.deepEqual(decideRedemption(null, "me", null, NOW), { outcome: "unknown" });
  });

  it("starts the days now for a learner who never had Premium", () => {
    assert.deepEqual(decideRedemption(code(), "me", null, NOW), {
      outcome: "redeem",
      days: 90,
      start: NOW.toISOString(),
      end: iso(NOW.getTime() + 90 * DAY_MS),
      extendedExisting: false,
    });
  });

  it("starts now for an expired subscription too", () => {
    const expired = premium(NOW.getTime() - DAY_MS);
    const decision = decideRedemption(code({ days: 30 }), "me", expired, NOW);
    assert.equal(decision.outcome, "redeem");
    if (decision.outcome === "redeem") {
      assert.equal(decision.end, iso(NOW.getTime() + 30 * DAY_MS));
      assert.equal(decision.extendedExisting, false);
    }
  });

  it("stacks the days on Premium the learner still has", () => {
    const endMs = NOW.getTime() + 5 * DAY_MS;
    const decision = decideRedemption(code({ days: 30 }), "me", premium(endMs), NOW);
    assert.equal(decision.outcome, "redeem");
    if (decision.outcome === "redeem") {
      assert.equal(decision.end, iso(endMs + 30 * DAY_MS));
      assert.equal(decision.start, iso(NOW.getTime() - 10 * DAY_MS));
      assert.equal(decision.extendedExisting, true);
    }
  });

  it("keeps the code for an account whose Premium has no end", () => {
    assert.deepEqual(decideRedemption(code(), "me", premium(null), NOW), { outcome: "unlimited" });
  });

  it("refuses a code someone else used, and tells the same learner it was theirs", () => {
    const used = code({ status: "redeemed", redeemedBy: "someone" });
    assert.deepEqual(decideRedemption(used, "me", null, NOW), { outcome: "used" });
    assert.deepEqual(decideRedemption(used, "someone", null, NOW), { outcome: "used_by_you" });
  });

  it("refuses a voided code and a code of a voided batch", () => {
    assert.deepEqual(decideRedemption(code({ status: "voided" }), "me", null, NOW), {
      outcome: "voided",
    });
    assert.deepEqual(decideRedemption(code({ batchStatus: "voided" }), "me", null, NOW), {
      outcome: "voided",
    });
  });

  it("refuses a code past its date, down to the instant", () => {
    assert.deepEqual(
      decideRedemption(code({ validUntil: iso(NOW.getTime() - 1) }), "me", null, NOW),
      { outcome: "expired" },
    );
    assert.deepEqual(decideRedemption(code({ validUntil: NOW.toISOString() }), "me", null, NOW), {
      outcome: "expired",
    });
    assert.equal(
      decideRedemption(code({ validUntil: iso(NOW.getTime() + 1) }), "me", null, NOW).outcome,
      "redeem",
    );
  });

  it("says a used code is used even when its batch was voided later", () => {
    const used = code({ status: "redeemed", redeemedBy: "x", batchStatus: "voided" });
    assert.deepEqual(decideRedemption(used, "me", null, NOW), { outcome: "used" });
  });
});

describe("displayStatus", () => {
  it("reads a code the way the admin page shows it", () => {
    assert.equal(displayStatus(code(), NOW), "unused");
    assert.equal(displayStatus(code({ status: "redeemed" }), NOW), "redeemed");
    assert.equal(displayStatus(code({ status: "voided" }), NOW), "voided");
    assert.equal(displayStatus(code({ batchStatus: "voided" }), NOW), "voided");
    assert.equal(displayStatus(code({ validUntil: iso(NOW.getTime() - 1) }), NOW), "expired");
    assert.equal(
      displayStatus(code({ status: "redeemed", validUntil: iso(NOW.getTime() - DAY_MS) }), NOW),
      "redeemed",
    );
  });
});
