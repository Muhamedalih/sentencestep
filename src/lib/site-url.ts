/**
 * The one place this app's absolute production origin is defined.
 * Everything that needs an absolute URL when there's no request Origin
 * header to fall back on (metadataBase, milestone/reminder emails triggered
 * outside a browser request) reads from here rather than hardcoding a host
 * of its own. Set NEXT_PUBLIC_SITE_URL in the hosting environment (Netlify)
 * to the real domain — the `.example` fallback (the IANA/RFC 2606 reserved
 * TLD for "not a real, resolvable address") only matters if that env var is
 * ever missing, so it should never actually resolve in production.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://sentencestep.com";
}
