// Run with `npm run test:admin`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MAX_GRANT_DAYS, parseGrantDays, planPremiumGrant } from "./premium-grant";
import type { SubscriptionRow } from "@/lib/billing/domain";

const NOW = new Date("2026-10-09T12:00:00Z");

function row(overrides: Partial<SubscriptionRow>): SubscriptionRow {
  return {
    plan: "free",
    status: "free",
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    providerCustomerId: null,
    providerSubscriptionId: null,
    ...overrides,
  };
}

test("parseGrantDays: accepts whole days inside the range", () => {
  assert.deepEqual(parseGrantDays(30), { ok: true, days: 30 });
  assert.deepEqual(parseGrantDays(1), { ok: true, days: 1 });
  assert.deepEqual(parseGrantDays(MAX_GRANT_DAYS), { ok: true, days: MAX_GRANT_DAYS });
});

test("parseGrantDays: rejects zero, negatives, fractions, too many days and non-numbers", () => {
  for (const value of [0, -5, 2.5, MAX_GRANT_DAYS + 1, Number.NaN, "30", null, undefined]) {
    assert.equal(parseGrantDays(value).ok, false, String(value));
  }
});

test("planPremiumGrant: an account with no subscription row starts now", () => {
  const plan = planPremiumGrant(null, 30, NOW);
  assert.deepEqual(plan, {
    kind: "grant",
    start: "2026-10-09T12:00:00.000Z",
    end: "2026-11-08T12:00:00.000Z",
    extendedExisting: false,
  });
});

test("planPremiumGrant: a free-plan row starts now", () => {
  const plan = planPremiumGrant(row({ plan: "free", status: "free" }), 7, NOW);
  assert.equal(plan.kind, "grant");
  assert.equal(plan.kind === "grant" && plan.extendedExisting, false);
  assert.equal(plan.kind === "grant" && plan.end, "2026-10-16T12:00:00.000Z");
});

test("planPremiumGrant: expired Premium restarts from now, not from the old end", () => {
  const plan = planPremiumGrant(
    row({
      plan: "premium",
      status: "active",
      currentPeriodStart: "2026-01-01T00:00:00.000Z",
      currentPeriodEnd: "2026-04-01T00:00:00.000Z",
    }),
    30,
    NOW,
  );
  assert.deepEqual(plan, {
    kind: "grant",
    start: "2026-10-09T12:00:00.000Z",
    end: "2026-11-08T12:00:00.000Z",
    extendedExisting: false,
  });
});

test("planPremiumGrant: a cancelled or past-due row does not count as current Premium", () => {
  for (const status of ["canceled", "past_due"] as const) {
    const plan = planPremiumGrant(
      row({ plan: "premium", status, currentPeriodEnd: "2027-01-01T00:00:00.000Z" }),
      30,
      NOW,
    );
    assert.equal(plan.kind === "grant" && plan.extendedExisting, false, status);
    assert.equal(plan.kind === "grant" && plan.start, "2026-10-09T12:00:00.000Z", status);
  }
});

test("planPremiumGrant: days stack on Premium the account still has and keep its start", () => {
  const plan = planPremiumGrant(
    row({
      plan: "premium",
      status: "active",
      currentPeriodStart: "2026-09-20T00:00:00.000Z",
      currentPeriodEnd: "2026-12-19T00:00:00.000Z",
    }),
    30,
    NOW,
  );
  assert.deepEqual(plan, {
    kind: "grant",
    start: "2026-09-20T00:00:00.000Z",
    end: "2027-01-18T00:00:00.000Z",
    extendedExisting: true,
  });
});

test("planPremiumGrant: trialing Premium also stacks", () => {
  const plan = planPremiumGrant(
    row({
      plan: "premium",
      status: "trialing",
      currentPeriodEnd: "2026-10-10T12:00:00.000Z",
    }),
    30,
    NOW,
  );
  assert.equal(plan.kind === "grant" && plan.extendedExisting, true);
  assert.equal(plan.kind === "grant" && plan.start, NOW.toISOString());
  assert.equal(plan.kind === "grant" && plan.end, "2026-11-09T12:00:00.000Z");
});

test("planPremiumGrant: Premium with no end date is reported, never shortened", () => {
  const plan = planPremiumGrant(
    row({ plan: "premium", status: "active", currentPeriodEnd: null }),
    30,
    NOW,
  );
  assert.deepEqual(plan, { kind: "unlimited" });
});
