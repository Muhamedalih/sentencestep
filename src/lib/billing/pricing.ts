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
 * USDT is the stablecoin Binance Pay orders are charged in, one for one with
 * the dollar price (every plan costs a whole number of dollars, so the amount
 * is always a whole number of USDT).
 */
const FIXED_FX_RATES_PER_USD: ReadonlyMap<string, number> = new Map([
  ["IQD", 1520],
  ["USDT", 1],
  // Vodafone Cash (Egypt), about the market rate (4 USD = 216 EGP). A whole number of pounds per dollar, so every plan price is a whole
  // number of pounds (the learner is never asked for piasters). A deliberate code change, like the others.
  ["EGP", 54],
]);

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
  options: { ratePerUsd?: number } = {},
): PriceQuote {
  // Egyptian pounds follow the day's rate (see egypt-wallet/rate.ts): the price is the dollar price at
  // that rate rounded to the nearest whole pound, and the order stores the rounded rate (a whole number).
  if (currency === "EGP" && options.ratePerUsd !== undefined) {
    return quoteAtDayRate(tier, currency, planId, bonusDays, options.ratePerUsd);
  }
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

function quoteAtDayRate(
  tier: PricingTier,
  currency: string,
  planId: PlanId,
  bonusDays: number,
  ratePerUsd: number,
): PriceQuote {
  if (!Number.isFinite(ratePerUsd) || ratePerUsd < 20 || ratePerUsd > 200) {
    throw new Error(`The ${currency} rate ${ratePerUsd} is outside the allowed range.`);
  }
  if (!Number.isInteger(bonusDays) || bonusDays < 0) {
    throw new Error(`Bonus days must be a whole number of days, not ${bonusDays}.`);
  }
  const plan = getPlan(planId);
  const usdCents = plan.priceUsdCents[tier];
  return {
    tier,
    planId,
    usdCents,
    currency,
    fxRatePerUsd: Math.round(ratePerUsd),
    amount: Math.round((usdCents * ratePerUsd) / 100),
    premiumDays: plan.days + bonusDays,
  };
}

/**
 * Mirrors the database check for Vodafone Cash orders (migration 20250357): the charge may differ from
 * price x the stored whole rate by the rounding of the rate plus the rounding of the charge.
 */
export function chargeMatchesStoredRate(
  chargeAmount: number,
  usdCents: number,
  storedRatePerUsd: number,
): boolean {
  return Math.abs(chargeAmount * 100 - usdCents * storedRatePerUsd) * 2 <= usdCents + 200;
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
