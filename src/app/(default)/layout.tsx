import "@/app/globals.css";

import { RootHtmlShell } from "@/components/layout/root-html-shell";
import { SITE_METADATA, SITE_VIEWPORT } from "@/lib/site-metadata";

export const metadata = SITE_METADATA;
export const viewport = SITE_VIEWPORT;

/**
 * Root layout for the UNPREFIXED marketing routes: "/", "/privacy",
 * "/terms" — the exact URLs today's visitors already have bookmarked/linked
 * everywhere, kept working forever (see src/app/[locale]/layout.tsx for the
 * "/ar", "/es", "/tr" siblings, and src/middleware.ts's marketing-locale
 * redirect for how a RETURNING visitor with a cookie ends up on those
 * instead). Deliberately calls NO dynamic API (no cookies(), no headers(),
 * no params) — this is precisely what lets Next.js fully statically
 * pre-render this tree at build time instead of the 1.4-5s-TTFB dynamic SSR
 * every route on this app pays today (see this task's own background for
 * the measured numbers).
 *
 * `locale={null}` always — the exact same English-fallback chrome a
 * cookie-less, first-time visitor already sees today (see getLocale()'s own
 * doc comment: null means "no choice made yet"). A visitor who HAS already
 * chosen a language never even reaches this layout in the first place:
 * src/middleware.ts redirects them straight to the matching "/{locale}"
 * static variant before this route renders at all.
 *
 * See src/components/layout/root-html-shell.tsx's doc comment for why
 * there are now three sibling root layouts instead of one shared
 * src/app/layout.tsx, and src/app/(app)/layout.tsx for the one that kept
 * 100% of the old cookie-based, fully-dynamic behavior for every other
 * route in the app.
 */
export default function DefaultMarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RootHtmlShell locale={null} localizedNavigation>
      {children}
    </RootHtmlShell>
  );
}
