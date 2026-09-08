import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrivacyPageContent } from "@/components/marketing/privacy-page-content";
import { isSupportLocale, SUPPORT_LOCALES } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return SUPPORT_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: "Privacy",
};

/** "/ar/privacy", "/es/privacy", "/tr/privacy" — see src/app/(default)/privacy/page.tsx's unprefixed sibling; identical content (this page has no translated text). */
export default async function LocalePrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportLocale(locale)) notFound();

  return <PrivacyPageContent />;
}
