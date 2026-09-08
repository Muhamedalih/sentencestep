import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TermsPageContent } from "@/components/marketing/terms-page-content";
import { isSupportLocale, SUPPORT_LOCALES } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return SUPPORT_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: "Terms",
};

/** "/ar/terms", "/es/terms", "/tr/terms" — see src/app/(default)/terms/page.tsx's unprefixed sibling; identical content (this page has no translated text). */
export default async function LocaleTermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportLocale(locale)) notFound();

  return <TermsPageContent />;
}
