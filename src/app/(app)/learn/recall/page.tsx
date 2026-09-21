import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WordReviewSession } from "@/components/learning/word-review-session";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import {
  fetchVocabularyRecallWordsAction,
  markVocabularyRecallCompletedAction,
} from "@/lib/vocabulary-recall/actions";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";

// Same reasoning as /learn/word-lists/review: this queue is session-derived,
// so this page must never be statically cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vocabulary Recall" };

/**
 * The one entry point into Vocabulary Recall (see VocabularyRecallCard on
 * Home) — a short review of words met in Normal lessons/Stories, reusing the
 * exact same fill-in-the-blank interaction Word Lists' own "Review All
 * Words" already delivers (see WordReviewSession's `variant` prop), just
 * sourced from a learner's real lesson/story sentences instead of Word
 * Lists' own catalog.
 */
export default async function VocabularyRecallPage() {
  const words = await fetchVocabularyRecallWordsAction();
  if (words.length === 0) redirect("/learn");

  const defaultVoiceId = await getDefaultPronunciationVoiceId();
  // Same cache-only pre-resolution as the Word Lists review page.
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
      variant="recall"
      onWordCompleted={(word, hadErrors) =>
        markVocabularyRecallCompletedAction(word.targetWord, hadErrors)
      }
    />
  );
}
