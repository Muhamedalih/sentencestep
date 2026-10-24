import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TodayWordsRunner } from "@/components/today/today-words-runner";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { fetchTodayWordsAction } from "@/lib/features/daily-session-actions";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { WORDS_PER_ROUND } from "@/lib/today/plan";

// What is due changes by the minute, and it is per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The words step of Today's session ("Today's session (new Home)" permission): five words — the
 * target words of today's story and today's passage and nothing else, whether the two are read yet
 * or not. "5 more words" is a further round of the day's words the first round left. Nothing to do
 * — or the permission closed, or signed out — goes on to the finish screen (or Home) instead of an
 * empty screen.
 */
export default async function TodayWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ more?: string }>;
}) {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.todaySession || !user) redirect("/learn");

  // "5 more words" (`?more=1`) is a further round: only the day's words that the first round left.
  const { more } = await searchParams;
  const words = await fetchTodayWordsAction(WORDS_PER_ROUND, more === "1");
  if (words.length === 0) redirect("/learn/today/end");

  return <TodayWordsRunner words={words} defaultVoiceId={await getDefaultPronunciationVoiceId()} />;
}
