import { getSiteUrl } from "@/lib/site-url";

/**
 * The public origin a request was sent to — `https://sentencestep.com`, not the
 * address the Next.js server happens to listen on.
 *
 * In a Route Handler, `new URL(request.url).origin` is built from the server's own
 * bind address. Behind Caddy and Cloudflare that is `0.0.0.0:3000`, so a redirect
 * built from it sent a learner who had just signed in with Google to
 * `https://0.0.0.0:3000/learn` ("This site can't be reached"). The host the visitor
 * actually used reaches the server in `x-forwarded-host` / `host` and the scheme in
 * `x-forwarded-proto`; Caddy only answers for this site's own hostnames and sets
 * both itself, so neither can be steered from outside.
 */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = firstValue(request.headers.get("x-forwarded-host")) ?? request.headers.get("host");

  if (host && !isBindAddress(host)) {
    const forwardedProto = firstValue(request.headers.get("x-forwarded-proto"));
    const proto =
      forwardedProto === "http" || forwardedProto === "https"
        ? forwardedProto
        : url.protocol.replace(":", "");
    try {
      return new URL(`${proto}://${host}`).origin;
    } catch {
      // A malformed host header: fall through to the fixed site origin below.
    }
  }

  return isBindAddress(url.host) ? getSiteUrl() : url.origin;
}

/** The first value of a comma-separated forwarding header (each proxy in the chain appends one). */
function firstValue(header: string | null): string | null {
  const first = header?.split(",")[0]?.trim();
  return first ? first : null;
}

/** `0.0.0.0` / `::` — where a server listens, never an address a browser can open. */
function isBindAddress(host: string): boolean {
  const name = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return name === "0.0.0.0" || name === "::";
}
