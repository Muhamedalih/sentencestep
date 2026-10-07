// Run with `npm run test:billing`. No database and no network: the provider
// and the store are in-memory fakes (see test-support.ts).

import { test } from "node:test";
import assert from "node:assert/strict";

import { PaymentProviderError } from "@/lib/billing/payment-provider";

import { decideFulfillment, verifyAndFulfill } from "./fulfillment";
import {
  InMemoryPaymentStore,
  MINUTE,
  NOW,
  collectAlerts,
  iso,
  makeFakeProvider,
  makeOrder,
  makePayment,
} from "./test-support";

const now = new Date(NOW);

// --- decideFulfillment: who gets premium ---

test("decide: a paid payment that matches the order exactly is fulfilled", () => {
  const decision = decideFulfillment(makeOrder(), makePayment(), now);
  assert.equal(decision.action, "fulfill");
});

test("decide: an order that is already fulfilled is never granted again", () => {
  assert.equal(
    decideFulfillment(makeOrder({ status: "fulfilled" }), makePayment(), now).action,
    "already_fulfilled",
  );
});

test("decide: an order under review is blocked even if the provider says paid", () => {
  assert.equal(
    decideFulfillment(makeOrder({ status: "needs_review" }), makePayment(), now).action,
    "blocked",
  );
});

test("decide: a paid payment for a different amount, currency or reference goes to review, never to premium", () => {
  const cases: [Partial<ReturnType<typeof makePayment>>, string][] = [
    [{ amount: 3040 }, "amount_mismatch"],
    [{ amount: 3959 }, "amount_mismatch"],
    [{ currency: "USD" }, "currency_mismatch"],
    [{ referenceId: "ss_other" }, "reference_mismatch"],
    [{ providerPaymentId: "link_other" }, "provider_payment_id_mismatch"],
  ];
  for (const [override, reason] of cases) {
    const decision = decideFulfillment(makeOrder(), makePayment(override), now);
    assert.equal(decision.action, "needs_review", reason);
    assert.equal(decision.action === "needs_review" && decision.reason, reason);
  }
});

test("decide: an order whose link id was never saved still accepts the provider's id", () => {
  const decision = decideFulfillment(
    makeOrder({ provider_payment_id: null }),
    makePayment({ providerPaymentId: "link_whatever" }),
    now,
  );
  assert.equal(decision.action, "fulfill");
});

test("decide: a paid status with no completion time waits and is flagged, never granted", () => {
  const decision = decideFulfillment(makeOrder(), makePayment({ paidAt: null }), now);
  assert.equal(decision.action, "wait");
  assert.equal(decision.action === "wait" && decision.anomaly, "paid_without_completion_time");
});

test("decide: unpaid states wait while the link is still alive", () => {
  for (const status of ["created", "pending", "processing"] as const) {
    const decision = decideFulfillment(makeOrder(), makePayment({ status, paidAt: null }), now);
    assert.equal(decision.action, "wait", status);
  }
});

test("decide: an unrecognised provider status waits and is flagged, never granted", () => {
  const decision = decideFulfillment(
    makeOrder(),
    makePayment({ status: "unknown", rawStatus: "Weird" }),
    now,
  );
  assert.equal(decision.action, "wait");
  assert.equal(decision.action === "wait" && decision.anomaly, "unknown_provider_status");
});

test("decide: an unpaid link is expired only after its expiry plus the grace period", () => {
  const unpaid = makePayment({ status: "pending", rawStatus: "Pending", paidAt: null });
  const expiredAt = -5 * MINUTE;

  const withinGrace = makeOrder({ link_expires_at: iso(expiredAt) });
  assert.equal(decideFulfillment(withinGrace, unpaid, now).action, "wait");

  const afterGrace = makeOrder({ link_expires_at: iso(-11 * MINUTE) });
  const decision = decideFulfillment(afterGrace, unpaid, now);
  assert.equal(decision.action, "close");
  assert.equal(decision.action === "close" && decision.status, "expired");
});

