"use server";

import { revalidatePath } from "next/cache";

import { getAllLessons } from "@/lib/content";
import { getDefaultNormalLessonVoiceId } from "@/lib/admin/voices-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import {
  getContentTranslations,
  resolveScalarField,
  resolveWordArrayField,
  warnIfMissing,
} from "@/lib/i18n/content-translations";
import { isMistakeWorthTracking, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { buildWordOrderIndex } from "@/lib/mistakes/ordering";
import type { MistakeQueueItem } from "@/lib/mistakes/types";
import {
  fetchActiveMistakeCount,
  fetchActiveMistakeRows,
  fetchDueReviewCount,
  fetchDueReviewRows,
  fetchLessonsByIds,
  fetchSentencesByIds,
  markMistakeCorrected,
  recordMistake,
  recordMistakeReview,
} from "@/lib/supabase/queries/mistakes";
import { createClient } from "@/lib/supabase/server";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";
import { tokenize } from "@/lib/typing";

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/** The count LessonCompletion needs to decide whether "Fix Your Mistakes" is the primary action — cheap on purpose (two `count(*)` reads), never the full hydrated queue. Includes due reviews as well as outstanding mistakes, since Fix Your Mistakes is the only entry point into either. Guests (no persistent identity for this feature — see the final report) always get 0, matching "no outstanding mistakes" and leaving their completion screen exactly as it always was. */
export async function fetchActiveMistakeCountAction(): Promise<number> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return 0;
  const [activeCount, dueReviewCount] = await Promise.all([
    fetchActiveMistakeCount(userId),
    fetchDueReviewCount(userId),
  ]);
  return activeCount + dueReviewCount;
}

/**
 * Called once per completed sentence (see TypingSentence's onSentenceMistakes
 * — batched there across that sentence's own words, never per keystroke or
 * per error). `words` are raw tokens as typed against; normalized and
 * de-duplicated here before writing. Each unique word becomes exactly one
 * record_mistake() call — see that function's migration doc comment for why
 * the actual upsert has to be a real SQL statement, not a client-side
 * read-then-write.
 */
export async function recordSentenceMistakesAction(
  sentenceId: string,
  words: { word: string; errorIndexes: number[] }[],
): Promise<{ activeCount: number }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save progress.");

  // Deduplicated by normalized identity, merging every reported errorIndex
  // per word — mirrors TypingSentence's own per-attempt Map, which already
  // only ever reports a word once per sentence completion (with its own
  // full set of wrong positions already merged there).
  const uniqueWords = new Map<string, Set<number>>();
  for (const { word, errorIndexes } of words) {
    if (!isMistakeWorthTracking(word)) continue;
    const normalized = normalizeMistakeWord(word);
    if (normalized.length === 0) continue;
    const positions = uniqueWords.get(normalized) ?? new Set<number>();
    for (const index of errorIndexes) positions.add(index);
    uniqueWords.set(normalized, positions);
  }
  await Promise.all(
    [...uniqueWords.entries()].map(([word, positions]) =>
      recordMistake(
        word,
        sentenceId,
        [...positions].sort((a, b) => a - b),
      ),
    ),
  );

  return { activeCount: await fetchActiveMistakeCount(userId) };
}

/**
 * The only place a mistake is ever removed from the active queue — see
 * FixYourMistakesSession, called only after the learner successfully types
 * the full target word inside that flow, never from the original lesson
 * (see the "PERSISTENCE SAFETY" requirement this satisfies).
 */
export async function markMistakeCorrectedAction(word: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save progress.");
  await markMistakeCorrected(userId, normalizeMistakeWord(word));
  // The Word Lists dashboard card and the review queue page are both
  // server-rendered reads of this same table (see fetchWeakWordsAction) —
  // without this, a learner who corrects a word from somewhere other than
  // that queue's own completion screen (e.g. ordinary Word Lists practice)
  // would keep seeing the stale pre-correction list/count on next visit,
  // since Next's client router cache doesn't know this write happened.
  revalidatePath("/learn/word-lists");
  revalidatePath("/learn/word-lists/review");
}

