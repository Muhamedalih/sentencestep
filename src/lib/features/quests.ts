import { DAILY_QUEST_COUNT, QUEST_TYPES } from "@/lib/features/catalog";
import type { QuestType } from "@/lib/features/catalog";
import type { WeeklyLine } from "@/lib/sentence-bank/weekly";

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
  /** Whether Passages is open to this learner — "finish passage parts" is only dealt to someone who can read them. */
  passagesAvailable: boolean;
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
      case "passages":
        return input.passagesAvailable;
      case "sentenceReview":
        // Only ever Today's fourth task (see sentence-bank/quest.ts), never part of the random mix.
        return false;
      default:
        return true;
    }
  });
}

/**
 * What a daily quest is tied to while "Today's session (daily tasks)" is open: the specific passage,
 * story or word round the quest sends the learner to (see src/lib/today). Present only on the three
 * Today quests, and only for Home — the database rows never carry it.
 */
export interface TodayQuestInfo {
  kind: "listen" | "story" | "words" | "sentences";
  /** English title of the passage or story ("" for the words task). */
  title: string;
  supportTitle: string | null;
  /** The passage's level (A1…B2) or the story's CEFR code. */
  levelCode: string | null;
  minutes: number;
  /** Where the task starts. */
  href: string;
  /** Where "redo" goes for a task finished today (the passage or story it was), or null. */
  redoHref: string | null;
  /** The story's typing accuracy (0-1) when it was finished today. */
  accuracy: number | null;
  /** The quest itself was completed in the database (its XP is paid), not only derived from a lesson finished before it was dealt. */
  paid: boolean;
}

export interface DailyQuest {
  slot: number;
  type: QuestType;
  target: number;
  progress: number;
  xp: number;
  completed: boolean;
  today?: TodayQuestInfo;
}

/** Today's quests as Home shows them (what the quests card renders). */
export interface DailyQuestsPayload {
  quests: DailyQuest[];
  allDone: boolean;
  /** Today's box only, when the sentence bank is open: the one quiet line about the weekly sentence check (it is ready, or its result for the week after it). */
  weekly?: WeeklyLine | null;
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