test("decide: a payment that is processing never expires, however old", () => {
  const order = makeOrder({ link_expires_at: iso(-600 * MINUTE) });
  const processing = makePayment({ status: "processing", rawStatus: "Processing", paidAt: null });
  assert.equal(decideFulfillment(order, processing, now).action, "wait");
});

test("decide: a payment paid after our own expiry is still granted", () => {
  const order = makeOrder({ status: "expired", link_expires_at: iso(-600 * MINUTE) });
  assert.equal(decideFulfillment(order, makePayment(), now).action, "fulfill");
});

test("decide: cancelled, rejected and returned payments close the order without premium", () => {
  const cancelled = decideFulfillment(
    makeOrder(),
    makePayment({ status: "cancelled", rawStatus: "Cancelled", paidAt: null }),
    now,
  );
  assert.deepEqual(cancelled.action === "close" && [cancelled.status, cancelled.reason], [
    "cancelled",
    "provider_cancelled",
  ]);
  const rejected = decideFulfillment(
    makeOrder(),
    makePayment({ status: "failed", rawStatus: "Rejected", paidAt: null }),
    now,
  );
  assert.deepEqual(rejected.action === "close" && [rejected.status, rejected.reason], [
    "failed",
    "provider_rejected",
  ]);
  const returned = decideFulfillment(
    makeOrder(),
    makePayment({ status: "refunded", rawStatus: "Returned" }),
    now,
  );
  assert.deepEqual(returned.action === "close" && [returned.status, returned.reason], [
    "failed",
    "provider_returned",
  ]);
});

test("decide: with no provider record, a link that never got created fails after the grace period", () => {
  const fresh = makeOrder({
    provider_payment_id: null,
    status: "created",
    created_at: iso(-2 * MINUTE),
    link_expires_at: null,
  });
  assert.equal(decideFulfillment(fresh, null, now).action, "wait");

  const stale = makeOrder({
    provider_payment_id: null,
    status: "created",
    created_at: iso(-6 * MINUTE),
    link_expires_at: null,
  });
  const decision = decideFulfillment(stale, null, now);
  assert.equal(decision.action === "close" && decision.status, "failed");
  assert.equal(decision.action === "close" && decision.reason, "link_not_created");
});

test("decide: with no provider record, an attached link waits until it has expired", () => {
  assert.equal(decideFulfillment(makeOrder(), null, now).action, "wait");
  const expired = makeOrder({ link_expires_at: iso(-11 * MINUTE) });
  const decision = decideFulfillment(expired, null, now);
  assert.equal(decision.action === "close" && decision.status, "expired");
});

test("decide: an order never given an expiry falls back to one hour after creation", () => {
  const unpaid = makePayment({ status: "created", rawStatus: "Created", paidAt: null });
  const young = makeOrder({ link_expires_at: null, created_at: iso(-50 * MINUTE) });
  assert.equal(decideFulfillment(young, unpaid, now).action, "wait");
  const old = makeOrder({ link_expires_at: null, created_at: iso(-80 * MINUTE) });
  assert.equal(decideFulfillment(old, unpaid, now).action, "close");
});

// --- verifyAndFulfill: the one path that can grant premium ---

function setup(
  options: {
    order?: ReturnType<typeof makeOrder>;
    payment?: NonNullable<Parameters<typeof makeFakeProvider>[0]>["payment"];
  } = {},
) {
  const store = new InMemoryPaymentStore([options.order ?? makeOrder()]);
  const provider = makeFakeProvider({ payment: options.payment });
  const { alerts, report } = collectAlerts();
  const deps = { provider, store, report, now: () => now };
  return { store, provider, alerts, deps };
}

