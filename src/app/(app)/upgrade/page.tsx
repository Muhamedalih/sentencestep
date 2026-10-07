import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutCard } from "@/components/billing/checkout-card";
import { ContentStatsRow } from "@/components/billing/content-stats-row";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { PremiumFaq } from "@/components/billing/premium-faq";
import { Logo } from "@/components/layout/logo";
import { devSetAdmin } from "@/lib/admin/dev-actions";
import { track } from "@/lib/analytics/track";
import { getAccessState } from "@/lib/billing/access";
import { devSetPlan } from "@/lib/billing/dev-actions";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { isOfferActive } from "@/lib/billing/launch-offer";
import { getLaunchOffer } from "@/lib/billing/launch-offer-queries";
import { buildPlanViews, cheapestPerMonth } from "@/lib/billing/plan-views";
import { tierForCountry } from "@/lib/billing/pricing";
import { showUsdOnWaylPage } from "@/lib/billing/provider-registry";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { formatCount } from "@/lib/i18n/format-count";
import { formatLongDate } from "@/lib/i18n/format-date";
import { getLocale } from "@/lib/i18n/get-locale";
import { getContentStats, getSocialProof } from "@/lib/stats/public-stats";
import { getRatingsProof } from "@/lib/stats/ratings-proof";
import { getCurrentUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Upgrade to Premium",
};

