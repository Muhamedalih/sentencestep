"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAuthCookie } from "@/lib/supabase/has-session-cookie";
import {
  fetchDueVocabularyRecallCount,
  fetchDueVocabularyRecallRows,
  recordVocabularyReview,
} from "@/lib/supabase/queries/vocabulary-recall";
import { BLANK_TOKEN } from "@/types/word-lists";
import type { ReviewWord } from "@/components/learning/word-review-session";

/** Same fast path as fetchWeakWordsAction — a guest with no session cookie can never produce claims, so skip standing up a client and calling getClaims() at all for that guaranteed-null case. Home renders for every visitor, guests included, so this matters here. */
async function getAuthenticatedUserId(): Promise<string | null> {
  if (!(await hasSupabaseAuthCookie())) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/**
 * Same purpose as fetchActiveMistakeCountAction — cheap, count-only, for
 * VocabularyRecallCard's "show/hide" decision on Home. Guests always get 0.
 *
 * Caught, not thrown: this runs inside Home's own Promise.all alongside
 * everything else the dashboard needs, so a query failure here (e.g. this
 * environment's `vocabulary_encounters` migration not applied yet) must
 * never take the whole Home page down — a missing/broken feature degrades
 * to "card hidden," exactly like "no due words" already does.
 */
export async function fetchVocabularyRecallCountAction(): Promise<number> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return 0;
  try {
    return await fetchDueVocabularyRecallCount(userId);
  } catch (error) {
    console.error("[vocabulary-recall] fetchDueVocabularyRecallCount failed", error);
    return 0;
  }
}

/** `sentence` with its target word blanked back out — same convention Word Lists content is hand-authored in (see BLANK_TOKEN), just derived here instead of pre-written, since a Recall word's sentence is a real lesson/story sentence rather than a purpose-built one. */
function buildBlankSentence(sentenceEn: string, wordIndex: number): string {
  const words = sentenceEn.split(/\s+/);
  if (wordIndex < 0 || wordIndex >= words.length) return sentenceEn;
  words[wordIndex] = BLANK_TOKEN;
  return words.join(" ");
}

/**
 * The due Vocabulary Recall queue, hydrated into the same VocabularyWord
 * shape WordReviewSession already renders for Word Lists — see that
 * component's `variant="recall"`. `lessonTitle`/`daysAgo` ride along on each
 * word so the review screen can show which sentence/how-long-ago context it
 * came from without a second round trip.
 */
export async function fetchVocabularyRecallWordsAction(): Promise<ReviewWord[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];
  // Same "degrade, never throw" reasoning as fetchVocabularyRecallCountAction
  // — this page redirects to /learn on an empty result already, so a query
  // failure reads exactly like "nothing due" instead of a crashed page.
  let rows: Awaited<ReturnType<typeof fetchDueVocabularyRecallRows>>;
  try {
    rows = await fetchDueVocabularyRecallRows(userId);
  } catch (error) {
    console.error("[vocabulary-recall] fetchDueVocabularyRecallRows failed", error);
    return [];
  }

  const now = Date.now();
  return rows.map((row) => {
    const daysAgo = Math.max(1, Math.floor((now - new Date(row.createdAt).getTime()) / 86_400_000));
    return {
      id: `recall-${row.word}`,
      groupId: "recall",
      order: 0,
      targetWord: row.word,
      sentence: buildBlankSentence(row.sentenceEn, row.wordIndex),
      hintAr: row.ar,
      reason: "review",
      lessonTitle: row.lessonTitle,
      daysAgo,
      // Routes PronunciationButton to the real, synthesized isolated-word
      // pipeline (see resolvePronunciationAudioAction) instead of its
      // "word" default, which would look this id up against Word Lists'
      // own vocabulary_words catalog and always miss — silently falling
      // back to the browser's own speech synthesis. "sentence_word" instead
      // re-resolves the word live from row.sentenceId's real sentence.
      pronunciationContentType: "sentence_word",
      pronunciationContentId: `${row.sentenceId}::${row.word}`,
    };
  });
}

/**
 * Advances this word's Recall schedule — called once a learner types it
 * correctly in the Recall review screen (see WordReviewSession's
 * onWordCompleted prop). `hadErrors` is whether they got it wrong at least
 * once first this visit (still required to eventually get it right, same as
 * everywhere else — this only affects how soon it comes back).
 */
export async function markVocabularyRecallCompletedAction(
  word: string,
  hadErrors: boolean,
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save progress.");
  await recordVocabularyReview(word, hadErrors);
  revalidatePath("/learn");
  revalidatePath("/learn/recall");
}
