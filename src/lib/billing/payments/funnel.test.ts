// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { orderStage, reachedForm, signalsByReference, summarizeFunnel } from "./funnel";
import { makeOrder } from "./test-support";

const order = (reference: string, overrides: Parameters<typeof makeOrder>[0] = {}) =>
  makeOrder({ reference_id: reference, pricing_tier: "A", pricing_country: "iq", ...overrides });

test("signalsByReference: the newest event decides the status, any event can supply the method", () => {
  const signals = signalsByReference([
    { payload: { referenceId: "ss_1", paymentStatus: "Complete", paymentMethod: null } },
    { payload: { referenceId: "ss_1", paymentStatus: "Created", paymentMethod: "Card" } },
    { payload: { referenceId: "ss_2" } },
    { payload: { paymentStatus: "Complete" } },
    { payload: null },
  ]);

  assert.deepEqual(signals.get("ss_1"), { method: "Card", paymentStatus: "Complete" });
  assert.deepEqual(signals.get("ss_2"), { method: null, paymentStatus: null });
  assert.equal(signals.size, 2, "an event with no reference is ignored");
});

test("orderStage: where each kind of order ended up", () => {
  assert.equal(orderStage(order("a", { status: "fulfilled" }), true), "paid");
  assert.equal(orderStage(order("a", { status: "needs_review" }), true), "needs_review");
  assert.equal(
    orderStage(order("a", { status: "failed", provider_payment_id: null }), false),
    "link_failed",
  );
  assert.equal(orderStage(order("a", { status: "pending" }), false), "waiting");
  assert.equal(orderStage(order("a", { status: "created" }), true), "waiting");
  assert.equal(orderStage(order("a", { status: "expired" }), true), "left_at_payment");
  assert.equal(orderStage(order("a", { status: "expired" }), false), "left_before_form");
  assert.equal(
    orderStage(order("a", { status: "failed", provider_payment_id: "link_1" }), false),
    "left_before_form",
    "a link the provider rejected later did exist",
  );
});

test("reachedForm: a paid order counts even when its webhook is older than the events read", () => {
  const signals = signalsByReference([{ payload: { referenceId: "ss_seen" } }]);

  assert.equal(reachedForm(order("ss_seen", { status: "pending" }), signals), true);
  assert.equal(reachedForm(order("ss_old", { status: "fulfilled" }), signals), true);
  assert.equal(reachedForm(order("ss_none", { status: "pending" }), signals), false);
});

test("summarizeFunnel: counts each stage per tier and country, busiest group first", () => {
  const signals = signalsByReference([
    { payload: { referenceId: "ss_paid" } },
    { payload: { referenceId: "ss_stalled" } },
    { payload: { referenceId: "ss_waiting" } },
  ]);

  const funnel = summarizeFunnel(
    [
      order("ss_paid", { status: "fulfilled" }),
      order("ss_stalled", { status: "expired", pricing_country: "eg" }),
      order("ss_waiting", { status: "pending", pricing_country: "eg" }),
      order("ss_gone", { status: "expired", pricing_tier: "B", pricing_country: "kr" }),
      order("ss_nolink", {
        status: "failed",
        provider_payment_id: null,
        pricing_tier: "B",
        pricing_country: "kr",
      }),
    ],
    signals,
  );

  assert.deepEqual(funnel.totals, {
    links: 4,
    reachedForm: 3,
    paid: 1,
    waiting: 1,
    left: 2,
    needsReview: 0,
    linkFailed: 1,
  });
  assert.deepEqual(
    funnel.rows.map((row) => [row.tier, row.country, row.links, row.reachedForm, row.paid]),
    [
      ["A", "eg", 2, 2, 0],
      ["A", "iq", 1, 1, 1],
      ["B", "kr", 1, 0, 0],
    ],
  );
});
