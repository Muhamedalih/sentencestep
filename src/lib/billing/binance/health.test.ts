// Run with `npm run test:billing`. Fakes only — no database, no network.

import { test } from "node:test";
import assert from "node:assert/strict";

import type { PaymentAlert } from "@/lib/billing/payments/fulfillment";

import { checkRelayHealth } from "./health";
import { InMemoryBinancePayStore, MINUTE, NOW, iso } from "./test-support";

function setup() {
  const store = new InMemoryBinancePayStore();
  const alerts: PaymentAlert[] = [];
  const check = () =>
    checkRelayHealth({
      store,
      providerEnv: "test",
      now: new Date(NOW),
      report: (alert) => {
        alerts.push(alert);
      },
    });
  return { store, alerts, check };
}

test("checkRelayHealth: nobody waiting means a quiet relay is fine", async () => {
  const { alerts, check } = setup();
  assert.equal(await check(), "idle");
  assert.equal(alerts.length, 0);
});

test("checkRelayHealth: someone waiting and a relay that asked a moment ago is healthy", async () => {
  const { store, alerts, check } = setup();
  store.addOrder();
  store.relay.lastPollAt = iso(-1 * MINUTE);
  assert.equal(await check(), "ok");
  assert.equal(alerts.length, 0);
});

test("checkRelayHealth: someone waiting and a relay silent for a long time alerts the admins", async () => {
  const { store, alerts, check } = setup();
  store.addOrder();
  store.relay.lastPollAt = iso(-30 * MINUTE);
  assert.equal(await check(), "offline");
  assert.equal(alerts[0]!.code, "binance_relay_offline");
});

test("checkRelayHealth: a relay that has never reported in counts as offline when someone waits", async () => {
  const { store, alerts, check } = setup();
  store.addOrder();
  assert.equal(await check(), "offline");
  assert.equal(alerts[0]!.detail, "The relay has never reported in.");
});

test("checkRelayHealth: a recent failure to read Binance is reported even though the relay is alive", async () => {
  const { store, alerts, check } = setup();
  store.addOrder();
  store.relay.lastPollAt = iso(-30 * 1000);
  store.relay.lastError = "binance answered 451";
  store.relay.lastErrorAt = iso(-2 * MINUTE);
  assert.equal(await check(), "error");
  assert.equal(alerts[0]!.code, "binance_relay_error");
  assert.equal(alerts[0]!.detail, "binance answered 451");
});

test("checkRelayHealth: a relay that asks but whose looks are no longer accepted alerts the admins", async () => {
  const { store, alerts, check } = setup();
  store.addOrder();
  store.relay.lastPollAt = iso(-30 * 1000);
  store.relay.lastSuccessAt = iso(-30 * MINUTE);
  assert.equal(await check(), "error");
  assert.equal(alerts[0]!.code, "binance_relay_error");
  assert.match(alerts[0]!.detail ?? "", /last accepted look at Binance/);
});

test("checkRelayHealth: a recent accepted look keeps a waiting order healthy", async () => {
  const { store, alerts, check } = setup();
  store.addOrder();
  store.relay.lastPollAt = iso(-30 * 1000);
  store.relay.lastSuccessAt = iso(-1 * MINUTE);
  assert.equal(await check(), "ok");
  assert.equal(alerts.length, 0);
});

test("checkRelayHealth: an old failure that has since cleared is not reported", async () => {
  const { store, alerts, check } = setup();
  store.addOrder();
  store.relay.lastPollAt = iso(-30 * 1000);
  store.relay.lastError = "old";
  store.relay.lastErrorAt = iso(-3 * 60 * MINUTE);
  assert.equal(await check(), "ok");
  assert.equal(alerts.length, 0);
});
