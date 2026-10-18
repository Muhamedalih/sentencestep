// Run with `npm run test:billing`. Fakes only — no database, no network.

import { test } from "node:test";
import assert from "node:assert/strict";

import type { FulfillmentOutcome, PaymentAlert } from "@/lib/billing/payments/fulfillment";

import { handleIngest, handlePending, INGEST_PATH, PENDING_PATH } from "./ingest";
import type { RelayDeps } from "./ingest";
import { RELAY_SIGNATURE_HEADER, RELAY_TIMESTAMP_HEADER, signRelayRequest } from "./relay-auth";
import { HOUR, InMemoryBinancePayStore, MINUTE, NOW, iso } from "./test-support";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";

function setup() {
  const store = new InMemoryBinancePayStore();
  const alerts: PaymentAlert[] = [];
  const fulfilled: string[] = [];
  const deps: RelayDeps = {
    secret: SECRET,
    store,
    providerEnv: "test",
    now: () => NOW,
    fulfill: async (referenceId): Promise<FulfillmentOutcome> => {
      fulfilled.push(referenceId);
      return { outcome: "fulfilled", premiumUntil: null };
    },
    report: (alert) => {
      alerts.push(alert);
    },
  };
  return { store, alerts, fulfilled, deps };
}

function signed(method: string, path: string, body: string, timestamp = NOW) {
  const map = new Map([
    [RELAY_TIMESTAMP_HEADER, String(timestamp)],
    [RELAY_SIGNATURE_HEADER, signRelayRequest(SECRET, timestamp, method, path, body)],
  ]);
  return { get: (name: string) => map.get(name) ?? null };
}

function binanceRecord(overrides: Record<string, unknown> = {}) {
  return {
    orderType: "C2C",
    transactionId: "P_A1B2C3D4E5F6G7H8",
    transactionTime: NOW - 2 * MINUTE,
    amount: "6.00000000",
    currency: "USDT",
    note: "SS-7K3Q2",
    payerInfo: { name: "Sara A.", binanceId: "987654321", email: "sara@example.com" },
    ...overrides,
  };
}

async function ingest(deps: RelayDeps, records: unknown[], extra: Record<string, unknown> = {}) {
  const body = JSON.stringify({ records, ...extra });
  return handleIngest(deps, { body, headers: signed("POST", INGEST_PATH, body) });
}

test("handleIngest: a transfer carrying the order's code activates the order, once", async () => {
  const { store, deps, fulfilled, alerts } = setup();
  store.addOrder();

  const first = await ingest(deps, [binanceRecord()]);
  assert.deepEqual(first, {
    status: 200,
    body: { ok: true, received: 1, inserted: 1, skipped: 0, linked: 1, fulfilled: 1 },
  });
  assert.deepEqual(fulfilled, ["ss_ref1"]);
  assert.equal(store.transfers[0]!.status, "linked");
  assert.equal(alerts.length, 0);

  // The relay re-reads an overlapping window every time: the same transfer changes nothing.
  const second = await ingest(deps, [binanceRecord()]);
  assert.deepEqual(second.body, {
    ok: true,
    received: 1,
    inserted: 0,
    skipped: 0,
    linked: 0,
    fulfilled: 0,
  });
  assert.deepEqual(fulfilled, ["ss_ref1"]);
});

test("handleIngest: a request that is not signed is refused and nothing is stored", async () => {
  const { store, deps } = setup();
  store.addOrder();
  const body = JSON.stringify({ records: [binanceRecord()] });

  const unsigned = await handleIngest(deps, { body, headers: { get: () => null } });
  assert.deepEqual(unsigned, { status: 401, body: { error: "unauthorized" } });

  const wrongPath = await handleIngest(deps, { body, headers: signed("POST", PENDING_PATH, body) });
  assert.equal(wrongPath.status, 401);

  const tampered = await handleIngest(deps, {
    body: body.replace("6.00", "9.00"),
    headers: signed("POST", INGEST_PATH, body),
  });
  assert.equal(tampered.status, 401);
  assert.equal(store.transfers.length, 0);
});

test("handleIngest: a stale signature is refused", async () => {
  const { deps } = setup();
  const body = JSON.stringify({ records: [] });
  const response = await handleIngest(deps, {
    body,
    headers: signed("POST", INGEST_PATH, body, NOW - 10 * MINUTE),
  });
  assert.equal(response.status, 401);
});

