import type { ReviewWord } from "@/components/learning/word-review-session";
import { fetchCardReviewWordsAction } from "@/lib/cards/actions";
import { fetchDueCardCount } from "@/lib/cards/queries";
import { applyWordListAudio, assembleSession } from "@/lib/features/daily-session";
import type { SourceCandidates } from "@/lib/features/daily-session";
import type { EffectiveFeatures } from "@/lib/features/config";
import { fetchAllMistakesAction } from "@/lib/mistakes/actions";
import { fetchDueVocabularyRecallCount } from "@/lib/supabase/queries/vocabulary-recall";
import { fetchActiveMistakeCount, fetchDueReviewCount } from "@/lib/supabase/queries/mistakes";
import { fetchAllVocabularyWordsFlat } from "@/lib/supabase/queries/word-lists";
import { fetchWordProgress } from "@/lib/supabase/queries/word-progress";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchVocabularyRecallWordsAction } from "@/lib/vocabulary-recall/actions";
import { buildBlankSentence } from "@/lib/vocabulary-recall/blank-sentence";
import { fetchWeakWordsAction } from "@/lib/weak-words/actions";
import { resolveWordListVoiceAudio } from "@/lib/voice/word-list-word-audio";
import { getWordGroupById } from "@/lib/word-lists";

/**
 * Reads the daily session's sources and hands them to the pure assembler.
 * Every source is optional and independently failable: one that errors is
 * logged and simply contributes nothing, so a missing migration for (say)
 * personal cards never empties the whole session.
 */