/**
 * Advances or resets a due review's schedule (see record_mistake_review's
 * migration doc comment) — the review counterpart to
 * markMistakeCorrectedAction, called instead of it when the item
 * FixYourMistakesSession just completed had `isReview: true`.
 * `hadErrors` is whether the learner made any mistake while retyping the
 * word THIS time (the typing engine still requires them to get it right
 * before moving on, same as everywhere else — this only affects how soon
 * it comes back, never whether it "passes").
 */
export async function markReviewCompletedAction(word: string, hadErrors: boolean): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save progress.");
  await recordMistakeReview(normalizeMistakeWord(word), hadErrors);
  // Same reasoning as markMistakeCorrectedAction's identical pair of calls.
  revalidatePath("/learn/word-lists");
  revalidatePath("/learn/word-lists/review");
}

/**
 * The full, ordered "Fix Your Mistakes" queue for the signed-in learner,
 * scoped to one specific lesson (`lessonId` — always the lesson whose
 * completion screen opened this flow, see FixYourMistakesSession/
 * LessonSession). Fetched fresh every time FixYourMistakesSession mounts
 * (never derived from stale local state), so it's always correct after a
 * refresh, a new device, or a partially-completed session from days ago.
 * Order is computed live from the current lesson content (see
 * buildWordOrderIndex), not stored — a row whose sentence/lesson can no
 * longer be resolved (RLS made it invisible, or content changed since the
 * mistake was recorded) is silently dropped from the queue rather than
 * shown broken; it remains 'active'/scheduled in the database and simply
 * reappears once resolvable again.
 *
 * The underlying `mistakes` table is deliberately account-wide (one row per
 * user+word, spanning every lesson that word ever appeared in — see that
 * migration's doc comment) so the spaced-review schedule keeps advancing
 * regardless of which lesson a learner is in; this function is what narrows
 * that account-wide table down to "only what belongs to the lesson the
 * learner just finished" for display here, by filtering on each row's
 * resolved sentence→lesson id. A word due for review from a DIFFERENT
 * lesson is filtered out here, not deleted or altered — it simply isn't
 * part of what THIS lesson's Fix Your Mistakes screen shows, and reappears
 * the moment the learner reopens that other lesson's own completion screen.
 *
 * Outstanding mistakes (never yet corrected) always sort before due
 * reviews (already corrected once, just due for a check) — a fresh mistake
 * is the more urgent of the two, and each group keeps the existing
 * curriculum-position order within itself.
 */