// Forced dynamic rather than left to infer from cookies() usage: with no
// Supabase project configured, getCurrentUser()/getAccessState() both
// short-circuit before ever reading a cookie, which would otherwise let
// this page qualify for static generation — and a statically-generated
// page only ever runs its body once, at build time, not per real visitor,
// which would silently break the UPGRADE_VIEWED tracking call below. The
// price shown also depends on the visitor's country (the hosting platform's geolocation), so
// this page must be rendered per request.
export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const [user, access, locale] = await Promise.all([
    getCurrentUser(),
    getAccessState(),
    getLocale(),
  ]);
  const t = locale ? getDictionary(locale) : fallbackDictionary;
  // Not gated on being signed in: the dev override works standalone (no
  // Supabase project required) precisely so free/premium can be exercised
  // in an environment with no account system configured at all.
  const showDevTools = process.env.NODE_ENV !== "production";

  // The price is the one place a visitor ever sees one (always USD). It is
  // resolved here from the hosting platform's own geolocation — the same resolution the
  // checkout action repeats server-side — never from anything the client sends.
  const { country } = resolvePricingCountry(await headers());
  const offer = await getLaunchOffer();
  const offerBonusDays = isOfferActive(offer, new Date()) ? offer.bonusDays : 0;
  const tier = tierForCountry(country);
  const plans = buildPlanViews(tier, offerBonusDays);

  await track({ name: "UPGRADE_VIEWED", category: "PREMIUM", properties: {} }, user?.id ?? null);

  // While the sitewide free-access promotion is on, a signed-out visitor is
  // covered by it like everyone else: they are told everything is open and how
  // to keep their progress, and are never shown a plan or a price. Only a
  // signed-in account excluded from the promotion (to try the paid flow) sees
  // the plans.
  const freeNow = !user && access.isPremium;

  // Only the plan card quotes the launch offer and real figures, so the counts
  // are only fetched (they are cached for an hour) when that card is shown.
  const showsPlans = !freeNow && !(user && access.isPremium);
  const [proof, content] = showsPlans
    ? await Promise.all([getSocialProof(), getContentStats()])
    : [null, null];
  const ratings = showsPlans ? getRatingsProof() : null;
  const offerNotice =
    offer && offerBonusDays > 0
      ? { bonusDays: offerBonusDays, endsOnLabel: formatLongDate(offer.endsOn, locale) }
      : null;
  const socialProof =
    proof || ratings
      ? {
          learners: proof?.learners == null ? null : formatCount(proof.learners, locale),
          lessons: proof?.lessons == null ? null : formatCount(proof.lessons, locale),
          rating: ratings
            ? { average: ratings.average.toFixed(1), count: formatCount(ratings.count, locale) }
            : null,
        }
      : null;
  // Only figures big enough to be worth quoting are present; each is "N+" because it was rounded down.
  const contentItems = [
    { value: content?.lessons, label: t.premium.contentStatLessons },
    { value: content?.words, label: t.premium.contentStatWords },
    { value: content?.wordLists, label: t.premium.contentStatWordLists },
  ].flatMap((item) =>
    item.value == null ? [] : [{ value: `${formatCount(item.value, locale)}+`, label: item.label }],
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16 max-sm:pb-32 sm:py-24">
      <Link
        href={user ? "/learn" : "/"}
        className="inline-flex min-h-11 items-center self-center"
        aria-label={t.marketing.homeLinkAriaLabel}
      >
        <Logo />
      </Link>

      <div className="mx-auto w-full max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {freeNow
            ? t.premium.freeNowHeading
            : user && access.isPremium
              ? t.premium.premiumHeading
              : t.premium.upgradeHeading}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {freeNow
            ? t.premium.freeNowSubtitle
            : user && access.isPremium
              ? t.premium.premiumSubtitle
              : t.premium.upgradeSubtitle}
        </p>
      </div>

      {showsPlans && (
        <ContentStatsRow heading={t.premium.contentStatsHeading} items={contentItems} />
      )}

      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        {/* `user &&`: free_for_all (/admin/free-access) makes isPremium true
            even for a signed-out visitor, who should still see the regular
            sign-in/pricing card below, never the real-subscriber one. */}
        {freeNow ? (
          <Card>
            <CardHeader>
              <Badge variant="success" className="w-fit">
                {t.premium.freeNowBadge}
              </Badge>
              <CardDescription>{t.premium.freeNowBody}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ul className="flex flex-col gap-2.5">
                {t.premium.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm">
                    <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg" className="sm:flex-1">
                  <Link href="/register">{t.nav.createAccount}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="sm:flex-1">
                  <Link href="/login?next=/upgrade">{t.common.signIn}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : user && access.isPremium ? (
          <>
            <Card>
              <CardHeader>
                <Badge className="w-fit">{t.common.premium}</Badge>
                <CardTitle className="text-xl">{t.premium.fullAccessHeading}</CardTitle>
                <CardDescription>
                  {access.expiresAt
                    ? t.premium.thanksWithDate.replace(
                        "{date}",
                        formatLongDate(access.expiresAt, locale),
                      )
                    : t.premium.thanks}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-fit">
                  <Link href="/learn">{t.premium.backToLearning}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Only a real, dated purchase can be extended — the sitewide
                free-for-all promotion and the dev override have no end date. */}
            {access.expiresAt && (
              <CheckoutCard
                plans={plans}
                signedIn
                extend
                offerNotice={offerNotice}
                waylShowsDollars={showUsdOnWaylPage()}
              />
            )}
          </>
        ) : (
          <CheckoutCard
            plans={plans}
            signedIn={Boolean(user)}
            offerNotice={offerNotice}
            socialProof={socialProof}
            fromMonthly={cheapestPerMonth(tier)}
            waylShowsDollars={showUsdOnWaylPage()}
          />
        )}
      </div>

      {!freeNow && (
        <>
          <PlanComparison t={t} />
          <PremiumFaq t={t} />
        </>
      )}

      {showDevTools && (
        <Card className="border-dashed">
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              Development only
            </Badge>
            <CardTitle className="text-base">Simulate a plan</CardTitle>
            <CardDescription>
              Exercises both the free and premium experience before real billing exists — never
              available in a production build.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <form action={devSetPlan.bind(null, "premium")}>
              <Button type="submit" variant="secondary" size="sm">
                Simulate premium
              </Button>
            </form>
            <form action={devSetPlan.bind(null, "free")}>
              <Button type="submit" variant="outline" size="sm">
                Reset to free
              </Button>
            </form>
            <form action={devSetAdmin.bind(null, true)}>
              <Button type="submit" variant="secondary" size="sm">
                Simulate admin
              </Button>
            </form>
            <form action={devSetAdmin.bind(null, false)}>
              <Button type="submit" variant="outline" size="sm">
                Reset admin
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
