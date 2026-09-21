import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WordReviewSession } from "@/components/learning/word-review-session";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { isLearningMode } from "@/lib/learning-modes";
import { fetchVocabularyRecallWordsAction } from "@/lib/vocabulary-recall/actions";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";

// Same reasoning as /learn/word-lists/review: this queue is session-derived,
// so this page must never be statically cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vocabulary Recall" };

/**
 * The one entry point into Vocabulary Recall (see VocabularySectionRecallCard,
 * rendered inside each mode's own lesson-list page) — a short review of
 * words met in that section, reusing the exact same fill-in-the-blank
 * interaction Word Lists' own "Review All Words" already delivers (see
 * WordReviewSession's `variant` prop), just sourced from a learner's real
 * lesson/story sentences instead of Word Lists' own catalog.
 *
 * `?mode=normal|stories` scopes the queue to that one section — always
 * present when reached from VocabularySectionRecallCard, but this page still
 * degrades sanely to "every due word" without it (an unscoped `mode`
 * fallback, never a crash) so a bare /learn/recall link keeps working.
 */
export default async function VocabularyRecallPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: modeParam } = await searchParams;
  const mode = modeParam && isLearningMode(modeParam) ? modeParam : undefined;

  const words = await fetchVocabularyRecallWordsAction(mode);
  if (words.length === 0) redirect(mode ? `/learn/${mode}` : "/learn");

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
      backHref={mode ? `/learn/${mode}` : "/learn"}
    />
  );
}
