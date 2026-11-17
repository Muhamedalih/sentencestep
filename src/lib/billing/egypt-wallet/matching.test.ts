// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { decideLink, decideReferenceLink, wholePounds } from "./matching";
import type { LinkDecision, MatchableMessage, MatchableOrder } from "./matching";

const HOUR = 60 * 60 * 1000;
const LATE = 24 * HOUR;
const WALLET = "01090000002";

const order = (patch: Partial<MatchableOrder> = {}): MatchableOrder => ({
  orderId: "o1",
  referenceId: "ss_1",
  userId: "u1",
  status: "pending",
  chargeAmount: 100,
  createdAt: "2026-11-17T10:00:00.000Z",
  payerPhone: "01120000001",
  ...patch,
});

const message = (patch: Partial<MatchableMessage> = {}): MatchableMessage => ({
  transactionId: "111111111",
  amountPiasters: 10_000,
  payerPhone: "01120000001",
  walletNumber: WALLET,
  receivedAt: "2026-11-17T10:20:00.000Z",
  ...patch,
});

const options = { lateWindowMs: LATE, shopWallet: WALLET };

function skipReason(decision: LinkDecision): string {
  assert.equal(decision.action, "skip");
  return decision.action === "skip" ? decision.reason : "";
}

test("wholePounds rounds to the nearest pound, half up", () => {
  assert.equal(wholePounds(24_950), 250);
  assert.equal(wholePounds(24_949), 249);
  assert.equal(wholePounds(25_000), 250);
});

test("decideLink links the right number and the right amount", () => {
  const decision = decideLink(message(), [order()], options);
  assert.equal(decision.action, "link");
  assert.equal(decision.action === "link" ? decision.method : "", "phone");
});

test("decideLink counts 99.50 as 100", () => {
  assert.equal(decideLink(message({ amountPiasters: 9_950 }), [order()], options).action, "link");
});

test("decideLink does not link another amount", () => {
  assert.equal(
    skipReason(decideLink(message({ amountPiasters: 9_000 }), [order()], options)),
    "wrong_amount",
  );
});

test("decideLink does not link a number nobody is paying from", () => {
  assert.equal(skipReason(decideLink(message(), [], options)), "no_order_for_phone");
});

test("decideLink does not link a message that hides the sender", () => {
  assert.equal(
    skipReason(decideLink(message({ payerPhone: null }), [order()], options)),
    "no_phone",
  );
});

test("decideLink does not link a message about another wallet", () => {
  assert.equal(
    skipReason(decideLink(message({ walletNumber: "01011111111" }), [order()], options)),
    "wrong_wallet",
  );
});

test("decideLink does not link a transfer older than the order", () => {
  const early = message({ receivedAt: "2026-11-17T09:00:00.000Z" });
  assert.equal(skipReason(decideLink(early, [order()], options)), "before_order");
});

test("decideLink accepts a transfer a few minutes before the order (clock drift)", () => {
  const close = message({ receivedAt: "2026-11-17T09:55:00.000Z" });
  assert.equal(decideLink(close, [order()], options).action, "link");
});

test("decideLink does not link a transfer past the late window", () => {
  const late = message({ receivedAt: "2026-11-19T10:00:00.000Z" });
  assert.equal(skipReason(decideLink(late, [order()], options)), "too_late");
});

test("decideLink still links an expired order inside the late window", () => {
  assert.equal(decideLink(message(), [order({ status: "expired" })], options).action, "link");
});

test("decideLink never links a closed or paid order", () => {
  assert.equal(
    skipReason(decideLink(message(), [order({ status: "cancelled" })], options)),
    "order_closed",
  );
  assert.equal(
    skipReason(decideLink(message(), [order({ status: "fulfilled" })], options)),
    "order_already_paid",
  );
});

test("decideLink links the oldest of one learner's orders of the same price", () => {
  const older = order({ orderId: "o0", createdAt: "2026-11-17T09:50:00.000Z" });
  const decision = decideLink(message(), [order(), older], options);
  assert.equal(decision.action, "link");
  assert.equal(decision.action === "link" ? decision.order.orderId : "", "o0");
});

test("decideLink refuses when two learners share the number and the price", () => {
  const other = order({ orderId: "o2", userId: "u2" });
  assert.equal(skipReason(decideLink(message(), [order(), other], options)), "ambiguous");
});

test("decideLink picks the order of the price that was paid", () => {
  const month = order({ orderId: "m", chargeAmount: 100 });
  const quarter = order({ orderId: "q", chargeAmount: 200 });
  const decision = decideLink(message({ amountPiasters: 20_000 }), [month, quarter], options);
  assert.equal(decision.action, "link");
  assert.equal(decision.action === "link" ? decision.order.orderId : "", "q");
});

const stored = (patch: Partial<MatchableMessage & { status: string }> = {}) => ({
  ...message(),
  status: "new",
  ...patch,
});

test("decideReferenceLink links an unused message that covers the price", () => {
  assert.equal(decideReferenceLink(stored(), order(), { lateWindowMs: LATE }).action, "link");
  assert.equal(
    decideReferenceLink(stored({ amountPiasters: 15_000 }), order(), { lateWindowMs: LATE }).action,
    "link",
  );
});

test("decideReferenceLink refuses a message that is not there, was used, or is too small", () => {
  assert.deepEqual(decideReferenceLink(null, order(), { lateWindowMs: LATE }), {
    action: "refuse",
    reason: "not_found",
  });
  assert.deepEqual(
    decideReferenceLink(stored({ status: "linked" }), order(), { lateWindowMs: LATE }),
    {
      action: "refuse",
      reason: "already_used",
    },
  );
  assert.deepEqual(
    decideReferenceLink(stored({ amountPiasters: 5_000 }), order(), { lateWindowMs: LATE }),
    { action: "refuse", reason: "wrong_amount" },
  );
});

test("decideReferenceLink refuses a transfer older than the order", () => {
  const early = stored({ receivedAt: "2026-11-17T08:00:00.000Z" });
  assert.deepEqual(decideReferenceLink(early, order(), { lateWindowMs: LATE }), {
    action: "refuse",
    reason: "before_order",
  });
});
