// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { decideLink, isPaymentTransfer, suggestOrders } from "./matching";
import type { MatchableOrder } from "./matching";
import type { IncomingTransfer } from "./records";

const NOW = Date.parse("2026-10-18T12:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const OPTIONS = { lateWindowMs: 24 * HOUR };

function order(overrides: Partial<MatchableOrder> = {}): MatchableOrder {
  return {
    orderId: "00000000-0000-0000-0000-0000000000aa",
    referenceId: "ss_aaaa",
    orderCode: "SS-7K3Q2",
    status: "pending",
    chargeAmount: 6,
    createdAt: new Date(NOW - 10 * MINUTE).toISOString(),
    ...overrides,
  };
}

function transfer(overrides: Partial<IncomingTransfer> = {}): IncomingTransfer {
  return {
    transactionId: "TX_0001",
    transactedAt: new Date(NOW - 2 * MINUTE).toISOString(),
    amount: "6.00000000",
    currency: "USDT",
    orderType: "C2C",
    note: "SS-7K3Q2",
    payerBinanceId: "987654321",
    payerName: "Sara A.",
    raw: {},
    ...overrides,
  };
}

function decide(t: IncomingTransfer, orders: MatchableOrder[] = [order()]) {
  return decideLink(t, new Map(orders.map((o) => [o.orderCode, o])), OPTIONS);
}

test("decideLink: the exact code, enough USDT, an open order: it links", () => {
  const decision = decide(transfer());
  assert.equal(decision.action, "link");
  if (decision.action === "link") {
    assert.equal(decision.method, "note_code");
    assert.equal(decision.order.referenceId, "ss_aaaa");
  }
});

test("decideLink: more than the price still links (the extra is the learner's gift)", () => {
  assert.equal(decide(transfer({ amount: "10" })).action, "link");
});

test("decideLink: a code typed in lowercase with spaces still links", () => {
  assert.equal(decide(transfer({ note: "code ss 7k3q2 please" })).action, "link");
});

test("decideLink: less than the price never links, however little is missing", () => {
  for (const amount of ["5.99999999", "5", "0.5"]) {
    const decision = decide(transfer({ amount }));
    assert.deepEqual(
      decision.action === "skip" ? decision.reason : decision.action,
      "underpaid",
      amount,
    );
  }
});

test("decideLink: exactly the price links", () => {
  assert.equal(decide(transfer({ amount: "6.00000000" })).action, "link");
  assert.equal(decide(transfer({ amount: "6" })).action, "link");
});

test("decideLink: a different coin is never a payment", () => {
  for (const currency of ["USDC", "BTC", "BNB"]) {
    const decision = decide(transfer({ currency }));
    assert.deepEqual(decision, { action: "skip", reason: "not_a_payment" }, currency);
  }
});

test("decideLink: only transfer types that can be a customer's payment", () => {
  for (const orderType of ["PAY_REFUND", "CRYPTO_BOX", "CRYPTO_BOX_RF", "C2C_HOLDING", "PAYOUT"]) {
    const decision = decide(transfer({ orderType }));
    assert.deepEqual(decision, { action: "skip", reason: "not_a_payment" }, orderType);
  }
  assert.equal(decide(transfer({ orderType: "PAY" })).action, "link");
});

test("decideLink: a transfer with no code, or an unknown one, is left for an admin", () => {
  assert.deepEqual(decide(transfer({ note: null })), { action: "skip", reason: "no_code" });
  assert.deepEqual(decide(transfer({ note: "premium please" })), {
    action: "skip",
    reason: "no_code",
  });
  assert.deepEqual(decide(transfer({ note: "SS-ABCDE" })), {
    action: "skip",
    reason: "unknown_code",
    code: "SS-ABCDE",
  });
});

test("decideLink: a note naming two orders is ambiguous and never links", () => {
  const second = order({ orderId: "id-2", referenceId: "ss_bbbb", orderCode: "SS-ABCDE" });
  const decision = decide(transfer({ note: "SS-7K3Q2 SS-ABCDE" }), [order(), second]);
  assert.equal(decision.action, "skip");
  if (decision.action === "skip") assert.equal(decision.reason, "several_codes");
});

test("decideLink: an order that is already paid is not paid twice", () => {
  const decision = decide(transfer(), [order({ status: "fulfilled" })]);
  assert.equal(decision.action === "skip" && decision.reason, "order_already_paid");
});

test("decideLink: a closed, cancelled or failed order is not revived", () => {
  for (const status of ["needs_review", "failed", "cancelled"] as const) {
    const decision = decide(transfer(), [order({ status })]);
    assert.equal(decision.action === "skip" && decision.reason, "order_closed", status);
  }
});

test("decideLink: an expired order still takes a late payment inside the allowed window", () => {
  const created = new Date(NOW - 5 * HOUR).toISOString();
  const decision = decide(transfer(), [order({ status: "expired", createdAt: created })]);
  assert.equal(decision.action, "link");
});

test("decideLink: a transfer after the allowed window is left for an admin", () => {
  const created = new Date(NOW - 30 * HOUR).toISOString();
  const decision = decide(transfer(), [order({ createdAt: created })]);
  assert.equal(decision.action === "skip" && decision.reason, "too_late");
});

test("decideLink: a transfer made before the order existed cannot be for it", () => {
  const created = new Date(NOW + 30 * MINUTE).toISOString();
  const decision = decide(transfer(), [order({ createdAt: created })]);
  assert.equal(decision.action === "skip" && decision.reason, "before_order");
});

test("decideLink: a few minutes of clock difference before the order is tolerated", () => {
  const created = new Date(NOW - 1 * MINUTE).toISOString();
  const early = transfer({ transactedAt: new Date(NOW - 4 * MINUTE).toISOString() });
  assert.equal(decide(early, [order({ createdAt: created })]).action, "link");
});

test("isPaymentTransfer: a positive USDT C2C or PAY transfer only", () => {
  assert.equal(isPaymentTransfer(transfer()), true);
  assert.equal(isPaymentTransfer(transfer({ amount: "0" })), false);
  assert.equal(isPaymentTransfer(transfer({ amount: "abc" })), false);
  assert.equal(isPaymentTransfer(transfer({ currency: "USDC" })), false);
});

test("suggestOrders: a transfer naming an order points at it, with why it was not linked", () => {
  const suggestions = suggestOrders(transfer({ amount: "5" }), [order()], OPTIONS);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0]!.basis, "code");
  assert.equal(suggestions[0]!.blockedBy, "underpaid");
});

