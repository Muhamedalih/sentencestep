import { LegalPage } from "./legal-page";
import { TERMS, legalLanguage } from "./legal-documents";

/**
 * Shared by both marketing root layouts' /terms pages (see
 * src/app/(default)/terms/page.tsx and src/app/[locale]/terms/page.tsx) so
 * their rendered output can never silently drift apart. The text is in
 * Arabic for "/ar/terms" and in English everywhere else (see
 * legal-documents.ts); SiteHeader/SiteFooter read the locale from the
 * LocaleProvider context themselves.
 */
export function TermsPageContent({ locale = null }: { locale?: string | null }) {
  const language = legalLanguage(locale);
  return <LegalPage document={TERMS[language]} language={language} />;
}
