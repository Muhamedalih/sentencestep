import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TodayReviewRunner } from "@/components/today/today-review-runner";
import { isAdmin } from "@/lib/admin/access";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { hasPremiumAccess } from "@/lib/billing/access";
import { fetchTodayReviewWordsAction } from "@/lib/features/daily-session-actions";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadTodayNextItem } from "@/lib/today/load";
import { REVIEW_CAP, parseSessionLength } from "@/lib/today/plan";

// What is due changes by the minute, and it is per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The review block of Today's session ("Today's session (new Home)" permission). `then` says what
 * the plan on Home put after it: the lesson (opened with ?today=1 so it ends on the recall and the
 * finish screen) or straight the finish screen. Nothing due — or the permission closed, or signed
 * out — skips ahead or goes Home instead of showing an empty screen.
 */
export default async function TodayReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ length?: string; then?: string }>;
}) {
  const params = await searchParams;
  const length = parseSessionLength(params.length);
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.todaySession || !user) redirect("/learn");

  let nextHref = `/learn/today/end?length=${length}`;
  if (params.then === "lesson") {
    const [premium, admin, locale] = await Promise.all([
      hasPremiumAccess(),
      isAdmin(),
      getLocale(),
    ]);
    const { item } = await loadTodayNextItem({
      locale,
      isPremium: premium || admin,
      floor: features.rollouts.levelFloor,
    });
    if (item) nextHref = `/learn/${item.mode}/${item.id}?today=1&length=${length}`;
  }

  const words = await fetchTodayReviewWordsAction(REVIEW_CAP[length]);
  if (words.length === 0) redirect(nextHref);

  return (
    <TodayReviewRunner
      words={words}
      defaultVoiceId={await getDefaultPronunciationVoiceId()}
      nextHref={nextHref}
      length={length}
    />
  );
}