test("suggestOrders: with no code, open orders the amount covers and that fit the timing are offered, closest first", () => {
  const near = order({
    orderId: "id-near",
    orderCode: "SS-NEAR2",
    createdAt: new Date(NOW - 3 * MINUTE).toISOString(),
  });
  const far = order({
    orderId: "id-far",
    orderCode: "SS-FARRR",
    createdAt: new Date(NOW - 50 * MINUTE).toISOString(),
  });
  const tooExpensive = order({
    orderId: "id-big",
    orderCode: "SS-BIGGG",
    chargeAmount: 10,
    createdAt: new Date(NOW - 5 * MINUTE).toISOString(),
  });
  const suggestions = suggestOrders(transfer({ note: null }), [far, tooExpensive, near], OPTIONS);
  assert.deepEqual(
    suggestions.map((s) => s.order.orderCode),
    ["SS-NEAR2", "SS-FARRR"],
  );
  assert.ok(suggestions.every((s) => s.basis === "amount_time"));
});

test("suggestOrders: nothing for a transfer that is not a payment at all", () => {
  assert.deepEqual(
    suggestOrders(transfer({ currency: "BTC", note: null }), [order()], OPTIONS),
    [],
  );
});

test("suggestOrders: at most three, and none for orders already paid or closed", () => {
  const orders = Array.from({ length: 5 }, (_, index) =>
    order({
      orderId: `id-${index}`,
      orderCode: `SS-AAAA${index + 2}`,
      createdAt: new Date(NOW - (index + 1) * MINUTE).toISOString(),
    }),
  );
  orders.push(order({ orderId: "id-paid", orderCode: "SS-PAIDD", status: "fulfilled" }));
  const suggestions = suggestOrders(transfer({ note: null }), orders, OPTIONS);
  assert.equal(suggestions.length, 3);
  assert.ok(suggestions.every((s) => s.order.status !== "fulfilled"));
});
