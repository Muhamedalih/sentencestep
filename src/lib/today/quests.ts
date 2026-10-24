import type { QuestType } from "@/lib/features/catalog";
import type { DailyQuest } from "@/lib/features/quests";

import { STEP_KINDS } from "./plan";
import type { StepKind } from "./plan";

/**
 * Today's three steps ARE the learner's daily quests while "Today's session (new Home)" is open
 * for them: the same table, the same atomic progress-and-XP function, the same events — only the
 * pool is fixed instead of dealt at random. Listening to a passage is the "passage parts" quest, the
 * story is "finish a lesson", the words are "master words". The rows sit in slots 10-12, apart from
 * any random quests already dealt earlier that day, so nothing a learner has already earned is
 * disturbed. Pure: the dealing itself is in quest-service.ts.
 */

export const TODAY_QUEST_SLOT_BASE = 10;

export const TODAY_QUEST_TYPE: Record<StepKind, QuestType> = {
  listen: "passages",
  story: "lessons",
  words: "masterWords",
};

/** The story task is "finish ONE story", whatever the pool's "finish lessons" target is (2 by default). */
export const TODAY_STORY_TARGET = 1;

export function todayQuestSlot(kind: StepKind): number {
  return TODAY_QUEST_SLOT_BASE + STEP_KINDS.indexOf(kind);
}

export interface TodayQuestRow {
  slot: number;
  type: QuestType;
  target: number;
  xp: number;
}

/** The three rows to deal, with the admin-tuned target and XP of each quest type. */
export function todayQuestRows(
  settings: Record<QuestType, { target: number; xp: number }>,
): TodayQuestRow[] {
  return STEP_KINDS.map((kind) => {
    const type = TODAY_QUEST_TYPE[kind];
    return {
      slot: todayQuestSlot(kind),
      type,
      target: kind === "story" ? TODAY_STORY_TARGET : settings[type].target,
      xp: settings[type].xp,
    };
  });
}

/**
 * The sentence bank's row, Today's optional fourth slot (see src/lib/sentence-bank): "remember N
 * sentences", dealt only on a day sentences are ready and never part of the three steps.
 */
export const TODAY_SENTENCE_SLOT = TODAY_QUEST_SLOT_BASE + STEP_KINDS.length;

/** Whether the day can have a test at all for this learner: the sentence bank is open to them, quests are on, and the test's own quest type is not switched off. */
export function sentenceTestAvailable(features: {
  rollouts: { sentenceBank: boolean };
  quests: { enabled: boolean; types: Record<QuestType, { enabled: boolean }> };
}): boolean {
  return (
    features.rollouts.sentenceBank &&
    features.quests.enabled &&
    features.quests.types.sentenceReview.enabled
  );
}

/**
 * The row to deal for the sentence review, or null when there is nothing to ask (no empty row, ever)
 * or the admin switched the quest type off. The target is how many sentences are ready, up to the
 * tuned target, so the task can always be finished.
 */
export function sentenceQuestRow(
  settings: Record<QuestType, { enabled: boolean; target: number; xp: number }>,
  ready: number,
): TodayQuestRow | null {
  const config = settings.sentenceReview;
  if (ready <= 0 || !config.enabled) return null;
  return {
    slot: TODAY_SENTENCE_SLOT,
    type: "sentenceReview",
    target: Math.max(1, Math.min(config.target, ready)),
    xp: config.xp,
  };
}

/**
 * The day's exam is an extra, not a fourth thing to finish: Today's ring, its "all done" and the
 * day's badge count the three steps only, and a learner who skips the exam has still finished the day.
 */
export function isOptionalQuest(quest: Pick<DailyQuest, "type">): boolean {
  return quest.type === "sentenceReview";
}

/** The quests the day needs finished (everything but the exam). */
export function requiredQuests<T extends Pick<DailyQuest, "type">>(quests: readonly T[]): T[] {
  return quests.filter((quest) => !isOptionalQuest(quest));
}

/** The day's sentence review row, if one was dealt. */
export function sentenceQuest(quests: readonly DailyQuest[]): DailyQuest | undefined {
  return quests.find(
    (quest) => quest.slot === TODAY_SENTENCE_SLOT && quest.type === "sentenceReview",
  );
}

/** Today's quests by the step they belong to (a row that is not one of Today's three is ignored). */
export function questsByStep(quests: readonly DailyQuest[]): Partial<Record<StepKind, DailyQuest>> {
  const byStep: Partial<Record<StepKind, DailyQuest>> = {};
  for (const quest of quests) {
    const kind = STEP_KINDS.find(
      (candidate) =>
        todayQuestSlot(candidate) === quest.slot && TODAY_QUEST_TYPE[candidate] === quest.type,
    );
    if (kind) byStep[kind] = quest;
  }
  return byStep;
}
