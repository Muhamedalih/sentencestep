// Run with `npm run test:billing`. Fakes only — no database, no network.

import { test } from "node:test";
import assert from "node:assert/strict";

import type { FulfillmentOutcome } from "@/lib/billing/payments/fulfillment";

import { linkTransferByAdmin } from "./manual-link";
import { InMemoryBinancePayStore, makeTransfer } from "./test-support";

const FULFILLED: FulfillmentOutcome = {
  outcome: "fulfilled",
  premiumUntil: "2026-12-01T00:00:00.000Z",
};

async function setup(
  transfer = makeTransfer({ note: null }),
  order: Parameters<InMemoryBinancePayStore["addOrder"]>[0] = {},
) {
  const store = new InMemoryBinancePayStore();
  const added = store.addOrder(order);
  await store.insertTransfers([transfer]);
  const fulfilled: string[] = [];
  const deps = {
    store,
    fulfill: async (referenceId: string) => {
      fulfilled.push(referenceId);
      return FULFILLED;
    },
  };
  return { store, deps, order: added, fulfilled };
}

test("linkTransferByAdmin: a transfer with no code can be attached to an order by hand, and the order is fulfilled", async () => {
  const { deps, order, fulfilled, store } = await setup();
  const result = await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: order.id });
  assert.deepEqual(result, { ok: true, outcome: FULFILLED });
  assert.deepEqual(fulfilled, ["ss_ref1"]);
  assert.equal(store.transfers[0]!.status, "linked");
});

test("linkTransferByAdmin: a transfer lower than the price is refused, with the numbers in the message", async () => {
  const { deps, order, fulfilled } = await setup(
    makeTransfer({ note: null, amount: "5.00000000" }),
  );
  const result = await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: order.id });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /5\.00000000 USDT.*lower.*6 USDT/);
  assert.deepEqual(fulfilled, []);
});

test("linkTransferByAdmin: only a USDT transfer of a payment type can pay an order", async () => {
  const { deps, order } = await setup(makeTransfer({ note: null, currency: "BTC", amount: "1" }));
  const result = await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: order.id });
  assert.equal(result.ok, false);
});

test("linkTransferByAdmin: a transfer already linked or ignored is refused", async () => {
  const { deps, order, store } = await setup();
  await store.ignoreTransfer("transfer-1");
  const result = await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: order.id });
  assert.deepEqual(result, { ok: false, error: "That transfer was already linked or ignored." });
});

test("linkTransferByAdmin: an order that is already paid is refused", async () => {
  const { deps, order } = await setup(makeTransfer({ note: null }), { status: "fulfilled" });
  const result = await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: order.id });
  assert.deepEqual(result, { ok: false, error: "That order is already paid." });
});

test("linkTransferByAdmin: an order waiting for review is not paid this way", async () => {
  const { deps, order } = await setup(makeTransfer({ note: null }), { status: "needs_review" });
  const result = await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: order.id });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /Give Premium/);
});

test("linkTransferByAdmin: an order an admin had cancelled can still take a real payment", async () => {
  const { deps, order, fulfilled } = await setup(makeTransfer({ note: null }), {
    status: "cancelled",
  });
  const result = await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: order.id });
  assert.equal(result.ok, true);
  assert.deepEqual(fulfilled, ["ss_ref1"]);
});

test("linkTransferByAdmin: unknown transfer or order ids are errors, not crashes", async () => {
  const { deps, order } = await setup();
  assert.deepEqual(await linkTransferByAdmin(deps, { transferId: "nope", orderId: order.id }), {
    ok: false,
    error: "That transfer no longer exists.",
  });
  assert.deepEqual(await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: "nope" }), {
    ok: false,
    error: "That order no longer exists.",
  });
});

test("linkTransferByAdmin: one transfer per order, so a second transfer cannot be attached to a paid-for order", async () => {
  const { deps, order, store } = await setup();
  await linkTransferByAdmin(deps, { transferId: "transfer-1", orderId: order.id });
  await store.insertTransfers([makeTransfer({ transactionId: "TX_0002", note: null })]);
  const result = await linkTransferByAdmin(deps, { transferId: "transfer-2", orderId: order.id });
  assert.equal(result.ok, false);
});
