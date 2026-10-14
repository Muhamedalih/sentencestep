/**
 * Server-side country resolution for pricing. The country is never taken from
 * anything a client can set: not profiles.country (learners write that column
 * themselves) and not arbitrary request headers (a client could forge
 * `x-vercel-ip-country` or `cf-ipcountry` to get the lower price).
 *
 * Two trusted sources, never both:
 *
 *  - On Netlify the visitor's location reaches server code as
 *    `Netlify.context.geo`, filled in by the platform for each request. Once
 *    that object exists (we are running on Netlify) request headers are
 *    ignored entirely, even when it has no country.
 *  - Behind our own Cloudflare zone (the self-hosted server) the country is the
 *    `cf-ipcountry` header — but only when the request carries the secret
 *    `x-origin-auth` stamp that Cloudflare alone can add (see
 *    src/lib/security/trusted-proxy.ts). A request without that stamp has its
 *    `cf-ipcountry` ignored, so a client can't forge it.
 *
 * The `x-nf-geo` header is only read outside production, so the tiers can be
 * exercised on a developer machine.
 */

import { isViaTrustedProxy } from "@/lib/security/trusted-proxy";

export type PricingCountrySource = "netlify_geo" | "cloudflare_geo" | "default";

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

const CLOUDFLARE_COUNTRY_HEADER = "cf-ipcountry";

/** Cloudflare's own placeholders: "XX" (unknown location) and "T1" (Tor) are not countries, so neither selects a pricing tier. */
const CLOUDFLARE_NON_COUNTRIES = new Set(["xx", "t1"]);

function parseCloudflareCountry(value: string | null): string | null {
  const country = normalizeCountryCode(value);
  return country && !CLOUDFLARE_NON_COUNTRIES.has(country) ? country : null;
}

const DEFAULT_COUNTRY: ResolvedPricingCountry = { country: null, source: "default" };

export function resolvePricingCountry(
  headers: { get(name: string): string | null },
  options: {
    context?: NetlifyContextLike | null;
    allowHeaderFallback?: boolean;
    /** The secret Cloudflare stamps into `x-origin-auth`; defaults to ORIGIN_AUTH_SECRET. */
    originSecret?: string | null;
  } = {},
): ResolvedPricingCountry {
  const context = options.context === undefined ? readNetlifyContext() : options.context;
  const allowHeaderFallback = options.allowHeaderFallback ?? process.env.NODE_ENV !== "production";

  // On Netlify the platform's own geo is the one source; request headers never count.
  if (context) {
    const country = normalizeCountryCode(context.geo?.country?.code);
    return country ? { country, source: "netlify_geo" } : DEFAULT_COUNTRY;
  }

  // Behind our Cloudflare zone: believed only when Cloudflare's secret stamp is present.
  const trustedProxy =
    options.originSecret === undefined
      ? isViaTrustedProxy(headers)
      : isViaTrustedProxy(headers, options.originSecret);
  if (trustedProxy) {
    const country = parseCloudflareCountry(headers.get(CLOUDFLARE_COUNTRY_HEADER));
    return country ? { country, source: "cloudflare_geo" } : DEFAULT_COUNTRY;
  }

  if (allowHeaderFallback) {
    const raw = headers.get(NETLIFY_GEO_HEADER);
    const country = raw ? parseNetlifyGeoCountry(raw) : null;
    if (country) return { country, source: "netlify_geo" };
  }

  return DEFAULT_COUNTRY;
}
