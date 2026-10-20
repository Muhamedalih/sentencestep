import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { isViaTrustedProxy } from "@/lib/security/trusted-proxy";

import { cleanPlaceName } from "./visits";

export interface VisitPlace {
  country: string | null;
  region: string | null;
  city: string | null;
}

/**
 * Where the request came from, as far as the proxy in front of the server says.
 * The country follows the same trust rules as pricing (see geo-pricing.ts); the
 * region and city are Cloudflare's visitor-location headers, believed only when
 * the request carries the proxy's secret stamp, and simply absent until that
 * Cloudflare option is on.
 *
 * Server-only on purpose (it needs node:crypto through the trusted-proxy check):
 * visits.ts, which the browser code imports, must stay free of it.
 */
export function placeFromHeaders(headers: { get(name: string): string | null }): VisitPlace {
  const { country } = resolvePricingCountry(headers);
  if (!isViaTrustedProxy(headers)) return { country, region: null, city: null };
  return {
    country,
    region: cleanPlaceName(headers.get("cf-region")),
    city: cleanPlaceName(headers.get("cf-ipcity")),
  };
}
