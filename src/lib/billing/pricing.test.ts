// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PREMIUM_DAYS,
  TIER_PRICE_USD_CENTS,
  formatUsd,
  quotePrice,
  tierForCountry,
} from "./pricing";

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

test("tier prices are $2 and $3", () => {
  assert.equal(TIER_PRICE_USD_CENTS.A, 200);
  assert.equal(TIER_PRICE_USD_CENTS.B, 300);
});

test("quotePrice: Tier A is $2 = 2640 IQD at the fixed 1320 rate", () => {
  const quote = quotePrice("A", "IQD");
  assert.deepEqual(quote, {
    tier: "A",
    usdCents: 200,
    currency: "IQD",
    fxRatePerUsd: 1320,
    amount: 2640,
    premiumDays: 30,
  });
});

test("quotePrice: Tier B is $3 = 3960 IQD at the fixed 1320 rate", () => {
  const quote = quotePrice("B", "IQD");
  assert.equal(quote.amount, 3960);
  assert.equal(quote.fxRatePerUsd, 1320);
  assert.equal(quote.usdCents, 300);
});

test("quotePrice: both tiers clear Wayl's 1000 IQD minimum with whole-number amounts", () => {
  for (const tier of ["A", "B"] as const) {
    const { amount } = quotePrice(tier, "IQD");
    assert.ok(Number.isInteger(amount));
    assert.ok(amount >= 1000);
  }
});

test("quotePrice: grants 30 days", () => {
  assert.equal(PREMIUM_DAYS, 30);
  assert.equal(quotePrice("A", "IQD").premiumDays, 30);
});

test("quotePrice: refuses a currency that has no fixed rate configured", () => {
  assert.throws(() => quotePrice("A", "EUR"), /No fixed exchange rate/);
  assert.throws(() => quotePrice("A", "constructor"), /No fixed exchange rate/);
});

test("formatUsd: whole dollars have no decimals", () => {
  assert.equal(formatUsd(200), "$2");
  assert.equal(formatUsd(300), "$3");
});

test("formatUsd: fractional dollars keep two decimals", () => {
  assert.equal(formatUsd(250), "$2.50");
});
