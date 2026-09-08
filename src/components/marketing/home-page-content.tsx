import { FreeCta } from "@/components/marketing/free-cta";
import { FreeExperience } from "@/components/marketing/free-experience";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ModeSection } from "@/components/marketing/mode-section";
import { PremiumSection } from "@/components/marketing/premium-section";
import { ProgressSection } from "@/components/marketing/progress-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The actual homepage markup, shared by both marketing root layouts (see
 * src/app/(default)/page.tsx for the unprefixed "/" variant and
 * src/app/[locale]/page.tsx for the "/ar", "/es", "/tr" variants) so their
 * rendered output can never silently drift apart — the only difference
 * between the two call sites is which `locale` they already know
 * (null vs. a static route param), never a cookie read.
 *
 * `isAuthenticated` is hardcoded false rather than taken from
 * getCurrentUser(): src/middleware.ts's handleRootRoute already redirects
 * every authenticated visitor away from "/" to "/learn" before this
 * component ever renders (and the locale-prefixed variants below inherit
 * the exact same middleware redirect — see reconcileRootMarketingRoute), so
 * an authenticated visitor provably never reaches this component in the
 * first place. Calling getCurrentUser() here anyway would read the Supabase
 * session cookie and force this whole page dynamic again, defeating the
 * point of making it static.
 */
export function HomePageContent({ locale }: { locale: SupportLocale | null }) {
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero isAuthenticated={false} />
        <HowItWorks t={t} />
        <ModeSection t={t} />
        <ProgressSection t={t} locale={locale} />
        <FreeExperience t={t} />
        <PremiumSection t={t} />
        <FreeCta isAuthenticated={false} t={t} />
      </main>
      <SiteFooter />
    </div>
  );
}
