/**
 * Server-side country resolution for pricing. The country is never taken from
 * anything a client can set: not profiles.country (learners write that column
 * themselves) and not arbitrary request headers (a client could forge
 * `x-vercel-ip-country` or `cf-ipcountry` to get the lower price).
 *
 * On Netlify the visitor's location reaches server code as
 * `Netlify.context.geo`, filled in by the platform for each request, so that
 * is the one trusted source. Once that object exists (we are running on
 * Netlify) request headers are ignored entirely, even when it has no country.
 * The `x-nf-geo` header is only read outside production, so the tiers can be
 * exercised on a developer machine.
 */

export type PricingCountrySource = "netlify_geo" | "default";

export interface ResolvedPricingCountry {
  country: string | null;
  source: PricingCountrySource;
}

export interface NetlifyContextLike {
  geo?: { country?: { code?: unknown } | null } | null;
}

const NETLIFY_GEO_HEADER = "x-nf-geo";

function readNetlifyContext(): NetlifyContextLike | null {
  try {
    const netlify = (globalThis as { Netlify?: { context?: NetlifyContextLike | null } }).Netlify;
    return netlify?.context ?? null;
  } catch {
    return null;
  }
}

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-z]{2}$/.test(normalized) ? normalized : null;
}

/** Development-only: base64-encoded JSON shaped like `{"country":{"code":"IQ",...},...}`. */
export function parseNetlifyGeoCountry(value: string): string | null {
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64").toString("utf8")) as {
      country?: { code?: unknown };
    } | null;
    return normalizeCountryCode(decoded?.country?.code);
  } catch {
    return null;
  }
}

export function resolvePricingCountry(
  headers: { get(name: string): string | null },
  options: { context?: NetlifyContextLike | null; allowHeaderFallback?: boolean } = {},
): ResolvedPricingCountry {
  const context = options.context === undefined ? readNetlifyContext() : options.context;
  const allowHeaderFallback = options.allowHeaderFallback ?? process.env.NODE_ENV !== "production";

  let country: string | null = null;
  if (context) {
    country = normalizeCountryCode(context.geo?.country?.code);
  } else if (allowHeaderFallback) {
    const raw = headers.get(NETLIFY_GEO_HEADER);
    country = raw ? parseNetlifyGeoCountry(raw) : null;
  }

  return country ? { country, source: "netlify_geo" } : { country: null, source: "default" };
}
