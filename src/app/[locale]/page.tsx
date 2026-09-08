import { notFound } from "next/navigation";

import { HomePageContent } from "@/components/marketing/home-page-content";
import { isSupportLocale, SUPPORT_LOCALES } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return SUPPORT_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

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
