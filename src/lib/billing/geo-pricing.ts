/**
 * Server-side country resolution for pricing. Only the header the hosting
 * platform itself sets (and overwrites on every request) is trusted: headers
 * such as `x-vercel-ip-country` or `cf-ipcountry` are not set by Netlify, so a
 * client could forge them to get the lower price. profiles.country is never
 * read either — learners write that column themselves.
 */

export type PricingCountrySource = "netlify_geo" | "default";

export interface ResolvedPricingCountry {
  country: string | null;
  source: PricingCountrySource;
}

const NETLIFY_GEO_HEADER = "x-nf-geo";

/** `x-nf-geo` is base64-encoded JSON shaped like `{"country":{"code":"IQ",...},...}`. */
export function parseNetlifyGeoCountry(value: string): string | null {
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64").toString("utf8")) as {
      country?: { code?: unknown };
    } | null;
    const code = decoded?.country?.code;
    if (typeof code !== "string") return null;
    const normalized = code.trim().toLowerCase();
    return /^[a-z]{2}$/.test(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function resolvePricingCountry(headers: {
  get(name: string): string | null;
}): ResolvedPricingCountry {
  const raw = headers.get(NETLIFY_GEO_HEADER);
  const country = raw ? parseNetlifyGeoCountry(raw) : null;
  return country ? { country, source: "netlify_geo" } : { country: null, source: "default" };
}
