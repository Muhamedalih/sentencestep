import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BadgeShelf } from "@/components/app/badge-shelf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBadgeShelf } from "@/lib/features/badge-display";
import { fetchBadgeMetrics, fetchEarnedBadges, markBadgesSeen } from "@/lib/features/badge-queries";
import { evaluateAndAwardBadges } from "@/lib/features/badge-service";
import { EMPTY_BADGE_METRICS } from "@/lib/features/badges";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { dirFor } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/supabase/auth";

// A learner's badges must never come from a stale cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Achievements" };

/**
 * The Achievements shelf (admin feature "Badges & achievements"): every
 * badge with its earned date or how close the learner is. Opening it also
 * runs the badge evaluation, which is what makes the feature retroactive —
 * history that predates the feature is awarded the first time it's opened.
 */
export default async function AchievementsPage() {
  const [user, locale, features] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getEffectiveFeatures(),
  ]);
  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const dir = locale ? dirFor(locale) : "ltr";

  if (!user) {
    // Only a visitor the feature is actually switched on for gets the sign-in
    // prompt; with the feature off there is no such page to offer.
    if (!features.guestTeaser) redirect("/learn");
    return (
      <div className="mx-auto max-w-lg px-6 py-16 sm:py-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t.badges.signInHeading}</CardTitle>
            <CardDescription>{t.badges.signInBody}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login?next=/learn/achievements">{t.common.signIn}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!features.badges.enabled) redirect("/learn");

  // Award first (retroactively), then read, so a badge earned by this very
  // visit is on the shelf already.
  await evaluateAndAwardBadges(user.id, features);
  const [metrics, earned] = await Promise.all([
    fetchBadgeMetrics().catch(() => EMPTY_BADGE_METRICS),
    fetchEarnedBadges(user.id).catch(() => []),
  ]);
  const shelf = buildBadgeShelf(metrics, earned, new Set(features.badges.disabled));
  const earnedCount = shelf.filter((item) => item.earned).length;
  // The "New" markers below are computed from this read; clear them for next time.
  if (shelf.some((item) => item.isNew)) await markBadgesSeen().catch(() => undefined);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight" dir={dir}>
        {t.badges.heading}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-2xl" dir={dir}>
        {t.badges.subtitle}
      </p>
      <p className="mt-4 text-sm font-medium" dir={dir}>
        {t.badges.earnedCount
          .replace("{earned}", String(earnedCount))
          .replace("{total}", String(shelf.length))}
      </p>

      {shelf.length === 0 ? (
        <p className="text-muted-foreground mt-8" dir={dir}>
          {t.badges.emptyState}
        </p>
      ) : (
        <div className="mt-6">
          <BadgeShelf shelf={shelf} t={t} locale={locale} />
        </div>
      )}
    </div>
  );
}