test("handleIngest: a transfer that is too small is stored, not activated, and an admin is told once", async () => {
  const { store, deps, fulfilled, alerts } = setup();
  store.addOrder();

  const response = await ingest(deps, [binanceRecord({ amount: "5.00000000" })]);
  assert.equal(response.status, 200);
  assert.equal(response.body.linked, 0);
  assert.deepEqual(fulfilled, []);
  assert.equal(store.transfers[0]!.status, "new");
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0]!.code, "binance_transfer_needs_match");
  assert.equal(alerts[0]!.referenceId, "ss_ref1");

  // Seen again on the next visit: still waiting, but nobody is told twice.
  await ingest(deps, [binanceRecord({ amount: "5.00000000" })]);
  assert.equal(alerts.length, 1);
});

test("handleIngest: a transfer with no code that no waiting order could be just waits for an admin, quietly", async () => {
  const { store, deps, fulfilled, alerts } = setup();
  // The only order costs 6 USDT: a friend's 5 USDT cannot be it.
  store.addOrder();
  await ingest(deps, [binanceRecord({ note: "hello", amount: "5.00000000" })]);
  assert.deepEqual(fulfilled, []);
  assert.equal(store.transfers[0]!.status, "new");
  assert.equal(alerts.length, 0);
});

test("handleIngest: a transfer with no code and nobody waiting is not worth a word", async () => {
  const { store, deps, fulfilled, alerts } = setup();
  await ingest(deps, [binanceRecord({ note: "hello" })]);
  assert.deepEqual(fulfilled, []);
  assert.equal(store.transfers[0]!.status, "new");
  assert.equal(alerts.length, 0);
});

test("handleIngest: a transfer with no code that a waiting order could be is never activated, but an admin is told once", async () => {
  const { store, deps, fulfilled, alerts } = setup();
  store.addOrder();
  await ingest(deps, [binanceRecord({ note: "hello" })]);
  assert.deepEqual(fulfilled, []);
  assert.equal(store.transfers[0]!.status, "new");
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0]!.code, "binance_transfer_needs_match");
  assert.equal(alerts[0]!.referenceId, "ss_ref1");
  assert.match(alerts[0]!.detail ?? "", /no order code/);
  assert.match(alerts[0]!.detail ?? "", /SS-7K3Q2/);

  // Seen again on the next visit: still waiting, but nobody is told twice.
  await ingest(deps, []);
  assert.equal(alerts.length, 1);
});

test("handleIngest: the code is found even when Binance puts the sender's text under another name", async () => {
  const { store, deps, fulfilled, alerts } = setup();
  store.addOrder();
  await ingest(deps, [binanceRecord({ note: undefined, remark: "ss 7k3q2 thanks" })]);
  assert.deepEqual(fulfilled, ["ss_ref1"]);
  assert.equal(store.transfers[0]!.status, "linked");
  assert.equal(alerts.length, 0);
});

test("handleIngest: a code nobody owns alerts the admins (it is probably a typo of a real order)", async () => {
  const { store, deps, alerts } = setup();
  store.addOrder();
  await ingest(deps, [binanceRecord({ note: "SS-ABCDE" })]);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0]!.referenceId, "batch");
});

test("handleIngest: money in another coin, or going out, never activates anything", async () => {
  const { store, deps, fulfilled } = setup();
  store.addOrder();
  await ingest(deps, [
    binanceRecord({ transactionId: "OTHER_0001", currency: "BTC", amount: "0.1" }),
    binanceRecord({ transactionId: "OUT_000001", amount: "-6.00000000" }),
  ]);
  assert.deepEqual(fulfilled, []);
  assert.equal(store.transfers.length, 1);
  assert.equal(store.transfers[0]!.status, "new");
});

test("handleIngest: with automatic activation off, transfers wait for an admin and nothing is linked", async () => {
  const { store, deps, fulfilled } = setup();
  store.settings = { ...store.settings, autoActivate: false };
  store.addOrder();
  await ingest(deps, [binanceRecord()]);
  assert.deepEqual(fulfilled, []);
  assert.equal(store.transfers[0]!.status, "new");
});

test("handleIngest: switching automatic activation back on picks the waiting transfer up on the next visit", async () => {
  const { store, deps, fulfilled } = setup();
  store.settings = { ...store.settings, autoActivate: false };
  store.addOrder();
  await ingest(deps, [binanceRecord()]);
  store.settings = { ...store.settings, autoActivate: true };
  await ingest(deps, []);
  assert.deepEqual(fulfilled, ["ss_ref1"]);
});

test("handleIngest: an order paid twice is not paid twice, and the second transfer is flagged", async () => {
  const { store, deps, fulfilled, alerts } = setup();
  const order = store.addOrder();
  await ingest(deps, [binanceRecord()]);
  order.status = "fulfilled";
  await ingest(deps, [binanceRecord({ transactionId: "P_SECOND_TRANSFER" })]);
  assert.deepEqual(fulfilled, ["ss_ref1"]);
  assert.equal(alerts.length, 1);
});

