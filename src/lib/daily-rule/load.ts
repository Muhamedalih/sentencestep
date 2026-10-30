import { fetchStoredClips } from "@/lib/sentence-bank/clips";
import { clipRequestsFor } from "@/lib/sentence-bank/lesson-clips";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchProgressCached } from "@/lib/progress/cached";
import { fetchLessonById } from "@/lib/supabase/queries/content";
import {
  fetchLearnerRuleStates,
  fetchLevelSentences,
  isMissingRulesSchema,
} from "@/lib/supabase/queries/learner-rules";

import {
  ALL_RULES,
  ladderForLevel,
  LEVEL_NUMBER,
  MAX_WORDS_BY_LEVEL,
  ruleById,
  teachingLevel,
} from "./levels";
import { isPreparedId } from "./prepared";
import { preparedVoiceIdFor } from "./prepared-voice";
import {
  isEmptyVisit,
  planPracticeVisit,
  planRedoVisit,
  planRuleVisit,
  type ItemSpec,
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
 * the visit only asks earlier rules. The ladder is the learner's level, or the next one once they have met every
 * rule of it (levels.ts, teachingLevel); rules of other levels that they have met are still asked when due.
 * Null when there is nothing to show, or no ladder at this level.
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
  if (!ladderForLevel(level)) return null;

  const states = await fetchLearnerRuleStates(args.userId).catch((error: unknown) => {
    if (!isMissingRulesSchema(error))
      console.error("[daily-rule] could not read the learner's rules", error);
    return [];
  });
  const met = new Set(states.map((row) => row.ruleId));
  level = teachingLevel(level, met);
  const ladder = ladderForLevel(level);
  if (!ladder) return null;
  const inLadder = new Set(ladder.map((rule) => rule.id));
  const extra = ALL_RULES.filter((rule) => met.has(rule.id) && !inLadder.has(rule.id));

  // The earlier-rule questions come from the learner's own finished texts at this level, never from anyone else's.
  const finished = await loadFinishedSentences(args.todayISO, level);

  // The daily task has no story: its new rule comes from the learner's own finished texts.
  if (args.daily) source = finished;

  const input: PlanInput = {
    today: args.todayISO,
    states,
    source,
    recallPool: finished,
    seed: args.userId,
    ladder,
    extra,
    maxWords: MAX_WORDS_BY_LEVEL[level],
  };
  // The repeat of the day's session plans what was taught and asked today, and the runner records nothing.
  const visit = args.redo ? planRedoVisit(input) : planRuleVisit(input);
  return isEmptyVisit(visit) ? null : { ...(await withPreparedClips(visit)), level };
}

/**
 * The practice of one rule from the rule library: three sentences of the learner's own finished texts at the
 * rule's level that show it, or three of the rule's prepared sentences when those texts do not hold three.
 * Null for a rule that is on no ladder or has neither; the learner's rule rows are not read, since a practice
 * records nothing.
 */
export async function loadPracticeVisit(args: {
  userId: string;
  todayISO: string;
  ruleId: string;
}): Promise<LoadedRuleVisit | null> {
  const rule = ruleById(args.ruleId);
  if (!rule) return null;
  const level = LEVEL_NUMBER[rule.level];
  const finished = await loadFinishedSentences(args.todayISO, level);
  const visit = planPracticeVisit({
    rule,
    pool: finished,
    seed: `${args.userId}|${args.todayISO}|${rule.id}`,
    maxWords: MAX_WORDS_BY_LEVEL[level],
  });
  return visit ? { ...(await withPreparedClips(visit)), level } : null;
}

/**
 * The learner's own finished texts at one level (stories and daily lessons), each sentence with its stored
 * recording. A read that fails answers "no texts": the card then teaches without asking from them.
 */
async function loadFinishedSentences(todayISO: string, level: number): Promise<SourceSentence[]> {
  const progress = await fetchProgressCached(todayISO).catch(() => null);
  const lessonIds = [
    ...new Set(
      (progress?.completions ?? [])
        .filter((done) => done.mode === "stories" || done.mode === "normal")
        .map((done) => done.lessonId),
    ),
  ];
  return fetchLevelSentences(lessonIds, level)
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
}

/** Whether a rule is due and nothing has been asked today yet: the Today carry-on sends the learner here first. */
export async function hasRuleDueToday(userId: string, todayISO: string): Promise<boolean> {
  const states = await fetchLearnerRuleStates(userId).catch(() => []);
  const due = states.some((row) => row.dueOn <= todayISO);
  const askedToday = states.some((row) => row.lastReviewedOn === todayISO);
  return due && !askedToday;
}

/**
 * Keeps the sentences that have a stored recording, with its address and the narrator's voice: a sentence
 * without a recording is never asked, and the voice is what the sound of a single word is looked up under.
 */
async function withRecordings(
  sentences: readonly { id: string; lessonId: string; en: string }[],
): Promise<SourceSentence[]> {
  const requests = await clipRequestsFor(sentences);
  const clips = await fetchStoredClips(requests).catch(() => new Map<string, string>());
  const voices = new Map(requests.map((request) => [request.key, request.voiceId] as const));
  const out: SourceSentence[] = [];
  for (const sentence of sentences) {
    const audioUrl = clips.get(sentence.id);
    const voiceId = voices.get(sentence.id);
    if (audioUrl)
      out.push({ id: sentence.id, text: sentence.en, audioUrl, ...(voiceId ? { voiceId } : {}) });
  }
  return out;
}

/**
 * Gives the prepared sentences of a visit the recording stored for them, when there is one: looked up in the
 * clip cache under the voice that reads the sentence (prepared-voice.ts: half of a rule's sentences are read by the
 * Stories narrator, the others by Emma), never made here. A prepared sentence with no recording keeps none, and
 * its question is silent. One batched read, and only when the visit has prepared sentences.
 */
async function withPreparedClips(visit: RuleVisit): Promise<RuleVisit> {
  const prepared = [
    ...visit.recall.map((task) => task.item),
    ...(visit.learn?.notice ?? []),
    ...(visit.learn?.items ?? []),
  ].filter((item) => isPreparedId(item.sentenceId));
  if (prepared.length === 0) return visit;

  const clips = await fetchStoredClips(
    prepared.map((item) => ({
      key: item.sentenceId,
      text: item.text,
      voiceId: preparedVoiceIdFor(item.sentenceId),
    })),
  ).catch(() => new Map<string, string>());
  if (clips.size === 0) return visit;

  const sound = (item: ItemSpec): ItemSpec => {
    const audioUrl = clips.get(item.sentenceId);
    return audioUrl ? { ...item, audioUrl, voiceId: preparedVoiceIdFor(item.sentenceId) } : item;
  };
  return {
    ...visit,
    recall: visit.recall.map((task) => ({ ...task, item: sound(task.item) })),
    learn: visit.learn
      ? {
          ...visit.learn,
          notice: visit.learn.notice.map(sound),
          items: visit.learn.items.map(sound),
        }
      : null,
  };
}
