import { notFound } from "next/navigation";

import { HomePageContent } from "@/components/marketing/home-page-content";
import { isSupportLocale, SUPPORT_LOCALES } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return SUPPORT_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

/**
 * Explicit, not left to auto-detection: this route calls no dynamic API and
 * SHOULD be statically optimized automatically purely from
 * generateStaticParams + dynamicParams=false, but empirically (verified by
 * inspecting actual `next build` output — .next/server/app/ar never
 * contained a prerendered page.html, and a `next start` smoke test showed
 * `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`
 * with no `x-nextjs-cache`/`x-nextjs-prerender` headers, i.e. a genuinely
 * dynamic per-request render — the build's own "●  (SSG)" route-table label
 * is misleading here) this app's build does not auto-detect it as static
 * once there is no longer a single shared src/app/layout.tsx (see
 * root-html-shell.tsx's doc comment for why; see also
 * src/app/(default)/page.tsx's identical `force-static`, which is what
 * actually makes ITS output land in .next/server/app/index.html). Adding
 * this explicit export is what fixes it: after adding it, /ar, /es, /tr all
 * produce real prerendered HTML with `x-nextjs-cache: HIT` and
 * `Cache-Control: s-maxage=31536000`, matching the unprefixed variant.
 */
export const dynamic = "force-static";

/**
 * "/ar", "/es", "/tr" — statically pre-rendered per locale at build time
 * (see src/app/[locale]/layout.tsx). Reached by a returning visitor whose
 * ss_locale cookie already picked one of these (via src/middleware.ts's
 * redirect) or by explicitly switching languages from the language
 * switcher/first-time picker on any marketing page (see LocaleProvider's
 * `localizedNavigation`).
 */
export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportLocale(locale)) notFound();

  return <HomePageContent locale={locale} />;
}
