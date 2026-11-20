import type { MetadataRoute } from "next";

import { SUPPORT_LOCALES } from "@/lib/i18n/locales";
import { PUBLIC_PAGES_INDEXABLE, PUBLIC_PAGES_LOCALE } from "@/lib/public-pages/flag";
import { publicRuleSlugs } from "@/lib/public-pages/rule-page-data";

/**
 * The marketing pages that exist both unprefixed and under every support locale ("/", "/ar",
 * "/ar/privacy", ...): the landing page and the two legal pages, all statically pre-rendered (see
 * src/app/(default)/layout.tsx and src/app/[locale]/layout.tsx). The app itself ("/learn/...",
 * "/upgrade", the auth pages) is left out on purpose: it is not marketing, and the lesson pages are
 * not worth a crawler's first visit until they carry text of their own.
 */
const MARKETING_PATHS = ["", "/privacy", "/terms"] as const;

/** The origin without a trailing slash, so every URL below can be built as `origin + path`. */
function withoutTrailingSlash(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

/** Where the sitemap lives, for robots.txt (a sitemap line must be an absolute URL). */
export function sitemapUrl(siteUrl: string): string {
  return `${withoutTrailingSlash(siteUrl)}/sitemap.xml`;
}

/**
 * One entry per marketing page and language, each carrying the same hreflang set: every support
 * locale, and `x-default` for the unprefixed page (the English-fallback chrome a first-time visitor
 * with no language yet sees). No lastModified, changeFrequency or priority: the pages do not track
 * a modification date and search engines ignore the other two.
 */
export function buildSitemap(
  siteUrl: string,
  publicPagesOpen: boolean = PUBLIC_PAGES_INDEXABLE,
): MetadataRoute.Sitemap {
  const origin = withoutTrailingSlash(siteUrl);
  const marketing = MARKETING_PATHS.flatMap((path) => {
    const unprefixed = `${origin}${path || "/"}`;
    const languages: Record<string, string> = Object.fromEntries(
      SUPPORT_LOCALES.map((locale) => [locale, `${origin}/${locale}${path}`]),
    );
    languages["x-default"] = unprefixed;
    return [unprefixed, ...SUPPORT_LOCALES.map((locale) => `${origin}/${locale}${path}`)].map(
      (url) => ({ url, alternates: { languages } }),
    );
  });
  if (!publicPagesOpen) return marketing;

  // The public pages (src/lib/public-pages/): one language for now, so no hreflang set. Only listed once
  // the switch in flag.ts is on, and only the rules that have an article.
  const base = `${origin}/${PUBLIC_PAGES_LOCALE}`;
  const publicPages = [
    `${base}/about`,
    `${base}/grammar`,
    ...publicRuleSlugs().map((slug) => `${base}/grammar/${slug}`),
  ].map((url) => ({ url }));
  return [...marketing, ...publicPages];
}
