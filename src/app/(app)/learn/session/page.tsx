import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WordReviewSession } from "@/components/learning/word-review-session";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { fetchDailySessionWordsAction } from "@/lib/features/daily-session-actions";

// The session is per-learner and time-dependent (what's due right now).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * Today's session (admin feature "Daily session"): one short run through
 * everything due for review — mistakes, weak words, and whichever other
 * sources the admin has switched on — reusing the fill-in-the-blank review
 * screen (`variant="session"`). Nothing due (or the feature off / signed out)
 * sends the learner back to Home instead of an empty screen.
 */
export default async function DailySessionPage() {
  const words = await fetchDailySessionWordsAction();
  if (words.length === 0) redirect("/learn");

  // Every word already carries its Word Lists-voice clip (resolved server-side
  // in buildDailySessionWords); the voice id is only what the review screen
  // resolves any late stragglers against — never the browser's own voice.
  const defaultVoiceId = await getDefaultPronunciationVoiceId();

  return (
    <WordReviewSession
      words={words}
      defaultVoiceId={defaultVoiceId}
      variant="session"
      backHref="/learn"
    />
  );
}
