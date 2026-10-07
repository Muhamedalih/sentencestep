/**
 * Where USD prices become a provider's currency. The prices themselves live in
 * plans.ts, defined and shown in USD only; the provider's settlement currency
 * (Wayl accepts IQD only) is derived from them with a fixed rate immediately
 * before a payment is created.
 */

import { getPlan } from "./plans";
import type { PlanId, PricingTier } from "./plans";

export type { PricingTier } from "./plans";

/**
 * Fixed on purpose: never fetched from an exchange-rate API. Changing a rate
 * is a deliberate code change, and every order snapshots the rate it used.
 */
const FIXED_FX_RATES_PER_USD: ReadonlyMap<string, number> = new Map([["IQD", 1520]]);

/** Lowercase ISO 3166-1 alpha-2 codes, the same format as profiles.country. */
const TIER_A_COUNTRIES: ReadonlySet<string> = new Set([
  "iq",
  "eg",
  "dz",
  "tn",
  "ma",
  "sd",
  "jo",
  "sy",
  "lb",
  "ps",
  "ye",
]);

/** Unknown or missing countries get the standard (Tier B) price. */
export function tierForCountry(country: string | null): PricingTier {
  return country !== null && TIER_A_COUNTRIES.has(country) ? "A" : "B";
}

export interface PriceQuote {
  tier: PricingTier;
  planId: PlanId;
  usdCents: number;
  currency: string;
  fxRatePerUsd: number;
  /** Whole units of `currency`. */
  amount: number;
  premiumDays: number;
}

/**
 * `bonusDays` are extra days given with the purchase (the launch offer): they
 * lengthen the access, never the price, and are part of the order's snapshot.
 */
export function quotePrice(
  tier: PricingTier,
  currency: string,
  planId: PlanId,
  bonusDays = 0,
): PriceQuote {
  const fxRatePerUsd = FIXED_FX_RATES_PER_USD.get(currency);
  if (fxRatePerUsd === undefined) {
    throw new Error(`No fixed exchange rate is configured for ${currency}.`);
  }

  if (!Number.isInteger(bonusDays) || bonusDays < 0) {
    throw new Error(`Bonus days must be a whole number of days, not ${bonusDays}.`);
  }

  const plan = getPlan(planId);
  const usdCents = plan.priceUsdCents[tier];
  const amount = (usdCents * fxRatePerUsd) / 100;
  if (!Number.isInteger(amount)) {
    throw new Error(
      `${usdCents} USD cents at ${fxRatePerUsd} ${currency}/USD is not a whole amount.`,
    );
  }

  return {
    tier,
    planId,
    usdCents,
    currency,
    fxRatePerUsd,
    amount,
    premiumDays: plan.days + bonusDays,
  };
}

/** "$2" for whole dollars, "$2.50" otherwise. */
export function formatUsd(usdCents: number): string {
  const dollars = usdCents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** Always two decimals: "$1.33". Used where prices of different plans are lined up for comparison. */
export function formatUsdExact(usdCents: number): string {
  return `$${(usdCents / 100).toFixed(2)}`;
}

/** The price spread over `days`, to the nearest cent: "$0.07" for $2 over 30 days. */
export function formatUsdPerDay(usdCents: number, days: number): string {
  return `$${(Math.round(usdCents / days) / 100).toFixed(2)}`;
}
