// Run with `npm run test:billing`. Fakes only — no database, no network.

import { test } from "node:test";
import assert from "node:assert/strict";

import { reconcileOpenOrders } from "./reconcile";
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

function setup(
  orders: ReturnType<typeof makeOrder>[],
  batch: ReturnType<typeof makePayment>[] | Error,
) {
  const store = new InMemoryPaymentStore(orders);
  const provider = makeFakeProvider();
  provider.batch = batch;
  const { alerts, report } = collectAlerts();
  return { store, provider, alerts, deps: { provider, store, report, now: () => new Date(NOW) } };
}

const orderFor = (reference: string, overrides: Partial<ReturnType<typeof makeOrder>> = {}) =>
  makeOrder({
    id: `id-${reference}`,
    reference_id: reference,
    provider_payment_id: `link_${reference}`,
    ...overrides,
  });

const paymentFor = (reference: string, overrides: Partial<ReturnType<typeof makePayment>> = {}) =>
  makePayment({ referenceId: reference, providerPaymentId: `link_${reference}`, ...overrides });

test("reconcile: a payment whose webhook never arrived is found and fulfilled, with a single batch lookup", async () => {
  const { store, provider, deps } = setup(
    [orderFor("ss_paid"), orderFor("ss_waiting")],
    [
      paymentFor("ss_paid"),
      paymentFor("ss_waiting", { status: "pending", rawStatus: "Pending", paidAt: null }),
    ],
  );

  const summary = await reconcileOpenOrders(deps);

  assert.deepEqual(summary, {
    checked: 2,
    fulfilled: 1,
    closed: 0,
    needsReview: 0,
    pending: 1,
    errors: [],
  });
  assert.equal(store.get("ss_paid").status, "fulfilled");
  assert.equal(store.get("ss_waiting").status, "pending");
  assert.equal(provider.getPaymentsCalls.length, 1);
  assert.equal(provider.getPaymentCalls.length, 0);
});

test("reconcile: only orders old enough and from this provider and environment are asked about", async () => {
  const { store, deps } = setup([orderFor("ss_a")], [paymentFor("ss_a")]);

  await reconcileOpenOrders(deps, { limit: 10 });

  assert.equal(store.listQueries.length, 1);
  assert.equal(store.listQueries[0]!.provider, "wayl");
  assert.equal(store.listQueries[0]!.providerEnv, "test");
  assert.equal(store.listQueries[0]!.limit, 10);
  assert.equal(store.listQueries[0]!.olderThan.getTime(), NOW - 2 * MINUTE);
});

test("reconcile: with nothing open it never calls the provider", async () => {
  const { provider, deps } = setup([], []);
  const summary = await reconcileOpenOrders(deps);
  assert.equal(summary.checked, 0);
  assert.equal(provider.getPaymentsCalls.length, 0);
});

test("reconcile: an order Wayl does not know about is expired once its link is long gone, and left alone before that", async () => {
  const { store, deps } = setup(
    [
      orderFor("ss_gone", { link_expires_at: iso(-30 * MINUTE), created_at: iso(-95 * MINUTE) }),
      orderFor("ss_young"),
    ],
    [],
  );

  const summary = await reconcileOpenOrders(deps);

  assert.equal(store.get("ss_gone").status, "expired");
  assert.equal(store.get("ss_young").status, "pending");
  assert.equal(summary.closed, 1);
  assert.equal(summary.pending, 1);
});

test("reconcile: an unpaid link past its expiry is closed, a cancelled one too", async () => {
  const { store, deps } = setup(
    [orderFor("ss_old", { link_expires_at: iso(-30 * MINUTE) }), orderFor("ss_cancelled")],
    [
      paymentFor("ss_old", { status: "pending", rawStatus: "Pending", paidAt: null }),
      paymentFor("ss_cancelled", { status: "cancelled", rawStatus: "Cancelled", paidAt: null }),
    ],
  );

  const summary = await reconcileOpenOrders(deps);

  assert.equal(store.get("ss_old").status, "expired");
  assert.equal(store.get("ss_cancelled").status, "cancelled");
  assert.equal(summary.closed, 2);
});

test("reconcile: a mismatching payment is flagged for review and counted, not granted", async () => {
  const { store, alerts, deps } = setup(
    [orderFor("ss_bad")],
    [paymentFor("ss_bad", { amount: 1000 })],
  );

  const summary = await reconcileOpenOrders(deps);

  assert.equal(summary.needsReview, 1);
  assert.equal(store.premiumGrants.length, 0);
  assert.equal(alerts[0]!.code, "amount_mismatch");
});

test("reconcile: one failing order does not stop the others", async () => {
  const { store, deps } = setup(
    [orderFor("ss_boom"), orderFor("ss_fine")],
    [paymentFor("ss_boom"), paymentFor("ss_fine")],
  );
  const original = store.fulfillOrder.bind(store);
  store.fulfillOrder = async (args) => {
    if (args.referenceId === "ss_boom") throw new Error("database timeout");
    return original(args);
  };

  const summary = await reconcileOpenOrders(deps);

  assert.equal(summary.fulfilled, 1);
  assert.equal(store.get("ss_fine").status, "fulfilled");
  assert.deepEqual(summary.errors, ["ss_boom: database timeout"]);
});

test("reconcile: an unreachable provider fails the whole run, so the scheduler reports it", async () => {
  const { deps } = setup([orderFor("ss_a")], new Error("Wayl is down"));
  await assert.rejects(reconcileOpenOrders(deps), /Wayl is down/);
});
