// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { acceptedMethodNames } from "./pay-methods";

// gate-pay.ts reads request headers, so only its pure half is loaded here.
async function loadBuild() {
  const mod = await import("./gate-pay");
  return mod.buildGatePay;
}

const NOW = new Date("2026-11-10T09:00:00.000Z");

test("acceptedMethodNames: cards for everyone, Iraqi wallets only in Iraq, Binance Pay only while offered", () => {
  assert.deepEqual(acceptedMethodNames({ iraqiWallets: false, binancePay: false }), [
    "Visa",
    "Mastercard",
  ]);
  assert.deepEqual(acceptedMethodNames({ iraqiWallets: true, binancePay: true }), [
    "Visa",
    "Mastercard",
    "Super Qi",
    "ZainCash",
    "FIB",
    "Binance Pay",
  ]);
});

test("buildGatePay: no offer means no offer row, and an ended offer is not shown", async () => {
  const buildGatePay = await loadBuild();
  assert.equal(buildGatePay({ offer: null, now: NOW, iraq: false, binancePay: false }).offer, null);
  const ended = { bonusDays: 7, endsOn: "2026-11-01" };
  assert.equal(
    buildGatePay({ offer: ended, now: NOW, iraq: false, binancePay: false }).offer,
    null,
  );
});

test("buildGatePay: a running offer carries its days per plan, and one shared number only when they match", async () => {
  const buildGatePay = await loadBuild();
  const same = buildGatePay({
    offer: { bonusDays: 7, endsOn: "2026-12-01" },
    now: NOW,
    iraq: false,
    binancePay: true,
  });
  assert.deepEqual(same.offer, { byPlan: { "1m": 7, "3m": 7, "6m": 7 }, shared: 7 });
  assert.deepEqual(same.methods, ["Visa", "Mastercard", "Binance Pay"]);

  const differ = buildGatePay({
    offer: { bonusDays: 7, planBonusDays: { "3m": 10, "6m": 15 }, endsOn: "2026-12-01" },
    now: NOW,
    iraq: true,
    binancePay: false,
  });
  assert.deepEqual(differ.offer, { byPlan: { "1m": 7, "3m": 10, "6m": 15 }, shared: null });
  assert.deepEqual(differ.methods, ["Visa", "Mastercard", "Super Qi", "ZainCash", "FIB"]);
});