export async function fetchMistakesAction(lessonId: string): Promise<MistakeQueueItem[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const [activeRows, dueReviewRows] = await Promise.all([
    fetchActiveMistakeRows(userId),
    fetchDueReviewRows(userId),
  ]);
  const rows = [
    ...activeRows.map((row) => ({ ...row, isReview: false as const })),
    ...dueReviewRows.map((row) => ({ ...row, isReview: true as const })),
  ];
  if (rows.length === 0) return [];

  const sentenceIds = [...new Set(rows.map((row) => row.sentenceId))];
  const sentences = await fetchSentencesByIds(sentenceIds);
  const sentenceById = new Map(sentences.map((sentence) => [sentence.id, sentence]));

  const lessonIds = [...new Set(sentences.map((sentence) => sentence.lessonId))];
  const lessons = await fetchLessonsByIds(lessonIds);
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

  const content = await getAllLessons();
  const orderIndex = buildWordOrderIndex(content);

  const locale = await getLocale();
  const sentenceTranslations = locale
    ? await getContentTranslations("sentence", sentenceIds, locale)
    : undefined;

  const items: MistakeQueueItem[] = [];
  for (const row of rows) {
    const sentence = sentenceById.get(row.sentenceId);
    if (!sentence) continue;
    if (sentence.lessonId !== lessonId) continue;
    const lesson = lessonById.get(sentence.lessonId);
    if (!lesson) continue;

    const nonSpaceTokens = tokenize(sentence.en).filter((token) => token !== " ");
    const displayWord = nonSpaceTokens.find(
      (token) => isMistakeWorthTracking(token) && normalizeMistakeWord(token) === row.word,
    );
    if (!displayWord) continue;

    // Bounds-checked against the CURRENT displayWord: stored indexes only
    // ever came from that exact same raw token at the time of the mistake
    // (see TypingSentence's locateWordAtCharIndex), but content can change
    // after the fact — an out-of-range index is dropped rather than
    // highlighting the wrong letter or crashing.
    const errorIndexes = row.errorIndexes.filter(
      (index) => index >= 0 && index < displayWord.length,
    );

    const item: MistakeQueueItem = {
      word: row.word,
      displayWord,
      sentenceId: sentence.id,
      sentenceEn: sentence.en,
      sentenceAr: sentence.ar,
      mode: lesson.mode,
      lessonId: lesson.id,
      isReview: row.isReview,
      errorIndexes,
    };

    if (locale && sentenceTranslations) {
      const sentenceSupportText = resolveScalarField(
        sentenceTranslations,
        sentence.id,
        "text",
        sentence.ar,
        locale,
      );
      warnIfMissing(sentenceSupportText, "sentence", sentence.id, "text", locale);
      if (sentenceSupportText !== undefined) item.sentenceSupportText = sentenceSupportText;

      const supportWordTranslations = resolveWordArrayField(
        sentenceTranslations,
        sentence.id,
        "word_translations",
        sentence.wordTranslations,
        locale,
      );
      const wordIndex = nonSpaceTokens.indexOf(displayWord);
      const wordTranslation = supportWordTranslations?.[wordIndex];
      if (wordTranslation) item.wordTranslation = wordTranslation;
    }

    items.push(item);
  }

  items.sort((a, b) => {
    if (a.isReview !== b.isReview) return a.isReview ? 1 : -1;
    return (
      (orderIndex.get(a.word) ?? Number.POSITIVE_INFINITY) -
      (orderIndex.get(b.word) ?? Number.POSITIVE_INFINITY)
    );
  });

  // Cache-only pre-resolution for EVERY item, not just the first — mirrors
  // LessonPage's identical pre-resolution of a lesson's first sentence (see
  // lookupCachedAudioUrl's own doc comment for the round-trip cost this
  // avoids), extended to the whole queue here because that queue is small
  // and lesson-scoped (a handful of items — see this function's own doc
  // comment on lesson scoping), unlike a full lesson's entire sentence
  // list, which deliberately avoids this for cost reasons. Measured root
  // cause of the residual "small but noticeable" latency on words after the
  // first: voice_audio_cache is keyed on (voice, word text) alone, so most
  // mistake words are ALREADY cached account-wide the moment any learner
  // anywhere has ever mistyped them before — but without this, the CLIENT
  // never learns that until FixYourMistakesSession's own prefetch effect
  // gets around to resolving that specific item, whose only lead time is
  // the single previous word's short preview+typing cycle (nowhere near a
  // full sentence's). Resolving every item here gives every already-cached
  // word the same zero-round-trip path item 1 always had, and gives every
  // genuinely new (never-before-generated) word's background prefetch the
  // maximum possible lead time (see FixYourMistakesSession) instead of just
  // one item's worth. Never triggers Kokoro generation itself — a miss here
  // just leaves that item to resolve on demand exactly as before. Uses the
  // Normal lessons' own default (never Stories'/Word Lists'), since mistake
  // words come from ordinary (Normal) lesson content, and
  // generateIsolatedWordAudio resolves an isolated mistake word against
  // whatever voice its parent sentence used.
  const voiceId = await getDefaultNormalLessonVoiceId();
  const audioUrls = await Promise.all(
    items.map((item) => lookupCachedAudioUrl(item.displayWord, voiceId)),
  );
  items.forEach((item, index) => {
    item.audioUrl = audioUrls[index];
  });

  return items;
}