async function attempt<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[daily-session] ${label} failed`, error);
    return fallback;
  }
}

/** Typing mistakes across every lesson, hydrated into the fill-in-the-blank shape the review screen renders. */
async function mistakeSources(
  size: number,
): Promise<[SourceCandidates<ReviewWord>, SourceCandidates<ReviewWord>]> {
  const items = await attempt("mistakes", () => fetchAllMistakesAction(size), []);
  const active: ReviewWord[] = [];
  const reviews: ReviewWord[] = [];
  for (const item of items) {
    const wordIndex = item.sentenceEn.split(/\s+/).indexOf(item.displayWord);
    if (wordIndex < 0) continue;
    const hint = item.wordTranslation?.text ?? item.sentenceSupportText;
    const word: ReviewWord = {
      id: `mistake-${item.word}`,
      groupId: "session",
      order: 0,
      targetWord: item.word,
      sentence: buildBlankSentence(item.sentenceEn, wordIndex),
      hintAr: item.sentenceAr,
      ...(hint ? { supportHint: hint } : {}),
      reason: item.isReview ? "review" : "active",
      audioUrl: item.audioUrl,
      pronunciationContentType: "sentence_word",
      pronunciationContentId: `${item.sentenceId}::${item.word}`,
    };
    (item.isReview ? reviews : active).push(word);
  }
  return [
    { source: "mistake", items: active },
    { source: "mistakeReview", items: reviews },
  ];
}

/** Word Lists words the learner's mistakes flagged as weak, hydrated from their owning groups (same approach as the Word Lists review page). */
async function weakSource(locale: SupportLocale | null): Promise<SourceCandidates<ReviewWord>> {
  const weak = await attempt("weak words", () => fetchWeakWordsAction(), []);
  const groupIds = [...new Set(weak.map((entry) => entry.groupId))];
  const groups = await Promise.all(
    groupIds.map((id) =>
      attempt("word group", () => getWordGroupById(id, locale ?? undefined), undefined),
    ),
  );
  const groupById = new Map(
    groups.filter((group) => group !== undefined).map((group) => [group.id, group]),
  );
  const items: ReviewWord[] = [];
  for (const entry of weak) {
    const match = groupById.get(entry.groupId)?.words.find((word) => word.id === entry.wordId);
    if (match) items.push({ ...match, reason: entry.reason });
  }
  return { source: "weak", items };
}

/** Words from Word Lists groups the learner has started but not finished — "keep going where you left off". */
async function wordListSource(
  userId: string,
  locale: SupportLocale | null,
  limit: number,
): Promise<SourceCandidates<ReviewWord>> {
  const [completedIds, flat] = await Promise.all([
    attempt("word progress", () => fetchWordProgress(userId), [] as string[]),
    attempt("vocabulary", () => fetchAllVocabularyWordsFlat(), []),
  ]);
  const done = new Set(completedIds);
  const startedGroups = new Set(
    flat.filter((word) => done.has(word.id)).map((word) => word.groupId),
  );
  const groupIds = [
    ...new Set(
      flat.filter((w) => startedGroups.has(w.groupId) && !done.has(w.id)).map((w) => w.groupId),
    ),
  ].slice(0, 3);
  const groups = await Promise.all(
    groupIds.map((id) =>
      attempt("word group", () => getWordGroupById(id, locale ?? undefined), undefined),
    ),
  );
  const items: ReviewWord[] = [];
  for (const group of groups) {
    if (!group) continue;
    for (const word of [...group.words].sort((a, b) => a.order - b.order)) {
      if (!done.has(word.id)) items.push({ ...word, reason: "review" });
      if (items.length >= limit) break;
    }
  }
  return { source: "wordList", items };
}

/** How many unfinished words sit in Word Lists groups the learner has started — counts only, no group hydration. */
async function wordListCandidateCount(userId: string): Promise<number> {
  const [completedIds, flat] = await Promise.all([
    fetchWordProgress(userId),
    fetchAllVocabularyWordsFlat(),
  ]);
  const done = new Set(completedIds);
  const startedGroups = new Set(
    flat.filter((word) => done.has(word.id)).map((word) => word.groupId),
  );
  return flat.filter((word) => startedGroups.has(word.groupId) && !done.has(word.id)).length;
}

/** The session's words, assembled from every source the admin has switched on. */
export async function buildDailySessionWords(
  userId: string,
  features: EffectiveFeatures,
  locale: SupportLocale | null,
): Promise<ReviewWord[]> {
  const { size, sources } = features.dailySession;
  const groups: SourceCandidates<ReviewWord>[] = [];

  if (sources.mistakesAndWeakWords) {
    const [active, reviews] = await mistakeSources(size);
    groups.push(active, reviews, await weakSource(locale));
  }
  if (sources.vocabularyRecall) {
    const recall = await attempt("recall", () => fetchVocabularyRecallWordsAction(), []);
    // Recall words carry only the Arabic gloss (hintAr); the review screen reads supportHint.
    groups.push({
      source: "recall",
      items: recall.map((word) => ({ ...word, supportHint: word.supportHint ?? word.hintAr })),
    });
  }
  if (sources.personalCards) {
    groups.push({
      source: "card",
      items: await attempt("cards", () => fetchCardReviewWordsAction("due"), []),
    });
  }
  if (sources.wordLists) groups.push(await wordListSource(userId, locale, size));

  const session = assembleSession(groups, size);
  // Every word is spoken in the Word Lists voice, whichever source it came
  // from — resolved here, server-side, in session order (see
  // resolveWordListVoiceAudio). An unresolved word gets no clip rather than
  // a different voice's; the review screen never falls back to the browser.
  const urlByWord = await attempt(
    "word-list voice audio",
    () => resolveWordListVoiceAudio(session.map((word) => word.targetWord)),
    new Map<string, string>(),
  );
  return applyWordListAudio(session, urlByWord);
}

/**
 * A cheap estimate of how many words are ready, for the Home card — counts
 * only, no hydration. The same word can sit in two sources (a mistake that's
 * also a Word List entry), so this can slightly overstate; capped by the
 * session size, and the session itself de-duplicates.
 */
export async function countDailySessionCandidates(
  userId: string,
  features: EffectiveFeatures,
  /** A weak-word count the caller already has in flight (Home computes the list for its own card) — skips repeating that read. */
  knownWeakWordCount?: Promise<number>,
): Promise<number> {
  const { sources, size } = features.dailySession;
  const counts = await Promise.all([
    sources.mistakesAndWeakWords
      ? Promise.all([
          attempt("mistake count", () => fetchActiveMistakeCount(userId), 0),
          attempt("review count", () => fetchDueReviewCount(userId), 0),
          attempt(
            "weak count",
            async () => knownWeakWordCount ?? (await fetchWeakWordsAction()).length,
            0,
          ),
        ]).then((values) => values.reduce((sum, value) => sum + value, 0))
      : 0,
    sources.vocabularyRecall
      ? attempt("recall count", () => fetchDueVocabularyRecallCount(userId), 0)
      : 0,
    sources.personalCards ? attempt("card count", () => fetchDueCardCount(userId), 0) : 0,
    sources.wordLists ? attempt("word list count", () => wordListCandidateCount(userId), 0) : 0,
  ]);
  return Math.min(
    size,
    counts.reduce((sum, value) => sum + value, 0),
  );
}
