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

/**
 * Runs this route on Netlify's Edge Functions (V8 isolates, near-zero cold
 * start) instead of the default Node.js serverless Functions (real,
 * measured cold starts of 1-3s+) — this is the highest-traffic page in the
 * app and, unlike the rest of the site, has no route-specific dependency on
 * anything Node-only (confirmed: getCurrentUser/getLocale/getDictionary
 * only ever touch @supabase/ssr and next/headers, both already proven
 * edge-compatible by src/middleware.ts, which runs on this same runtime
 * today). Everything about this page's behavior — the auth check, the CSP
 * nonce, cookie reads — stays identical; only the infrastructure tier
 * executing it changes.
 */
export const runtime = "edge";

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
