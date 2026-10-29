import { storedClipsFor } from "@/lib/sentence-bank/lesson-clips";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchProgressCached } from "@/lib/progress/cached";
import { fetchLessonById } from "@/lib/supabase/queries/content";
import {
  fetchLearnerRuleStates,
  fetchLevelSentences,
  isMissingRulesSchema,
} from "@/lib/supabase/queries/learner-rules";

import { ladderForLevel, MAX_WORDS_BY_LEVEL } from "./levels";
import {
  isEmptyVisit,
  planRedoVisit,
  planRuleVisit,
  type PlanInput,
  type RuleVisit,
  type SourceSentence,
} from "./visit";

/**
 * Server side of the rule of the day: gathers what the planner needs (the story just read, or the
 * learner's own finished texts at their level, each sentence with its recording; the learner's rules;
 * the ladder of the level) and asks the pure planner for the visit. Every read that can fail degrades
 * to "nothing" rather than breaking the page: a learner is never shown an empty card.
 */

/** The visit, and the level whose ladder it came from (the card's label and its count of rules). */
export type LoadedRuleVisit = RuleVisit & { level: number };

/**
 * The visit for one learner on one day. A story gives the new rule from its own sentences (its level
 * picks the ladder); the daily task gives it from the learner's finished texts at `level`; without either,
 * the visit only asks earlier rules. Null when there is nothing to show, or no ladder at this level.
 */
export async function loadRuleVisit(args: {
  userId: string;
  todayISO: string;
  storyId: string | null;
  locale: SupportLocale | null;
  /** The learner's level (1 = A1, 2 = A2–B1, 3 = B2): the ladder when there is no story. */
  level: number;
  /** The daily task from Home: the new rule comes from the learner's own finished texts. */
  daily?: boolean;
  /** The repeat of the day's session (the row's button once answered): what was taught and asked today. */
  redo?: boolean;
}): Promise<LoadedRuleVisit | null> {
  let level = args.level;
  let source: SourceSentence[] = [];
  if (args.storyId) {
    const story = await fetchLessonById("stories", args.storyId, args.locale ?? undefined);
    if (!story) return null;
    level = story.level;
    source = await withRecordings(
      story.sentences.map((sentence) => ({ id: sentence.id, lessonId: story.id, en: sentence.en })),
    );
  }
  const ladder = ladderForLevel(level);
  if (!ladder) return null;

  const states = await fetchLearnerRuleStates(args.userId).catch((error: unknown) => {
    if (!isMissingRulesSchema(error))
      console.error("[daily-rule] could not read the learner's rules", error);
    return [];
  });

  // The earlier-rule questions come from the learner's own finished texts at this level, never from anyone else's.
  const progress = await fetchProgressCached(args.todayISO).catch(() => null);
  const lessonIds = [
    ...new Set(
      (progress?.completions ?? [])
        .filter((done) => done.mode === "stories" || done.mode === "normal")
        .map((done) => done.lessonId),
    ),
  ];
  const finished = await fetchLevelSentences(lessonIds, level)
    .then((sentences) =>
      withRecordings(
        sentences.map((sentence) => ({
          id: sentence.id,
          lessonId: sentence.lessonId,
          en: sentence.en,
        })),
      ),
    )
    .catch((error: unknown) => {
      console.error("[daily-rule] could not read the finished texts", error);
      return [] as SourceSentence[];
    });

  // The daily task has no story: its new rule comes from the learner's own finished texts.
  if (args.daily) source = finished;

  const input: PlanInput = {
    today: args.todayISO,
    states,
    source,
    recallPool: finished,
    seed: args.userId,
    ladder,
    maxWords: MAX_WORDS_BY_LEVEL[level],
  };
  // The repeat of the day's session plans what was taught and asked today, and the runner records nothing.
  const visit = args.redo ? planRedoVisit(input) : planRuleVisit(input);
  return isEmptyVisit(visit) ? null : { ...visit, level };
}

/** Whether a rule is due and nothing has been asked today yet: the Today carry-on sends the learner here first. */
export async function hasRuleDueToday(userId: string, todayISO: string): Promise<boolean> {
  const states = await fetchLearnerRuleStates(userId).catch(() => []);
  const due = states.some((row) => row.dueOn <= todayISO);
  const askedToday = states.some((row) => row.lastReviewedOn === todayISO);
  return due && !askedToday;
}

/** Keeps the sentences that have a stored recording, with its address: a sentence without one is never asked. */
async function withRecordings(
  sentences: readonly { id: string; lessonId: string; en: string }[],
): Promise<SourceSentence[]> {
  const clips = await storedClipsFor(sentences);
  const out: SourceSentence[] = [];
  for (const sentence of sentences) {
    const audioUrl = clips.get(sentence.id);
    if (audioUrl) out.push({ id: sentence.id, text: sentence.en, audioUrl });
  }
  return out;
}
