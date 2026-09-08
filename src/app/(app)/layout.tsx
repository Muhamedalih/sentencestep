import "@/app/globals.css";

import { RootHtmlShell } from "@/components/layout/root-html-shell";
import { getLocale } from "@/lib/i18n/get-locale";
import { SITE_METADATA, SITE_VIEWPORT } from "@/lib/site-metadata";

export const metadata = SITE_METADATA;
export const viewport = SITE_VIEWPORT;

/**
 * Root layout for every route EXCEPT the three static marketing pages (see
 * src/app/(default)/layout.tsx and src/app/[locale]/layout.tsx) — /login,
 * /register, /forgot-password, /reset-password, /learn/**, /admin/**,
 * /upgrade, /dev/**. Behaviorally identical to what this file did before it
 * moved into the (app) route group: still resolves the visitor's locale
 * from the ss_locale cookie on every single request via getLocale(), which
 * is exactly why every route under this group stays fully dynamic (Next.js
 * forces the whole route dynamic wherever cookies()/headers() is called
 * anywhere in its render tree, including a shared layout) — unchanged from
 * before, on purpose, for all of these routes.
 *
 * This used to be the one and only src/app/layout.tsx, wrapping literally
 * every route in the app. It moved into this route group specifically so
 * / , /privacy, and /terms could get their OWN sibling root layouts that
 * DON'T call getLocale()/cookies() at all — see root-html-shell.tsx's doc
 * comment for the full "multiple root layouts" rationale. Next.js requires
 * <html>/<body> to be defined by whichever layout.tsx has no layout above
 * it, and only one such root layout can serve a given request — so making a
 * cookie-free subset of routes statically cacheable required splitting the
 * single shared root layout into one per route group, this being the one
 * that preserves 100% of the old dynamic, cookie-based behavior.
 */
export default async function AppRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // A single cookie read (no DB query — see get-locale.ts's doc comment).
  // Null means a genuine first-time, cookie-less visitor: the page still
  // renders (English chrome, LTR — exactly what already renders today),
  // FirstTimeLanguagePicker is what actually prompts them.
  const locale = await getLocale();

  return <RootHtmlShell locale={locale}>{children}</RootHtmlShell>;
}
