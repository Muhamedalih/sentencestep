import { getSiteUrl } from "@/lib/site-url";

/**
 * An origin that is safe to put in a link we e-mail or hand to the sign-in provider.
 *
 * The browser's `Origin` header (or the Host the request was sent to) is only trustworthy when
 * the request really came from one of our own pages. A forged value would otherwise become the
 * link inside a password-reset or confirmation e-mail sent to a real person, which is how a reset
 * link gets pointed at an attacker's site. So a candidate is used only when its host is this
 * site's own (the configured site address, its `www.` form, or any subdomain of it, such as the
 * staging copy) or the visitor's own machine; anything else is replaced by the configured address.
 */
function siteHost(): string | null {
  try {
    return new URL(getSiteUrl()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLoopback(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
}

/** A development machine reached over the local network (a phone testing against the dev server). Never trusted in production. */
function isLocalNetworkHost(host: string): boolean {
  return (
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}(\.\d{1,3})?$/.test(host) ||
    host.endsWith(".local")
  );
}

export function isTrustedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (isLoopback(host)) return true;
  if (process.env.NODE_ENV !== "production" && isLocalNetworkHost(host)) return true;

  const own = siteHost();
  if (!own) return false;
  const apex = own.startsWith("www.") ? own.slice(4) : own;
  return host === apex || host.endsWith(`.${apex}`);
}

export function trustedOrigin(candidate: string | null | undefined): string {
  const fallback = getSiteUrl();
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return fallback;
    if (url.username !== "" || url.password !== "") return fallback;
    return isTrustedHost(url.hostname) ? url.origin : fallback;
  } catch {
    return fallback;
  }
}
