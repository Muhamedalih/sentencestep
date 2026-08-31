import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { PremiumFaq } from "@/components/billing/premium-faq";
import { Logo } from "@/components/layout/logo";
import { devSetAdmin } from "@/lib/admin/dev-actions";
import { track } from "@/lib/analytics/track";
import { getAccessState } from "@/lib/billing/access";
import { devSetPlan } from "@/lib/billing/dev-actions";
import { formatPrice } from "@/lib/billing/pricing";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Upgrade to Premium",
};

// Forced dynamic rather than left to infer from cookies() usage: with no
// Supabase project configured, getCurrentUser()/getAccessState() both
// short-circuit before ever reading a cookie, which would otherwise let
// this page qualify for static generation — and a statically-generated
// page only ever runs its body once, at build time, not per real visitor,
// which would silently break the UPGRADE_VIEWED tracking call below.
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

  await track({ name: "UPGRADE_VIEWED", category: "PREMIUM", properties: {} }, user?.id ?? null);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16 sm:py-24">
      <Link
        href={user ? "/learn" : "/"}
        className="self-center"
        aria-label={t.marketing.homeLinkAriaLabel}
      >
        <Logo />
      </Link>

      <div className="mx-auto w-full max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {access.isPremium ? t.premium.premiumHeading : t.premium.upgradeHeading}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {access.isPremium ? t.premium.premiumSubtitle : t.premium.upgradeSubtitle}
        </p>
      </div>

      <div className="mx-auto w-full max-w-lg">
        {access.isPremium ? (
          <Card>
            <CardHeader>
              <Badge className="w-fit">{t.common.premium}</Badge>
              <CardTitle className="text-xl">{t.premium.fullAccessHeading}</CardTitle>
              <CardDescription>
                {access.cancelAtPeriodEnd && access.expiresAt
                  ? t.premium.thanksWithDate.replace(
                      "{date}",
                      new Date(access.expiresAt).toLocaleDateString(),
                    )
                  : t.premium.thanks}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/learn">{t.premium.backToLearning}</Link>
              </Button>
              <ManageBillingButton />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-baseline gap-1.5 text-3xl">
                {formatPrice()}
                <span className="text-muted-foreground text-base font-normal">
                  {t.premium.cancelAnytime}
                </span>
              </CardTitle>
              <CardDescription>{t.premium.everythingInFree}</CardDescription>
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

              {user ? (
                <CheckoutButton />
              ) : (
                <Button asChild className="w-full">
                  <Link href="/login?next=/upgrade">{t.premium.signInToUpgrade}</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <PlanComparison t={t} />
      <PremiumFaq t={t} />

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
