import { localISODateInTimeZone } from "@/lib/features/learner-date";
import { getContentTranslations, resolveScalarField } from "@/lib/i18n/content-translations";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { SupportLocale } from "@/lib/i18n/locales";
import { composeExam } from "@/lib/sentence-bank/exam";
import {
  MAX_POOL_LESSONS,
  finishedLessonDays,
  finishedTodayLessons,
  recentFinishedLessons,
  reviewedTodayCount,
} from "@/lib/sentence-bank/finished";
import { buildReviewItems } from "@/lib/sentence-bank/items";
import type { ReviewScreenItem } from "@/lib/sentence-bank/items";
import { REVIEW_SPARES } from "@/lib/sentence-bank/review";
import {
  selectSentenceReview,
  selectTodaySentences,
  sentencesStillToAsk,
} from "@/lib/sentence-bank/select";
import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import { storedClipsFor } from "@/lib/sentence-bank/lesson-clips";
import { fetchSentencePool } from "@/lib/sentence-bank/pool";
import { fetchWeakCandidateMistakeRows } from "@/lib/supabase/queries/mistakes";
import { fetchSentenceStates } from "@/lib/supabase/queries/sentence-mastery";
import type { SentenceStateRow } from "@/lib/supabase/queries/sentence-mastery";
import { isWeakWord } from "@/lib/weak-words/types";

/**
 * Sentence bank: what the server reads to decide which sentences the day's exam asks. TWO reads per
 * call, both of them small: the learner's own sentence_mastery rows (a handful a day), then the
 * sentences of the lessons they finished today and of their most recently finished ones, plus the
 * ones already on their schedule (see pool.ts for why the second one needs the service role).
 * Everything after that is pure (select.ts, exam.ts, items.ts). The exam screen adds the lookups
 * only IT needs — the learner's weak words, their language's meaning of the chosen sentences, and
 * which of them have a stored clip.
 *
 * Callers treat a failure as "nothing to ask" (the table does not exist until its migration is
 * applied): a missing optional feature must never take Home down.
 */

export interface SentenceBankContext {
  userId: string;
  /** The learner-local day, "YYYY-MM-DD". */
  todayISO: string;
  timeZone: string | undefined;
  /** The learner's own completions (from their progress): which lessons they finished, and when. */
  completions: readonly { lessonId: string; mode: string; completedAt: string }[];
}

export interface PoolCandidate extends SentenceCandidate {
  /** The legacy Arabic text of the sentence. */
  ar: string;
}

export interface SentenceBankRead {
  candidates: PoolCandidate[];
  states: Map<string, SentenceStateRow>;
  /** How many sentences were already asked today. */
  reviewedToday: number;
}

/** Due sentences looked up by id beyond the recent lessons; a learner away for months does not turn this into a big read. */
const MAX_DUE_LOOKUPS = 150;

export async function readSentenceBank(context: SentenceBankContext): Promise<SentenceBankRead> {
  const { userId, todayISO, timeZone, completions } = context;
  const finished = finishedLessonDays(
    completions,
    (iso) => localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10),
  );
  const recent = recentFinishedLessons(finished, todayISO, MAX_POOL_LESSONS);
  // The lessons finished today too: the day's exam asks about what was just learned as well.
  const todays = finishedTodayLessons(finished, todayISO);

  // Read 1: the learner's own rows. If the table is not there yet this throws before the heavier read.
  const states = await fetchSentenceStates(userId);
  const dueIds = [...states]
    .filter(([, state]) => state.dueOn <= todayISO)
    .map(([id]) => id)
    .slice(0, MAX_DUE_LOOKUPS);

  // Read 2: the sentences of the recent lessons and the due ones, in one request.
  const pool = await fetchSentencePool({ lessonIds: [...todays, ...recent], sentenceIds: dueIds });
  const candidates: PoolCandidate[] = [];
  for (const row of pool) {
    const completedOn = finished.get(row.lessonId);
    if (completedOn === undefined) continue;
    candidates.push({
      id: row.id,
      lessonId: row.lessonId,
      orderIndex: row.orderIndex,
      en: row.en,
      ar: row.ar,
      completedOn,
    });
  }
  return { candidates, states, reviewedToday: reviewedTodayCount(states, todayISO) };
}

/**
 * How many sentences are ready for the learner today — what decides whether Today's tasks box gets
 * its exam row, and how many sentences that row asks for: the ones from earlier days and the ones
 * from the lessons finished today, up to the day's batch. The weak-word order does not change how
 * MANY there are, so it is not read here.
 */
export async function countSentencesReady(context: SentenceBankContext): Promise<number> {
  const read = await readSentenceBank(context);
  const cap = sentencesStillToAsk(undefined, read.reviewedToday);
  const options = { todayISO: context.todayISO, cap };
  const earlier = selectSentenceReview(read.candidates, read.states, options).items.length;
  const today = selectTodaySentences(read.candidates, read.states, options).length;
  return Math.min(cap, earlier + today);
}

/**
 * The day's exam, ready to be drawn. Its sentences come from two places — the lessons the learner
 * finished today (so the day ends with proof it was learned) and earlier days (due first, then the
 * ones holding their weak words, then a spread over their lessons) — mixed by exam.ts, today's
 * first. Each has the form it is asked in, the meaning in the learner's language and the stored clip
 * in its lesson's voice that it plays — the exam always has its sound, so a sentence with no stored
 * clip (or none that its form needs the meaning for) is replaced by a spare one.
 */
export async function loadSentenceReviewScreen(
  context: SentenceBankContext & {
    locale: SupportLocale | null;
    /** The day's "remember N sentences" row, when it was dealt: how many it still wants is how many to ask. */
    quest?: { target: number; progress: number };
  },
): Promise<ReviewScreenItem[]> {
  const read = await readSentenceBank(context);
  const limit = sentencesStillToAsk(context.quest, read.reviewedToday);
  if (limit === 0) return [];

  const weakRows = await fetchWeakCandidateMistakeRows(context.userId).catch(() => []);
  const weakWords = new Set(weakRows.filter(isWeakWord).map((row) => row.word));
  const options = { todayISO: context.todayISO, weakWords, cap: limit + REVIEW_SPARES };
  const earlierSelection = selectSentenceReview(read.candidates, read.states, options).items;
  const todaySelection = selectTodaySentences(read.candidates, read.states, options);
  if (earlierSelection.length === 0 && todaySelection.length === 0) return [];

  const chosen = [...todaySelection, ...earlierSelection].map((item) => item.sentence);
  const locale = context.locale ?? DEFAULT_LOCALE;
  const [translations, clips] = await Promise.all([
    getContentTranslations(
      "sentence",
      chosen.map((sentence) => sentence.id),
      locale,
    ).catch(() => new Map<string, unknown>()),
    storedClipsFor(chosen),
  ]);

  const prompts = new Map<string, string>();
  for (const sentence of chosen) {
    const meaning = resolveScalarField(translations, sentence.id, "text", sentence.ar, locale);
    if (meaning) prompts.set(sentence.id, meaning);
  }

  const build = (selection: typeof earlierSelection) =>
    buildReviewItems({ selection, prompts, clips, weakWords, limit });
  return composeExam({ today: build(todaySelection), earlier: build(earlierSelection), limit });
}
