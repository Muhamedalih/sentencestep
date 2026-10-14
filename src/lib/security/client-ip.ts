import { isViaTrustedProxy } from "@/lib/security/trusted-proxy";

/**
 * The visitor's IP address, as best the server can know it, for soft abuse limits
 * (never for access control).
 *
 * Behind our Cloudflare zone every request reaches the server from a Cloudflare
 * address, and Cloudflare puts the real visitor in `cf-connecting-ip` — believed
 * only when the request carries the proxy's secret stamp (see trusted-proxy.ts).
 * Otherwise (Netlify, or any request that did not come through the proxy) the
 * first `x-forwarded-for` entry is used, as before. "unknown" when neither exists.
 */
export function clientIpFrom(headers: { get(name: string): string | null }): string {
  if (isViaTrustedProxy(headers)) {
    const connecting = headers.get("cf-connecting-ip")?.trim();
    if (connecting) return connecting;
  }
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
