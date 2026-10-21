import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TodayEnd } from "@/components/today/today-end";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadTodayNextItem } from "@/lib/today/load";
import { parseSessionLength } from "@/lib/today/plan";

// Per learner and per moment: what is waiting tomorrow is read live.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The finish screen of a Today session that had no lesson in it (a short or review-only day): what
 * was remembered in the review, what comes back tomorrow, the reminder card when that is on, and
 * the next lesson as an extra. A session that ends on a lesson finishes inside the lesson page
 * instead (see SessionEndFlow), so this route only serves the review-only ones.
 */
export default async function TodayEndPage({
  searchParams,
}: {
  searchParams: Promise<{ length?: string }>;
}) {
  const length = parseSessionLength((await searchParams).length);
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.todaySession || !user) redirect("/learn");

  const [premium, admin, locale, progress] = await Promise.all([
    hasPremiumAccess(),
    isAdmin(),
    getLocale(),
    fetchProgressCached(todayLocalISODate()),
  ]);
  const { locked } = await loadTodayNextItem({
    locale,
    isPremium: premium || admin,
    floor: features.rollouts.levelFloor,
  });

  return (
    <TodayEnd
      length={length}
      completions={progress?.completions ?? []}
      startingLevel={progress?.startingLevel ?? null}
      lockedNext={locked ? { id: locked.id, mode: locked.mode } : null}
    />
  );
}
