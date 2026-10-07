// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { PLANS } from "./plans";
import { formatUsd, formatUsdExact, formatUsdPerDay, quotePrice, tierForCountry } from "./pricing";

const TIER_A_COUNTRIES = ["iq", "eg", "dz", "tn", "ma", "sd", "jo", "sy", "lb", "ps", "ye"];

test("tierForCountry: every listed country gets Tier A", () => {
  for (const country of TIER_A_COUNTRIES) {
    assert.equal(tierForCountry(country), "A", country);
  }
});

test("tierForCountry: everywhere else, and an unknown country, gets Tier B", () => {
  for (const country of ["us", "gb", "sa", "ae", "tr", "es", "de", "ly", "kw"]) {
    assert.equal(tierForCountry(country), "B", country);
  }
  assert.equal(tierForCountry(null), "B");
});

test("tierForCountry: only normalized lowercase codes match, so unexpected input falls back to Tier B", () => {
  assert.equal(tierForCountry("IQ"), "B");
  assert.equal(tierForCountry(""), "B");
  assert.equal(tierForCountry("iraq"), "B");
});

test("quotePrice: the one-month plan is $2 (Tier A) = 2640 IQD at the fixed 1320 rate", () => {
  const quote = quotePrice("A", "IQD", "1m");
  assert.deepEqual(quote, {
    tier: "A",
    planId: "1m",
    usdCents: 200,
    currency: "IQD",
    fxRatePerUsd: 1320,
    amount: 2640,
    premiumDays: 30,
  });
});

test("quotePrice: the one-month plan is $3 (Tier B) = 3960 IQD at the fixed 1320 rate", () => {
  const quote = quotePrice("B", "IQD", "1m");
  assert.equal(quote.amount, 3960);
  assert.equal(quote.fxRatePerUsd, 1320);
  assert.equal(quote.usdCents, 300);
});

test("quotePrice: every plan in every tier has its agreed price and days", () => {
  const expected = {
    A: { "1m": [200, 30], "3m": [400, 90], "6m": [700, 180] },
    B: { "1m": [300, 30], "3m": [600, 90], "6m": [1000, 180] },
  } as const;
  for (const tier of ["A", "B"] as const) {
    for (const plan of PLANS) {
      const quote = quotePrice(tier, "IQD", plan.id);
      assert.deepEqual(
        [quote.usdCents, quote.premiumDays],
        expected[tier][plan.id],
        `${tier} ${plan.id}`,
      );
    }
  }
});

test("quotePrice: every plan clears Wayl's 1000 IQD minimum with whole-number amounts", () => {
  for (const tier of ["A", "B"] as const) {
    for (const plan of PLANS) {
      const { amount } = quotePrice(tier, "IQD", plan.id);
      assert.ok(Number.isInteger(amount), `${tier} ${plan.id}`);
      assert.ok(amount >= 1000, `${tier} ${plan.id}`);
    }
  }
});

test("quotePrice: refuses a currency that has no fixed rate configured", () => {
  assert.throws(() => quotePrice("A", "EUR", "1m"), /No fixed exchange rate/);
  assert.throws(() => quotePrice("A", "constructor", "1m"), /No fixed exchange rate/);
});

test("formatUsd: whole dollars have no decimals", () => {
  assert.equal(formatUsd(200), "$2");
  assert.equal(formatUsd(300), "$3");
});

test("formatUsd: fractional dollars keep two decimals", () => {
  assert.equal(formatUsd(250), "$2.50");
});

test("formatUsdPerDay: spreads the price over the days, to the nearest cent", () => {
  assert.equal(formatUsdPerDay(200, 30), "$0.07");
  assert.equal(formatUsdPerDay(300, 30), "$0.10");
});

test("formatUsdExact: always two decimals so plans line up", () => {
  assert.equal(formatUsdExact(200), "$2.00");
  assert.equal(formatUsdExact(133), "$1.33");
});
