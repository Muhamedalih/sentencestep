/**
 * The one place the premium price lives. Prices are defined and shown in USD
 * only; the provider's settlement currency (Wayl accepts IQD only) is derived
 * from them with a fixed rate immediately before a payment is created.
 */

export type PricingTier = "A" | "B";

export const PREMIUM_DAYS = 30;

export const TIER_PRICE_USD_CENTS: Readonly<Record<PricingTier, number>> = {
  A: 200,
  B: 300,
};

/**
 * Fixed on purpose: never fetched from an exchange-rate API. Changing a rate
 * is a deliberate code change, and every order snapshots the rate it used.
 */
const FIXED_FX_RATES_PER_USD: ReadonlyMap<string, number> = new Map([["IQD", 1320]]);

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
  usdCents: number;
  currency: string;
  fxRatePerUsd: number;
  /** Whole units of `currency`. */
  amount: number;
  premiumDays: number;
}

export function quotePrice(tier: PricingTier, currency: string): PriceQuote {
  const fxRatePerUsd = FIXED_FX_RATES_PER_USD.get(currency);
  if (fxRatePerUsd === undefined) {
    throw new Error(`No fixed exchange rate is configured for ${currency}.`);
  }

  const usdCents = TIER_PRICE_USD_CENTS[tier];
  const amount = (usdCents * fxRatePerUsd) / 100;
  if (!Number.isInteger(amount)) {
    throw new Error(
      `${usdCents} USD cents at ${fxRatePerUsd} ${currency}/USD is not a whole amount.`,
    );
  }

  return { tier, usdCents, currency, fxRatePerUsd, amount, premiumDays: PREMIUM_DAYS };
}

/** "$2" for whole dollars, "$2.50" otherwise. */
export function formatUsd(usdCents: number): string {
  const dollars = usdCents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
