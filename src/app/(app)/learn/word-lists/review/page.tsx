import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WordReviewSession, type ReviewWord } from "@/components/learning/word-review-session";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchWeakWordsAction } from "@/lib/weak-words/actions";
import { getWordGroupById } from "@/lib/word-lists";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";

// Same reasoning as /learn/word-lists and /learn/word-lists/[groupId]:
// weak words are session-derived, so this page must never be statically
// cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Review All Words · Word Lists" };

/**
 * The one entry point into "review just the words I got wrong" (see
 * WordReviewSession) — reached from the Word Lists dashboard's hero card
 * (see NeedsReviewWords). fetchWeakWordsAction already returns exactly the
 * right {wordId, groupId} pairs; this page's only job is hydrating each one
 * into a full VocabularyWord (sentence, hint, audio) by re-fetching its
 * owning group, since weak-words is deliberately a read-only interpretation
 * of mistake data with no vocabulary content of its own (see that module's
 * doc comment).
 */
export default async function WordListsReviewPage() {
  const locale = await getLocale();
  const weakWords = await fetchWeakWordsAction();
  if (weakWords.length === 0) redirect("/learn/word-lists");

  // One fetch per distinct group, not per word — a learner's weak words
  // routinely cluster into a handful of groups.
  const groupIds = [...new Set(weakWords.map((weak) => weak.groupId))];
  const groups = await Promise.all(groupIds.map((id) => getWordGroupById(id, locale ?? undefined)));
  const groupById = new Map(
    groups.filter((group) => group !== undefined).map((group) => [group.id, group]),
  );

  const words: ReviewWord[] = [];
  for (const weak of weakWords) {
    const group = groupById.get(weak.groupId);
    const match = group?.words.find((word) => word.id === weak.wordId);
    // A weak word whose group/word no longer resolves (RLS made it
    // invisible, or content changed since the mistake was recorded) is
    // silently dropped — same precedent as fetchMistakesAction's identical
    // "unresolvable content just doesn't come back" rule.
    if (!match) continue;
    words.push({ ...match, reason: weak.reason });
  }
  if (words.length === 0) redirect("/learn/word-lists");

  // Shared with Normal lessons & Word Lists, isolated from
  // Stories/Conversation's own default.
  const defaultVoiceId = await getDefaultPronunciationVoiceId();
  // Same cache-only pre-resolution as WordGroupPracticePage.
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

  return <WordReviewSession words={hydratedWords} defaultVoiceId={defaultVoiceId} />;
}
