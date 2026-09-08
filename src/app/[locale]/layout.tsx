import { notFound } from "next/navigation";

import "@/app/globals.css";

import { RootHtmlShell } from "@/components/layout/root-html-shell";
import { isSupportLocale, SUPPORT_LOCALES } from "@/lib/i18n/locales";
import { SITE_METADATA, SITE_VIEWPORT } from "@/lib/site-metadata";

export const metadata = SITE_METADATA;
export const viewport = SITE_VIEWPORT;

/** One static page per support locale — "/ar", "/es", "/tr" (+ their /privacy, /terms children). */
export function generateStaticParams() {
  return SUPPORT_LOCALES.map((locale) => ({ locale }));
}

/**
 * Any `[locale]` value other than the three above (e.g. a request for
 * "/foobar", which would otherwise match this same dynamic segment) 404s
 * instead of falling through to an on-demand dynamic render — matching
 * exactly what "/foobar" already does today (there's no route for it, so it
 * hits not-found.tsx). Without this, Next's default behavior for a dynamic
 * segment is to render unlisted values dynamically on demand, which would
 * both defeat the point of pre-rendering this route and, worse, silently
 * accept arbitrary path segments as if they were locales.
 */
export const dynamicParams = false;

/**
 * Root layout for the locale-PREFIXED marketing routes: "/ar", "/es",
 * "/tr" (+ their /privacy, /terms children) — see src/app/(default)/layout.tsx
 * for the unprefixed sibling and src/middleware.ts's marketing-locale
 * redirect for how a returning visitor with a ss_locale cookie ends up
 * here instead of "/". `locale` comes straight from the static route param
 * (resolved at build time via generateStaticParams above), never a cookie
 * read — that's what lets Next.js pre-render one fully static HTML file per
 * locale instead of resolving it per request.
 *
 * See src/components/layout/root-html-shell.tsx's doc comment for why
 * there are now three sibling root layouts instead of one shared
 * src/app/layout.tsx.
 */
export default async function LocaleMarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportLocale(locale)) notFound();

  return (
    <RootHtmlShell locale={locale} localizedNavigation>
      {children}
    </RootHtmlShell>
  );
}
