import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SentenceReviewRunner } from "@/components/sentence-bank/sentence-review-runner";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchDailyQuests } from "@/lib/features/quest-queries";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { loadSentenceReviewScreen } from "@/lib/sentence-bank/load";
import { getCurrentUser } from "@/lib/supabase/auth";
import { sentenceQuest } from "@/lib/today/quests";

// What is due changes with every answer, and it is per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The sentence review ("Sentence bank" permission): a few sentences the learner typed on earlier
 * days come back with their text hidden. Reached from the fourth row of Today's tasks, or — with
 * `flow=1` — from the words step, and then on to the finish screen. Nothing to ask (or the
 * permission closed, or signed out, or the table not created yet) goes straight on instead of
 * showing an empty screen. It never checks whether the learner's subscription is active: what
 * they typed stays theirs to review.
 */
export default async function TodaySentencesPage({
  searchParams,
}: {
  searchParams: Promise<{ flow?: string }>;
}) {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.sentenceBank || !user) redirect("/learn");

  const { flow } = await searchParams;
  const afterHref = flow === "1" ? "/learn/today/end" : "/learn";

  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const [locale, progress, quests] = await Promise.all([
    getLocale(),
    fetchProgressCached(todayISO),
    fetchDailyQuests(user.id, todayISO).catch(() => []),
  ]);
  // How many the day's row still wants: the weekly check's answers never use up the day's batch.
  const row = sentenceQuest(quests);

  let items: Awaited<ReturnType<typeof loadSentenceReviewScreen>> = [];
  try {
    items = await loadSentenceReviewScreen({
      userId: user.id,
      todayISO,
      timeZone,
      locale,
      completions: progress?.completions ?? [],
      quest: row ? { target: row.target, progress: row.progress } : undefined,
    });
  } catch (error) {
    console.error("[sentence-bank] the review could not be built", error);
  }
  if (items.length === 0) redirect(afterHref);

  return <SentenceReviewRunner items={items} todayISO={todayISO} afterHref={afterHref} />;
}
