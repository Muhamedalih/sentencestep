import type { PaymentAlert } from "@/lib/billing/payments/fulfillment";

import type { EgyptWalletSettings } from "./settings";

/**
 * The dollar rate of the day for Vodafone Cash prices. It is read once a day from a public rate
 * service by the reconcile job, kept in egypt_wallet_settings, and every price in Egyptian pounds is
 * the dollar price at that rate rounded to the nearest whole pound. Nothing here runs per visitor:
 * the pages read the stored number.
 *
 * Safety: a reading outside a sane range, or more than 10 % away from the previous one in a day, is
 * refused (a bad answer from the service must never reprice the shop), and an admin can set the rate by
 * hand, which also stops the automatic update until it is given back.
 */

/** Used only until the first reading has ever been stored. About the market rate of November 2026. */
export const FALLBACK_USD_EGP = 54;

export const RATE_MIN = 20;
export const RATE_MAX = 200;

/** A new reading more than this far from the previous one is refused. */
export const MAX_RATE_CHANGE = 0.1;

/** The job reads again once the stored rate is older than this. */
export const REFRESH_AFTER_MS = 20 * 60 * 60 * 1000;

/** The admins are told when the rate could not be refreshed for this long. */
export const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

const FETCH_TIMEOUT_MS = 8_000;

export interface RateReading {
  rate: number;
  source: string;
}

/** The rate a price should use now, and where it came from. */
export function effectiveRate(
  settings: Pick<EgyptWalletSettings, "usdToEgp" | "rateSource" | "rateUpdatedAt">,
): {
  rate: number;
  source: string;
  updatedAt: string | null;
} {
  if (settings.usdToEgp !== null) {
    return {
      rate: settings.usdToEgp,
      source: settings.rateSource ?? "stored",
      updatedAt: settings.rateUpdatedAt,
    };
  }
  return { rate: FALLBACK_USD_EGP, source: "fallback", updatedAt: null };
}

export function isSaneRate(rate: unknown): rate is number {
  return typeof rate === "number" && Number.isFinite(rate) && rate >= RATE_MIN && rate <= RATE_MAX;
}

/** Four decimals are plenty for a rate; the database column holds exactly that. */
export function roundRate(rate: number): number {
  return Math.round(rate * 10_000) / 10_000;
}

type Json = Record<string, unknown>;

/** open.er-api.com: { result: "success", rates: { EGP: 53.68 } } */
export function parseErApi(body: unknown): number | null {
  const json = body as Json | null;
  if (!json || json.result !== "success") return null;
  const rate = (json.rates as Json | undefined)?.EGP;
  return isSaneRate(rate) ? rate : null;
}

/** currency-api (jsDelivr): { date: "2026-11-17", usd: { egp: 53.68 } } */
export function parseFawazApi(body: unknown): number | null {
  const json = body as Json | null;
  const rate = (json?.usd as Json | undefined)?.egp;
  return isSaneRate(rate) ? rate : null;
}

const SOURCES: ReadonlyArray<{
  name: string;
  url: string;
  parse: (body: unknown) => number | null;
}> = [
  { name: "open.er-api.com", url: "https://open.er-api.com/v6/latest/USD", parse: parseErApi },
  {
    name: "currency-api (jsDelivr)",
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    parse: parseFawazApi,
  },
];

/** Asks the sources one after the other and returns the first sane answer, or null. */
export async function fetchUsdEgp(fetchFn: typeof fetch = fetch): Promise<RateReading | null> {
  for (const source of SOURCES) {
    try {
      const response = await fetchFn(source.url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) continue;
      const rate = source.parse(await response.json());
      if (rate !== null) return { rate: roundRate(rate), source: source.name };
    } catch {
      // Try the next source.
    }
  }
  return null;
}

export type RateCheck = { ok: true } | { ok: false; reason: string };

/** Refuses a reading that is out of range or jumped more than the allowed share since the last one. */
export function checkReading(candidate: number, previous: number | null): RateCheck {
  if (!isSaneRate(candidate))
    return { ok: false, reason: `${candidate} is outside ${RATE_MIN} to ${RATE_MAX}` };
  if (previous !== null && Math.abs(candidate - previous) / previous > MAX_RATE_CHANGE) {
    return {
      ok: false,
      reason: `${candidate} is more than ${MAX_RATE_CHANGE * 100}% away from the previous rate ${previous}`,
    };
  }
  return { ok: true };
}

export interface RateStore {
  getSettings(): Promise<EgyptWalletSettings>;
  saveRate(input: { rate: number; source: string; locked?: boolean }, now: Date): Promise<void>;
}

export type RefreshOutcome = "locked" | "fresh" | "updated" | "unreachable" | "refused";

export interface RefreshDeps {
  store: RateStore;
  now: () => number;
  report: (alert: PaymentAlert) => void | Promise<void>;
  fetchRate?: () => Promise<RateReading | null>;
}

/**
 * Reads the day's rate if the stored one is old enough (or `force`), checks it, and stores it. Meant
 * for the reconcile job (every ten minutes, but it only reaches out about once a day) and for the
 * admin's "Refresh now" button. Never throws for a bad reading: it keeps the previous rate, and tells
 * the admins when the rate has been stale for two days or a reading was refused.
 */
export async function refreshRate(
  deps: RefreshDeps,
  options: { force?: boolean } = {},
): Promise<RefreshOutcome> {
  const settings = await deps.store.getSettings();
  if (settings.rateLocked && !options.force) return "locked";

  const nowMs = deps.now();
  const updatedMs = settings.rateUpdatedAt ? Date.parse(settings.rateUpdatedAt) : null;
  if (!options.force && updatedMs !== null && nowMs - updatedMs < REFRESH_AFTER_MS) return "fresh";

  const reading = await (deps.fetchRate ?? (() => fetchUsdEgp()))();
  if (reading === null) {
    if (updatedMs === null || nowMs - updatedMs > STALE_AFTER_MS) {
      await deps.report({
        code: "egypt_wallet_rate_stale",
        referenceId: "batch",
        detail: `The USD/EGP rate could not be read${updatedMs === null ? " and has never been stored" : `; the stored rate ${settings.usdToEgp} is from ${settings.rateUpdatedAt}`}. Prices use ${effectiveRate(settings).rate} until it can.`,
      });
    }
    return "unreachable";
  }

  const check = checkReading(reading.rate, settings.usdToEgp);
  if (!check.ok) {
    await deps.report({
      code: "egypt_wallet_rate_refused",
      referenceId: "batch",
      detail: `${reading.source} gave ${reading.rate} but ${check.reason}, so it was not used. The stored rate stays ${settings.usdToEgp ?? "unset (the fallback is used)"}.`,
    });
    return "refused";
  }

  await deps.store.saveRate({ rate: reading.rate, source: reading.source }, new Date(nowMs));
  return "updated";
}
