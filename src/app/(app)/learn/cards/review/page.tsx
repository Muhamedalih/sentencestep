import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WordReviewSession } from "@/components/learning/word-review-session";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { fetchCardReviewWordsAction } from "@/lib/cards/actions";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";

// The queue is per-learner and time-dependent (what's due now).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Cards" };

/**
 * Reviews the learner's saved word cards with the same fill-in-the-blank
 * screen Vocabulary Recall uses (`variant="cards"`): the sentence the word
 * was met in with the word blanked out, its meaning as the hint. `?scope=all`
 * practices every card; the default is just the ones due.
 */
export default async function CardsReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope } = await searchParams;
  const words = await fetchCardReviewWordsAction(scope === "all" ? "all" : "due");
  if (words.length === 0) redirect("/learn/cards");

  const defaultVoiceId = await getDefaultPronunciationVoiceId();
  // Same cache-only pre-resolution of the first word as Vocabulary Recall.
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
      variant="cards"
      backHref="/learn/cards"
    />
  );
}
