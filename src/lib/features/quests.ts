import { DAILY_QUEST_COUNT, QUEST_TYPES } from "@/lib/features/catalog";
import type { QuestType } from "@/lib/features/catalog";

/**
 * Pure daily-quest logic: which quests a learner is dealt on a given day,
 * and how a stream of events turns into progress. No I/O — the database
 * side (dealing rows, atomic progress + XP grant) lives in
 * quest-queries.ts and 20250317000000_daily_quests.sql.
 */

export function isQuestType(value: string): value is QuestType {
  return (QUEST_TYPES as readonly string[]).includes(value);
}

/** FNV-1a: a tiny, stable string hash — enough to make the daily shuffle deterministic, not a security primitive. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/**
 * Picks up to `count` quest types for one learner on one day. Deterministic
 * for a given (userId, dateISO, candidate set): the same learner sees the
 * same three quests all day even if the dealing runs twice (two tabs, a
 * retry), while different learners — and different days — get different
 * mixes. Fewer candidates than `count` just returns them all.
 */
export function pickDailyQuestTypes(
  userId: string,
  dateISO: string,
  candidates: readonly QuestType[],
  count: number = DAILY_QUEST_COUNT,
): QuestType[] {
  return [...candidates]
    .map((type) => ({ type, order: hash(`${userId}:${dateISO}:${type}`) }))
    .sort((a, b) => a.order - b.order || a.type.localeCompare(b.type))
    .slice(0, count)
    .map((entry) => entry.type);
}

export interface QuestEligibilityInput {
  /** Words the learner could actually review today (weak words + due cards) — "master N words" is only dealt when that many exist, so it can never be impossible. */
  reviewableWords: number;
  /** Whether Dictation is open to this learner in at least one section. */
  dictationAvailable: boolean;
  /** Whether the Daily session is open to this learner. */
  dailySessionAvailable: boolean;
}

export interface QuestTypeSettings {
  enabled: boolean;
  target: number;
}

/** The quest types that can be dealt today: admin-enabled AND actually achievable for this learner. */
export function eligibleQuestTypes(
  settings: Record<QuestType, QuestTypeSettings>,
  input: QuestEligibilityInput,
): QuestType[] {
  return QUEST_TYPES.filter((type) => {
    const config = settings[type];
    if (!config.enabled) return false;
    switch (type) {
      case "masterWords":
        return input.reviewableWords >= config.target;
      case "dictation":
        return input.dictationAvailable;
      case "dailySession":
        return input.dailySessionAvailable;
      default:
        return true;
    }
  });
}

export interface DailyQuest {
  slot: number;
  type: QuestType;
  target: number;
  progress: number;
  xp: number;
  completed: boolean;
}

/** Today's quests as Home shows them (what the quests card renders). */
export interface DailyQuestsPayload {
  quests: DailyQuest[];
  allDone: boolean;
}

/** What a lesson completion contributes to each quest type. */
export function questEventsForLesson(input: {
  sentenceCount: number;
  accuracy: number;
}): { type: QuestType; amount: number }[] {
  return [
    { type: "sentences", amount: input.sentenceCount },
    { type: "lessons", amount: 1 },
    ...(input.accuracy >= 0.95 ? [{ type: "accuracy" as const, amount: 1 }] : []),
  ];
}

export function questProgressPercent(quest: Pick<DailyQuest, "progress" | "target">): number {
  if (quest.target <= 0) return 100;
  return Math.min(100, Math.round((quest.progress / quest.target) * 100));
}

export function allQuestsCompleted(quests: readonly Pick<DailyQuest, "completed">[]): boolean {
  return quests.length > 0 && quests.every((quest) => quest.completed);
}
