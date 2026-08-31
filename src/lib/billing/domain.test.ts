// Deterministic unit tests for the billing domain — no database, no
// payment provider, no network. Run with `npm run test:billing`.
//
// This is UNIT/INTERNAL testing of our own decision logic, not a
// substitute for testing against a real payment provider (which cannot
// happen until one is selected and connected — see the Milestone 8 report).

import { test } from "node:test";
import assert from "node:assert/strict";

import { applyBillingEvent, deriveAccessState } from "./domain";
import type { SubscriptionRow } from "./domain";

const NOW = new Date("2026-01-15T00:00:00Z");

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

test("deriveAccessState: missing subscription record is treated as free, not an error", () => {
  const access = deriveAccessState(null, NOW);
  assert.equal(access.isPremium, false);
  assert.equal(access.plan, "free");
});

test("deriveAccessState: free-plan row has no access", () => {
  const access = deriveAccessState(row({ plan: "free", status: "free" }), NOW);
  assert.equal(access.isPremium, false);
});

test("deriveAccessState: active premium subscription has access", () => {
  const access = deriveAccessState(
    row({
      plan: "premium",
      status: "active",
      currentPeriodEnd: "2026-02-01T00:00:00Z",
    }),
    NOW,
  );
  assert.equal(access.isPremium, true);
});

test("deriveAccessState: trialing premium subscription has access", () => {
  const access = deriveAccessState(
    row({ plan: "premium", status: "trialing", currentPeriodEnd: "2026-02-01T00:00:00Z" }),
    NOW,
  );
  assert.equal(access.isPremium, true);
});

test("deriveAccessState: active subscription past its period end has no access (expired)", () => {
  const access = deriveAccessState(
    row({ plan: "premium", status: "active", currentPeriodEnd: "2026-01-01T00:00:00Z" }),
    NOW,
  );
  assert.equal(access.isPremium, false);
});

test("deriveAccessState: cancelled-but-still-active mid-period keeps access until period end", () => {
  const access = deriveAccessState(
    row({
      plan: "premium",
      status: "active",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: "2026-02-01T00:00:00Z",
    }),
    NOW,
  );
  assert.equal(access.isPremium, true);
  assert.equal(access.cancelAtPeriodEnd, true);
});

test("deriveAccessState: fully cancelled status has no access regardless of period end", () => {
  const access = deriveAccessState(
    row({ plan: "premium", status: "canceled", currentPeriodEnd: "2026-02-01T00:00:00Z" }),
    NOW,
  );
  assert.equal(access.isPremium, false);
});

test("deriveAccessState: expired status has no access", () => {
  const access = deriveAccessState(row({ plan: "premium", status: "expired" }), NOW);
  assert.equal(access.isPremium, false);
});

test("deriveAccessState: past_due revokes access immediately (no grace period)", () => {
  const access = deriveAccessState(
    row({ plan: "premium", status: "past_due", currentPeriodEnd: "2026-02-01T00:00:00Z" }),
    NOW,
  );
  assert.equal(access.isPremium, false);
});

test("deriveAccessState: premium plan with no period end (e.g. lifetime-style) never expires", () => {
  const access = deriveAccessState(
    row({ plan: "premium", status: "active", currentPeriodEnd: null }),
    NOW,
  );
  assert.equal(access.isPremium, true);
});

test("applyBillingEvent: checkout.completed grants active premium access", () => {
  const next = applyBillingEvent(null, {
    type: "checkout.completed",
    providerCustomerId: "cus_1",
    providerSubscriptionId: "sub_1",
    currentPeriodStart: "2026-01-15T00:00:00Z",
    currentPeriodEnd: "2026-02-15T00:00:00Z",
  });
  assert.equal(next.plan, "premium");
  assert.equal(next.status, "active");
  assert.equal(next.cancelAtPeriodEnd, false);
});

test("applyBillingEvent: subscription.renewed extends the period without changing plan/status", () => {
  const current = row({
    plan: "premium",
    status: "active",
    currentPeriodEnd: "2026-02-15T00:00:00Z",
    providerCustomerId: "cus_1",
    providerSubscriptionId: "sub_1",
  });
  const next = applyBillingEvent(current, {
    type: "subscription.renewed",
    providerCustomerId: "cus_1",
    providerSubscriptionId: "sub_1",
    currentPeriodEnd: "2026-03-15T00:00:00Z",
  });
  assert.equal(next.currentPeriodEnd, "2026-03-15T00:00:00Z");
  assert.equal(next.status, "active");
});

test("applyBillingEvent: subscription.cancelled only flags cancel_at_period_end, doesn't revoke immediately", () => {
  const current = row({
    plan: "premium",
    status: "active",
    currentPeriodEnd: "2026-02-15T00:00:00Z",
  });
  const next = applyBillingEvent(current, {
    type: "subscription.cancelled",
    providerCustomerId: "cus_1",
    providerSubscriptionId: "sub_1",
  });
  assert.equal(next.status, "active");
  assert.equal(next.cancelAtPeriodEnd, true);
  // Confirms the resulting row still grants access until the period actually ends.
  assert.equal(deriveAccessState(next, new Date("2026-01-20T00:00:00Z")).isPremium, true);
});

test("applyBillingEvent: subscription.expired revokes access and resets to the free plan", () => {
  const current = row({ plan: "premium", status: "active", cancelAtPeriodEnd: true });
  const next = applyBillingEvent(current, {
    type: "subscription.expired",
    providerCustomerId: "cus_1",
    providerSubscriptionId: "sub_1",
  });
  assert.equal(next.plan, "free");
  assert.equal(next.status, "expired");
  assert.equal(deriveAccessState(next, NOW).isPremium, false);
});

test("applyBillingEvent: payment.failed moves an active subscription to past_due", () => {
  const current = row({ plan: "premium", status: "active" });
  const next = applyBillingEvent(current, {
    type: "payment.failed",
    providerCustomerId: "cus_1",
    providerSubscriptionId: "sub_1",
  });
  assert.equal(next.status, "past_due");
  assert.equal(deriveAccessState(next, NOW).isPremium, false);
});

test("applyBillingEvent: an unrecognized event type is a safe no-op, not a crash", () => {
  const current = row({ plan: "premium", status: "active" });
  const next = applyBillingEvent(current, {
    // @ts-expect-error deliberately invalid event type, to prove the function stays total
    type: "something.unknown",
    providerCustomerId: "c",
    providerSubscriptionId: "s",
  });
  assert.deepEqual(next, current);
});

// Idempotency itself (duplicate webhook deliveries) is enforced by a real
// unique-key violation against the `billing_events` table — see
// src/lib/billing/webhook-events.ts. That requires a live Supabase
// connection to exercise end to end, so it isn't a unit test here; it's
// listed explicitly as a live-provider test in the Milestone 8 report.