test("handleIngest: a late payment for an expired order is still honoured inside the window", async () => {
  const { store, deps, fulfilled } = setup();
  store.addOrder({ status: "expired", createdAt: iso(-5 * HOUR) });
  await ingest(deps, [binanceRecord({ transactionTime: NOW - 1 * MINUTE })]);
  assert.deepEqual(fulfilled, ["ss_ref1"]);
});

test("handleIngest: one failing transfer does not stop the others", async () => {
  const { store, deps, fulfilled } = setup();
  store.addOrder();
  store.addOrder({ orderCode: "SS-ABCDE", referenceId: "ss_ref2" });
  store.failNext = "linkTransfer";
  await ingest(deps, [
    binanceRecord({ transactionId: "FIRST_00001" }),
    binanceRecord({ transactionId: "SECOND_0001", note: "SS-ABCDE" }),
  ]);
  assert.deepEqual(fulfilled, ["ss_ref2"]);
  // The first is still unlinked, so the next visit retries it.
  await ingest(deps, []);
  assert.deepEqual(fulfilled, ["ss_ref2", "ss_ref1"]);
});

test("handleIngest: a database failure answers 500 so the relay tries again later", async () => {
  const { store, deps } = setup();
  store.failNext = "insertTransfers";
  const response = await ingest(deps, [binanceRecord()]);
  assert.deepEqual(response, { status: 500, body: { error: "ingest_failed" } });
});

test("handleIngest: the relay reporting its own error is recorded and is not a success", async () => {
  const { store, deps } = setup();
  const response = await ingest(deps, [], { error: "binance answered 451" });
  assert.equal(response.status, 200);
  assert.equal(store.relay.lastError, "binance answered 451");
  assert.equal(store.relay.lastSuccessAt, null);
});

test("handleIngest: a success clears the earlier error", async () => {
  const { store, deps } = setup();
  await ingest(deps, [], { error: "binance answered 451" });
  await ingest(deps, []);
  assert.equal(store.relay.lastError, null);
  assert.equal(store.relay.lastSuccessAt, new Date(NOW).toISOString());
});

test("handleIngest: a malformed body is a 400, after the signature is checked", async () => {
  const { deps } = setup();
  const body = "not json";
  const response = await handleIngest(deps, { body, headers: signed("POST", INGEST_PATH, body) });
  assert.deepEqual(response, { status: 400, body: { error: "not_json" } });
});

test("handlePending: watches fast while an order waits, and records that the relay asked", async () => {
  const { store, deps } = setup();
  store.addOrder();
  store.relay.lastSuccessAt = iso(-1 * MINUTE);

  const response = await handlePending(deps, { headers: signed("GET", PENDING_PATH, "") });
  assert.equal(response.status, 200);
  assert.equal(response.body.watch, true);
  assert.equal(response.body.intervalSeconds, 15);
  assert.equal(store.relay.lastPollAt, new Date(NOW).toISOString());
});

test("handlePending: with nobody waiting it only asks to look when the periodic sweep is due", async () => {
  const { store, deps } = setup();
  store.relay.lastSuccessAt = iso(-2 * MINUTE);
  const quiet = await handlePending(deps, { headers: signed("GET", PENDING_PATH, "") });
  assert.equal(quiet.body.watch, false);
  assert.equal(quiet.body.intervalSeconds, 60);

  store.relay.lastSuccessAt = iso(-11 * MINUTE);
  const due = await handlePending(deps, { headers: signed("GET", PENDING_PATH, "") });
  assert.equal(due.body.watch, true);
});

test("handlePending: the first look ever goes back a day, and later ones overlap the last good one", async () => {
  const { store, deps } = setup();
  const first = await handlePending(deps, { headers: signed("GET", PENDING_PATH, "") });
  assert.equal(first.body.sinceMs, NOW - 24 * HOUR - 15 * MINUTE);

  store.relay.lastSuccessAt = iso(-5 * MINUTE);
  const later = await handlePending(deps, { headers: signed("GET", PENDING_PATH, "") });
  assert.equal(later.body.sinceMs, NOW - 5 * MINUTE - 15 * MINUTE);
});

test("handlePending: never looks further back than a week", async () => {
  const { store, deps } = setup();
  store.relay.lastSuccessAt = iso(-30 * 24 * HOUR);
  const response = await handlePending(deps, { headers: signed("GET", PENDING_PATH, "") });
  assert.equal(response.body.sinceMs, NOW - 7 * 24 * HOUR);
});

test("handlePending: an unsigned request is refused without touching the database", async () => {
  const { store, deps } = setup();
  store.failNext = "listPaymentStates";
  const response = await handlePending(deps, { headers: { get: () => null } });
  assert.equal(response.status, 401);
  assert.equal(store.relay.lastPollAt, null);
});
