import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TermsPageContent } from "@/components/marketing/terms-page-content";
import { isSupportLocale, SUPPORT_LOCALES } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return SUPPORT_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

/** See src/app/[locale]/page.tsx's identical export for why this is required (generateStaticParams alone doesn't force real static output here) rather than left to auto-detection. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms",
};

/** "/ar/terms", "/es/terms", "/tr/terms" — see src/app/(default)/terms/page.tsx's unprefixed sibling; the text is in Arabic for "/ar" and in English for the other locales. */
export default async function LocaleTermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportLocale(locale)) notFound();

  return <TermsPageContent locale={locale} />;
}
