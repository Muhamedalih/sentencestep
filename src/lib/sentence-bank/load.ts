import { localISODateInTimeZone } from "@/lib/features/learner-date";
import { getContentTranslations, resolveScalarField } from "@/lib/i18n/content-translations";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchPassage, fetchPassageProgress } from "@/lib/passages/queries";
import type { Passage } from "@/lib/passages/types";
import { MAX_TODAY_LESSONS, storiesFinishedToday } from "@/lib/sentence-bank/finished";
import { buildTodayItems } from "@/lib/sentence-bank/items";
import type { ReviewScreenItem } from "@/lib/sentence-bank/items";
import { storedClipsFor } from "@/lib/sentence-bank/lesson-clips";
import { fetchSentencePool } from "@/lib/sentence-bank/pool";
import { DAILY_REVIEW_COUNT } from "@/lib/sentence-bank/select";
import { interleaveToday, poolForToday, questionsReadyToday } from "@/lib/sentence-bank/today-exam";
import type { TodayLine } from "@/lib/sentence-bank/today-exam";

/**
 * Sentence bank: what the server reads to build the day's test. The test asks about Today's session
 * only — the story the learner finished today and the passage they listened to — so it reads exactly
 * those: the learner's passage progress (one small read, shared with Today's own), the story's
 * sentences (service role, scoped to the lessons they finished — see pool.ts), the passage (share-
 * cached). Nothing about earlier days, no schedule rows, no weak words. The test screen adds the
 * lookups only IT needs: the stories' stored clips and the language's meaning of their sentences.
 *
 * Callers treat a failure as "nothing to ask": a missing optional feature must never take Home down.
 */

export interface SentenceBankContext {
  userId: string;
  /** The learner-local day, "YYYY-MM-DD". */
  todayISO: string;
  timeZone: string | undefined;
  /** The learner's own completions (from their progress): which lessons they finished, and when. */
  completions: readonly { lessonId: string; mode: string; completedAt: string }[];
}

/** A line of today's lessons with what only the loader needs: the legacy Arabic and, for a passage line, its own narrated clip. */
interface TodayExamLine extends TodayLine {
  ar: string | null;
  audioUrl: string | null;
}

/** All the lines of a passage in reading order, numbered through its parts. */
function passageLines(passage: Passage): TodayExamLine[] {
  const lines: TodayExamLine[] = [];
  for (const section of [...passage.sections].sort((a, b) => a.order - b.order)) {
    for (const sentence of [...section.sentences].sort((a, b) => a.order - b.order)) {
      lines.push({
        id: sentence.id,
        lessonId: passage.id,
        source: "passage",
        orderIndex: lines.length,
        en: sentence.en,
        ar: sentence.ar || null,
        audioUrl: sentence.audioUrl,
      });
    }
  }
  return lines;
}

/**
 * The lines of the lessons the learner finished today: the stories (a finish today counts, a redo
 * too) and the passages (a passage counts when its progress says it was completed today). Empty —
 * and the stories' read skipped — when nothing was finished today.
 */
async function readTodayLines(context: SentenceBankContext): Promise<TodayExamLine[]> {
  const { userId, todayISO, timeZone, completions } = context;
  const dayOf = (iso: string) =>
    localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10);

  const storyIds = storiesFinishedToday(completions, dayOf, todayISO);
  const passageIds = (await fetchPassageProgress(userId))
    .filter((entry) => entry.completedAt !== null && dayOf(entry.completedAt) === todayISO)
    .map((entry) => entry.passageId)
    .sort()
    .slice(0, MAX_TODAY_LESSONS);
  if (storyIds.length === 0 && passageIds.length === 0) return [];

  const [sentences, passages] = await Promise.all([
    storyIds.length > 0 ? fetchSentencePool({ lessonIds: storyIds, sentenceIds: [] }) : [],
    Promise.all(passageIds.map((id) => fetchPassage(id))),
  ]);
  return [
    ...sentences.map((row): TodayExamLine => ({
      id: row.id,
      lessonId: row.lessonId,
      source: "story",
      orderIndex: row.orderIndex,
      en: row.en,
      ar: row.ar,
      audioUrl: null,
    })),
    ...passages.flatMap((passage) => (passage ? passageLines(passage) : [])),
  ];
}

/**
 * How many questions today's lessons can give — what decides whether Today's tasks box gets its
 * test row, and how many questions that row asks for (the row is dealt for no more than this, so
 * the task can always be finished). Zero until a passage or a story has been finished today.
 */
export async function countSentencesReady(context: SentenceBankContext): Promise<number> {
  return questionsReadyToday(await readTodayLines(context), context.todayISO);
}

/**
 * The day's test, ready to be drawn: sentences of the passage and the story finished today, one from
 * each in turn, every one typed whole from its sound (the meaning in the learner's language is shown
 * after the answer). Each has its stored clip — a story's in the voice of its own lesson, a passage
 * line's in its narrated clip — so a line with none is replaced by a spare one. The list is the same
 * every time it is asked for (see today-exam.ts), and a test left half way carries on from the
 * answers already counted: the questions to draw are the list from `quest.progress` up to `quest.target`.
 */
export async function loadSentenceReviewScreen(
  context: SentenceBankContext & {
    locale: SupportLocale | null;
    /** The day's "remember N sentences" row, when it was dealt: its target is how many to ask, its progress how many were already answered. */
    quest?: { target: number; progress: number };
  },
): Promise<ReviewScreenItem[]> {
  const wanted = context.quest ? context.quest.target : DAILY_REVIEW_COUNT;
  const answered = context.quest ? context.quest.progress : 0;
  if (answered >= wanted) return [];

  const lines = await readTodayLines(context);
  const pool = poolForToday(lines, context.todayISO);
  if (pool.length === 0) return [];

  const locale = context.locale ?? DEFAULT_LOCALE;
  const sentences = pool.filter((line) => line.source === "story");
  const [translations, storyClips] = await Promise.all([
    getContentTranslations(
      "sentence",
      sentences.map((line) => line.id),
      locale,
    ).catch(() => new Map<string, unknown>()),
    storedClipsFor(sentences),
  ]);

  const clips = new Map(storyClips);
  const prompts = new Map<string, string>();
  for (const line of pool) {
    if (line.source === "passage") {
      if (line.audioUrl) clips.set(line.id, line.audioUrl);
      // Passages carry an Arabic meaning only, so far.
      if (locale === "ar" && line.ar) prompts.set(line.id, line.ar);
    } else {
      const meaning = resolveScalarField(translations, line.id, "text", line.ar, locale);
      if (meaning) prompts.set(line.id, meaning);
    }
  }

  return interleaveToday(buildTodayItems({ lines: pool, prompts, clips })).slice(answered, wanted);
}
