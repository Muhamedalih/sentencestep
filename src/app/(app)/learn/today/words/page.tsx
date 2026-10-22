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
 * The words step of Today's session ("Today's session (new Home)" permission): five important
 * words — due review words first, new words from the Words section for the rest. Every visit builds
 * a fresh round, so "5 more words" is just another visit. Nothing to do — or the permission
 * closed, or signed out — goes on to the finish screen (or Home) instead of an empty screen.
 */
export default async function TodayWordsPage() {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.todaySession || !user) redirect("/learn");

  const words = await fetchTodayWordsAction(WORDS_PER_ROUND);
  if (words.length === 0) redirect("/learn/today/end");

  return <TodayWordsRunner words={words} defaultVoiceId={await getDefaultPronunciationVoiceId()} />;
}
