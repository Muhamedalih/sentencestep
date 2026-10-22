import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TodayEnd } from "@/components/today/today-end";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadTodayNext, loadTodayWeekDays } from "@/lib/today/load";

// Per learner and per moment: what is waiting tomorrow is read live.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The finish screen of Today's session: how many of the words were remembered, what comes back
 * tomorrow, the reminder card when that is on, and five more words as the extra. Reached after the
 * words step — or straight from the carry-on route when nothing is left to do.
 */
export default async function TodayEndPage() {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.todaySession || !user) redirect("/learn");

  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const [premium, admin, locale, progress] = await Promise.all([
    hasPremiumAccess(),
    isAdmin(),
    getLocale(),
    fetchProgressCached(todayLocalISODate()),
  ]);
  const [next, weekDays] = await Promise.all([
    loadTodayNext({
      userId: user.id,
      locale,
      isPremium: premium || admin,
      passagesEnabled: features.passages.enabled,
    }),
    loadTodayWeekDays({
      userId: user.id,
      locale,
      timeZone,
      completions: progress?.completions ?? [],
    }),
  ]);

  return (
    <TodayEnd weekDays={weekDays} nextTitle={next.nextTitle} moreWords={next.wordsAvailable} />
  );
}
