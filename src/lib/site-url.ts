/**
 * The one place this app's absolute production origin is defined. No real
 * domain has been chosen yet for this project (see src/app/robots.ts's own
 * doc comment) — everything that needs an absolute URL before that happens
 * (metadataBase, an email link with no request Origin header to fall back
 * on) reads from here rather than hardcoding a placeholder host of its own,
 * so picking the real domain later is a one-line env var change instead of
 * a hunt through the codebase. `.example` is the IANA/RFC 2606 reserved TLD
 * for exactly this "not a real, resolvable address" case — safer than a
 * plausible-looking but unregistered domain, which risks pointing at
 * whatever a third party eventually squats on it.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://sentencestep.example";
}
