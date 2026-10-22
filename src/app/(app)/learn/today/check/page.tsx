import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SentenceReviewRunner } from "@/components/sentence-bank/sentence-review-runner";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { loadWeeklyCheckScreen } from "@/lib/sentence-bank/weekly-load";
import type { WeeklyCheckScreen } from "@/lib/sentence-bank/weekly-load";
import { getCurrentUser } from "@/lib/supabase/auth";

// Per learner and per moment.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The weekly sentence check ("Sentence bank" permission): ten sentences from the learner's week,
 * each asked from its meaning with nothing in front of them and no help, and one honest result. Nothing
 * to ask (fewer than five sentences, the permission closed, signed out, or the table not created
 * yet) goes back to Home instead of an empty screen. Like the daily review it never checks
 * whether the subscription is active: what they typed stays theirs.
 */
export default async function TodayCheckPage() {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.sentenceBank || !user) redirect("/learn");

  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const [locale, progress] = await Promise.all([getLocale(), fetchProgressCached(todayISO)]);

  let screen: WeeklyCheckScreen = { items: [], written: 0 };
  try {
    screen = await loadWeeklyCheckScreen({
      userId: user.id,
      todayISO,
      timeZone,
      locale,
      completions: progress?.completions ?? [],
    });
  } catch (error) {
    console.error("[sentence-bank] the weekly check could not be built", error);
  }
  if (screen.items.length === 0) redirect("/learn");

  return (
    <SentenceReviewRunner
      mode="check"
      items={screen.items}
      todayISO={todayISO}
      afterHref="/learn"
      written={screen.written}
    />
  );
}