test("verifyAndFulfill: a verified payment grants premium once and records it", async () => {
  const { store, deps, provider } = setup();

  const outcome = await verifyAndFulfill(deps, "ss_abc", "webhook");

  assert.equal(outcome.outcome, "fulfilled");
  assert.equal(store.get("ss_abc").status, "fulfilled");
  assert.equal(store.premiumGrants.length, 1);
  assert.deepEqual(store.fulfillCalls[0]!, {
    referenceId: "ss_abc",
    providerPaymentId: "link_1",
    chargeAmount: 4560,
    chargeCurrency: "IQD",
    paidAt: makePayment().paidAt,
    providerStatus: "Complete",
  });
  assert.equal(provider.getPaymentCalls.length, 1);
});

test("verifyAndFulfill: running again is a no-op and does not even call the provider", async () => {
  const { store, deps, provider } = setup();
  await verifyAndFulfill(deps, "ss_abc", "webhook");

  const again = await verifyAndFulfill(deps, "ss_abc", "return_page");

  assert.equal(again.outcome, "already_fulfilled");
  assert.equal(store.premiumGrants.length, 1);
  assert.equal(provider.getPaymentCalls.length, 1);
});

test("verifyAndFulfill: concurrent webhook, return page and cron grant premium exactly once", async () => {
  const { store, deps } = setup();

  const outcomes = await Promise.all([
    verifyAndFulfill(deps, "ss_abc", "webhook"),
    verifyAndFulfill(deps, "ss_abc", "webhook"),
    verifyAndFulfill(deps, "ss_abc", "return_page"),
    verifyAndFulfill(deps, "ss_abc", "cron"),
    verifyAndFulfill(deps, "ss_abc", "cron"),
  ]);

  assert.equal(store.premiumGrants.length, 1);
  assert.equal(outcomes.filter((o) => o.outcome === "fulfilled").length, 1);
  assert.equal(outcomes.filter((o) => o.outcome === "already_fulfilled").length, 4);
});

test("verifyAndFulfill: the provider decides, not the trigger — a webhook for an unpaid order grants nothing", async () => {
  const { store, deps } = setup({
    payment: makePayment({ status: "created", rawStatus: "Created", paidAt: null }),
  });

  const outcome = await verifyAndFulfill(deps, "ss_abc", "webhook");

  assert.equal(outcome.outcome, "pending");
  assert.equal(store.fulfillCalls.length, 0);
  assert.equal(store.premiumGrants.length, 0);
  assert.equal(store.get("ss_abc").provider_status, "Created");
  assert.equal(store.get("ss_abc").last_verified_at, now.toISOString());
});

test("verifyAndFulfill: an amount that does not match flags the order and raises an alert instead of granting", async () => {
  const { store, deps, alerts } = setup({ payment: makePayment({ amount: 1000 }) });

  const outcome = await verifyAndFulfill(deps, "ss_abc", "cron");

  assert.deepEqual(outcome, { outcome: "needs_review", reason: "amount_mismatch" });
  assert.equal(store.get("ss_abc").status, "needs_review");
  assert.equal(store.fulfillCalls.length, 0);
  assert.equal(alerts[0]!.code, "amount_mismatch");
  assert.equal(alerts[0]!.referenceId, "ss_abc");

  const later = await verifyAndFulfill(deps, "ss_abc", "cron");
  assert.equal(later.outcome, "needs_review");
});

test("verifyAndFulfill: an unknown reference is ignored without calling the provider", async () => {
  const { deps, provider } = setup();
  const outcome = await verifyAndFulfill(deps, "ss_not_ours", "webhook");
  assert.equal(outcome.outcome, "unknown_reference");
  assert.equal(provider.getPaymentCalls.length, 0);
});

test("verifyAndFulfill: an order from another environment is left alone", async () => {
  const { store, deps, provider } = setup({ order: makeOrder({ provider_env: "live" }) });
  const outcome = await verifyAndFulfill(deps, "ss_abc", "cron");
  assert.equal(outcome.outcome, "wrong_environment");
  assert.equal(provider.getPaymentCalls.length, 0);
  assert.equal(store.get("ss_abc").status, "pending");
});

