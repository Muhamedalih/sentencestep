import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WordReviewSession } from "@/components/learning/word-review-session";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { fetchDailySessionWordsAction } from "@/lib/features/daily-session-actions";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";

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

  const defaultVoiceId = await getDefaultPronunciationVoiceId();
  // Same cache-only pre-resolution of the first word as the other review pages.
  const firstWord = words[0];
  const hydratedWords =
    firstWord && !firstWord.audioUrl && defaultVoiceId
      ? [
          {
            ...firstWord,
            audioUrl: await lookupCachedAudioUrl(firstWord.targetWord, defaultVoiceId),
          },
          ...words.slice(1),
        ]
      : words;

  return (
    <WordReviewSession
      words={hydratedWords}
      defaultVoiceId={defaultVoiceId}
      variant="session"
      backHref="/learn"
    />
  );
}
