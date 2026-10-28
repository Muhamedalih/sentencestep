import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PathView } from "@/components/path/path-view";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getHomeLessons, getLevelNames } from "@/lib/content";
import { withOpeningLessonPlacement } from "@/lib/content-helpers";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";

export const metadata: Metadata = { title: "Daily lessons" };

/**
 * Reads live content and the viewer's own plan on every request, like the lesson list pages.
 */
export const dynamic = "force-dynamic";

/**
 * The Path (permission mobilePath): the daily lessons of each level in their order, so a learner
 * sees where they stand and what comes next. Only open to the people the permission is open to;
 * everyone else is sent back to Home.
 */
export default async function LearnPathPage() {
  const features = await getEffectiveFeatures();
  if (!features.rollouts.mobilePath) redirect("/learn");

  const locale = await getLocale();
  const [{ units, lessonStats }, levelNames, hasPremium, admin] = await Promise.all([
    getHomeLessons(locale ?? undefined),
    getLevelNames("normal", locale ?? undefined),
    hasPremiumAccess(),
    isAdmin(),
  ]);

  return (
    <PathView
      units={withOpeningLessonPlacement(units)}
      lessonStats={lessonStats}
      levelNames={levelNames}
      isPremiumUser={hasPremium || admin}
    />
  );
}
