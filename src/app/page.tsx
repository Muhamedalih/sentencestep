import { FreeCta } from "@/components/marketing/free-cta";
import { FreeExperience } from "@/components/marketing/free-experience";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ModeSection } from "@/components/marketing/mode-section";
import { PremiumSection } from "@/components/marketing/premium-section";
import { ProgressSection } from "@/components/marketing/progress-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function Home() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const isAuthenticated = Boolean(user);
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero isAuthenticated={isAuthenticated} />
        <HowItWorks t={t} />
        <ModeSection t={t} />
        <ProgressSection t={t} locale={locale} />
        <FreeExperience t={t} />
        <PremiumSection t={t} />
        <FreeCta isAuthenticated={isAuthenticated} t={t} />
      </main>
      <SiteFooter />
    </div>
  );
}
