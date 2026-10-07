import { LegalPage } from "./legal-page";
import { PRIVACY, legalHomeHref, legalLanguage } from "./legal-documents";

/**
 * Shared by both marketing root layouts' /privacy pages (see
 * src/app/(default)/privacy/page.tsx and src/app/[locale]/privacy/page.tsx)
 * so their rendered output can never silently drift apart. The text is in
 * Arabic for "/ar/privacy" and in English everywhere else (see
 * legal-documents.ts).
 */
export function PrivacyPageContent({ locale = null }: { locale?: string | null }) {
  const language = legalLanguage(locale);
  return (
    <LegalPage document={PRIVACY[language]} language={language} homeHref={legalHomeHref(locale)} />
  );
}
