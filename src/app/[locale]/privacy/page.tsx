import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrivacyPageContent } from "@/components/marketing/privacy-page-content";
import { isSupportLocale, SUPPORT_LOCALES } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return SUPPORT_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

/** See src/app/[locale]/page.tsx's identical export for why this is required (generateStaticParams alone doesn't force real static output here) rather than left to auto-detection. */
export const dynamic = "force-static";

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
