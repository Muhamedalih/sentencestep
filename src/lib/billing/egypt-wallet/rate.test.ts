// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import type { PaymentAlert } from "@/lib/billing/payments/fulfillment";
import { PLANS } from "@/lib/billing/plans";
import { chargeMatchesStoredRate, quotePrice } from "@/lib/billing/pricing";

import {
  checkReading,
  effectiveRate,
  FALLBACK_USD_EGP,
  isSaneRate,
  parseErApi,
  parseFawazApi,
  refreshRate,
  REFRESH_AFTER_MS,
  roundRate,
  STALE_AFTER_MS,
} from "./rate";
import type { RateStore } from "./rate";
import type { EgyptWalletSettings } from "./settings";
import { DEFAULT_EGYPT_WALLET_SETTINGS } from "./settings";

const NOW = Date.parse("2026-11-17T12:00:00.000Z");

function fake(settings: Partial<EgyptWalletSettings> = {}) {
  const state = { ...DEFAULT_EGYPT_WALLET_SETTINGS, ...settings };
  const saved: { rate: number; source: string }[] = [];
  const alerts: PaymentAlert[] = [];
  const store: RateStore = {
    getSettings: async () => state,
    saveRate: async ({ rate, source }) => {
      saved.push({ rate, source });
    },
  };
  const deps = (reading: { rate: number; source: string } | null) => ({
    store,
    now: () => NOW,
    report: (alert: PaymentAlert) => {
      alerts.push(alert);
    },
    fetchRate: async () => reading,
  });
  return { saved, alerts, deps };
}

test("the sources' answers are read, and a wrong shape or an insane number is refused", () => {
  assert.equal(parseErApi({ result: "success", rates: { EGP: 53.68 } }), 53.68);
  assert.equal(parseErApi({ result: "error" }), null);
  assert.equal(parseErApi({ result: "success", rates: { EGP: 0 } }), null);
  assert.equal(parseFawazApi({ date: "2026-11-17", usd: { egp: 53.68 } }), 53.68);
  assert.equal(parseFawazApi({ usd: {} }), null);
  assert.equal(parseFawazApi(null), null);
  assert.equal(isSaneRate(5000), false);
  assert.equal(isSaneRate("54"), false);
});

test("a rate is rounded to four decimals", () => {
  assert.equal(roundRate(53.681178), 53.6812);
});

test("with no stored rate the fallback is used, otherwise the stored one", () => {
  assert.deepEqual(effectiveRate(DEFAULT_EGYPT_WALLET_SETTINGS), {
    rate: FALLBACK_USD_EGP,
    source: "fallback",
    updatedAt: null,
  });
  const stored = effectiveRate({
    usdToEgp: 53.7,
    rateSource: "x",
    rateUpdatedAt: "2026-11-17T00:00:00Z",
  });
  assert.equal(stored.rate, 53.7);
});

test("a reading too far from the previous one is refused", () => {
  assert.equal(checkReading(53.7, 53.68).ok, true);
  assert.equal(checkReading(60, 53.68).ok, false);
  assert.equal(checkReading(10, null).ok, false);
  assert.equal(checkReading(60, null).ok, true);
});

test("the first reading is stored", async () => {
  const t = fake();
  assert.equal(await refreshRate(t.deps({ rate: 53.68, source: "a" })), "updated");
  assert.deepEqual(t.saved, [{ rate: 53.68, source: "a" }]);
});

test("a fresh rate is not read again, and a stale one is", async () => {
  const fresh = fake({ usdToEgp: 53.6, rateUpdatedAt: new Date(NOW - 5 * 3600_000).toISOString() });
  assert.equal(await refreshRate(fresh.deps({ rate: 53.7, source: "a" })), "fresh");
  assert.deepEqual(fresh.saved, []);

  const old = fake({
    usdToEgp: 53.6,
    rateUpdatedAt: new Date(NOW - REFRESH_AFTER_MS - 60_000).toISOString(),
  });
  assert.equal(await refreshRate(old.deps({ rate: 53.7, source: "a" })), "updated");
  assert.equal(old.saved.length, 1);
});

test("a rate set by hand is never replaced by the automatic update", async () => {
  const t = fake({ usdToEgp: 55, rateLocked: true, rateUpdatedAt: "2026-01-01T00:00:00Z" });
  assert.equal(await refreshRate(t.deps({ rate: 53.7, source: "a" })), "locked");
  assert.deepEqual(t.saved, []);
});

test("a wild reading is refused, the old rate stays and the admins are told", async () => {
  const t = fake({ usdToEgp: 53.6, rateUpdatedAt: new Date(NOW - 30 * 3600_000).toISOString() });
  assert.equal(await refreshRate(t.deps({ rate: 75, source: "bad" })), "refused");
  assert.deepEqual(t.saved, []);
  assert.equal(t.alerts[0]?.code, "egypt_wallet_rate_refused");
});

test("an unreachable service keeps the rate quietly at first and alerts after two days", async () => {
  const recent = fake({
    usdToEgp: 53.6,
    rateUpdatedAt: new Date(NOW - 25 * 3600_000).toISOString(),
  });
  assert.equal(await refreshRate(recent.deps(null)), "unreachable");
  assert.deepEqual(recent.alerts, []);

  const stale = fake({
    usdToEgp: 53.6,
    rateUpdatedAt: new Date(NOW - STALE_AFTER_MS - 3600_000).toISOString(),
  });
  assert.equal(await refreshRate(stale.deps(null)), "unreachable");
  assert.equal(stale.alerts[0]?.code, "egypt_wallet_rate_stale");

  const never = fake();
  assert.equal(await refreshRate(never.deps(null)), "unreachable");
  assert.equal(never.alerts[0]?.code, "egypt_wallet_rate_stale");
});

test("prices follow the day's rate, rounded to the nearest whole pound", () => {
  const price = (id: "1m" | "3m" | "6m", rate: number) =>
    quotePrice("A", "EGP", id, 0, { ratePerUsd: rate }).amount;
  // 53.68: 4 USD is 214.72, which is 215.
  assert.equal(price("3m", 53.68), 215);
  assert.equal(price("1m", 53.68), 107);
  assert.equal(price("6m", 53.68), 376);
  // 249.5 style: exactly half a pound goes up.
  assert.equal(quotePrice("A", "EGP", "1m", 0, { ratePerUsd: 54.75 }).amount, 110);
});

test("without a day rate the fixed rate still applies, and other currencies are untouched", () => {
  assert.equal(quotePrice("A", "EGP", "3m").amount, 216);
  assert.equal(quotePrice("A", "USDT", "3m", 0, { ratePerUsd: 99 }).amount, 4);
  assert.equal(quotePrice("A", "IQD", "3m").amount, 6080);
});

test("a rate outside the allowed range is never used to price", () => {
  assert.throws(() => quotePrice("A", "EGP", "3m", 0, { ratePerUsd: 5 }));
  assert.throws(() => quotePrice("A", "EGP", "3m", 0, { ratePerUsd: Number.NaN }));
});

test("every plan at every plausible rate passes the database's snapshot check", () => {
  for (let rate = 30; rate <= 90; rate += 0.37) {
    for (const plan of PLANS) {
      for (const tier of ["A", "B"] as const) {
        const quote = quotePrice(tier, "EGP", plan.id, 0, { ratePerUsd: rate });
        assert.equal(
          chargeMatchesStoredRate(quote.amount, quote.usdCents, quote.fxRatePerUsd),
          true,
          `${plan.id} ${tier} at ${rate}: ${quote.amount} vs ${quote.fxRatePerUsd}`,
        );
      }
    }
  }
});