test("verifyAndFulfill: a provider outage throws so the caller can retry, and changes nothing", async () => {
  const { store, deps } = setup({
    payment: new PaymentProviderError("Wayl GET failed (503)", { retryable: true, status: 503 }),
  });

  await assert.rejects(verifyAndFulfill(deps, "ss_abc", "webhook"), PaymentProviderError);

  assert.equal(store.get("ss_abc").status, "pending");
  assert.equal(store.premiumGrants.length, 0);
});

test("verifyAndFulfill: a payment the caller already fetched (batch) is used without another provider call", async () => {
  const { store, deps, provider } = setup({ payment: new Error("must not be called") });

  const outcome = await verifyAndFulfill(deps, "ss_abc", "cron", { payment: makePayment() });

  assert.equal(outcome.outcome, "fulfilled");
  assert.equal(provider.getPaymentCalls.length, 0);
  assert.equal(store.premiumGrants.length, 1);
});

test("verifyAndFulfill: a cancelled payment closes the order; a later payment on it is still honoured", async () => {
  const { store, deps, provider } = setup({
    payment: makePayment({ status: "cancelled", rawStatus: "Cancelled", paidAt: null }),
  });

  const closed = await verifyAndFulfill(deps, "ss_abc", "webhook");
  assert.deepEqual(closed, { outcome: "closed", status: "cancelled" });
  assert.equal(store.get("ss_abc").status, "cancelled");
  assert.equal(store.get("ss_abc").failure_reason, "provider_cancelled");

  provider.payment = makePayment();
  const late = await verifyAndFulfill(deps, "ss_abc", "cron");
  assert.equal(late.outcome, "fulfilled");
  assert.equal(store.premiumGrants.length, 1);
});

test("verifyAndFulfill: re-checking an already-closed order that is still unpaid reports closed, not pending", async () => {
  const { deps } = setup({
    order: makeOrder({ status: "expired" }),
    payment: makePayment({ status: "pending", rawStatus: "Pending", paidAt: null }),
  });
  const outcome = await verifyAndFulfill(deps, "ss_abc", "return_page");
  assert.deepEqual(outcome, { outcome: "closed", status: "expired" });
});

test("verifyAndFulfill: an order that never got a link is closed as failed", async () => {
  const { store, deps } = setup({
    order: makeOrder({
      provider_payment_id: null,
      status: "created",
      created_at: iso(-10 * MINUTE),
      link_expires_at: null,
    }),
    payment: null,
  });
  const outcome = await verifyAndFulfill(deps, "ss_abc", "cron");
  assert.deepEqual(outcome, { outcome: "closed", status: "failed" });
  assert.equal(store.get("ss_abc").failure_reason, "link_not_created");
});

test("verifyAndFulfill: an anomaly (paid without a completion time) waits and alerts", async () => {
  const { store, deps, alerts } = setup({ payment: makePayment({ paidAt: null }) });
  const outcome = await verifyAndFulfill(deps, "ss_abc", "webhook");
  assert.equal(outcome.outcome, "pending");
  assert.equal(alerts[0]!.code, "paid_without_completion_time");
  assert.equal(store.premiumGrants.length, 0);
});

test("verifyAndFulfill: when the database refuses the grant, the order is flagged and an alert is raised", async () => {
  for (const result of ["mismatch", "user_not_found"] as const) {
    const { store, deps, alerts } = setup();
    store.rpcOverride = { result };

    const outcome = await verifyAndFulfill(deps, "ss_abc", "webhook");

    assert.deepEqual(outcome, { outcome: "needs_review", reason: result });
    assert.equal(alerts[0]!.code, result);
  }
});

test("verifyAndFulfill: an order that is under review is never re-evaluated or granted", async () => {
  const { store, deps, provider } = setup({
    order: makeOrder({ status: "needs_review", failure_reason: "amount_mismatch" }),
  });
  const outcome = await verifyAndFulfill(deps, "ss_abc", "cron");
  assert.deepEqual(outcome, { outcome: "needs_review", reason: "amount_mismatch" });
  assert.equal(provider.getPaymentCalls.length, 0);
  assert.equal(store.premiumGrants.length, 0);
});
