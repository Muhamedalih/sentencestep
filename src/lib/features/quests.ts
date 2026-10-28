import { DAILY_QUEST_COUNT, QUEST_TYPES } from "@/lib/features/catalog";
import type { QuestType } from "@/lib/features/catalog";
import type { WeeklyLine } from "@/lib/sentence-bank/weekly";
import type { TodayEndInfo } from "@/lib/today/end-state";

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
  /** The new Home only: nothing is left to open (every passage and story open to the learner is finished), so its Today box says so instead of listing tasks. `quests` then holds the rows the usual card draws. */
  todayEnd?: TodayEndInfo;
  /** Today's box only: one of the three tasks is the taste of the day, a Premium passage or story open to a free learner for today (see hybrid/picks.ts). */
  tasteToday?: boolean;
}

/**
 * Who a quest event counts for. Two kinds of row can share one quest type: the random mix (slots
 * 0-2) and Today's three tasks (slots 10-12), and the database advances EVERY row of a type. Without
 * this, a regular lesson would tick Today's story, three parts of any passage would tick its
 * listening task, and a flashcard word would tick its words task.
 */
export type QuestAudience = "general" | "today";

export interface QuestEvent {
  type: QuestType;
  amount: number;
  /** "general" when left out. Read only for the types the two kinds of row share. */
  audience?: QuestAudience;
}

/** The types a Today task and a random quest can both be: lessons, passages and master words. */
const SHARED_QUEST_TYPES: readonly QuestType[] = ["lessons", "passages", "masterWords"];

/**
 * The events that count for one learner: "today" ones only while Today's session is theirs, and
 * "general" ones only while it is not. The other types have a single kind of row, so all their
 * events count.
 */
export function eventsForAudience(
  events: readonly QuestEvent[],
  todayLearner: boolean,
): QuestEvent[] {
  return events.filter(
    (event) =>
      !SHARED_QUEST_TYPES.includes(event.type) || (event.audience === "today") === todayLearner,
  );
}

/**
 * What a lesson completion contributes to each quest type. A story also feeds Today's story task.
 */
export function questEventsForLesson(input: {
  sentenceCount: number;
  accuracy: number;
  story?: boolean;
}): QuestEvent[] {
  return [
    { type: "sentences", amount: input.sentenceCount },
    { type: "lessons", amount: 1 },
    ...(input.story ? [{ type: "lessons" as const, amount: 1, audience: "today" as const }] : []),
    ...(input.accuracy >= 0.95 ? [{ type: "accuracy" as const, amount: 1 }] : []),
  ];
}

/**
 * What one finished passage part contributes: every part counts toward the passages quest, and —
 * once the honest ticks are open — the part that finishes the passage also counts toward Today's
 * listening task (see eventsForAudience).
 */
export function passagePartQuestEvents(input: {
  passageCompleted: boolean;
  honestTicks: boolean;
}): QuestEvent[] {
  return input.passageCompleted && input.honestTicks
    ? [
        { type: "passages", amount: 1 },
        { type: "passages", amount: 1, audience: "today" },
      ]
    : [{ type: "passages", amount: 1 }];
}

/**
 * The events that count for one learner right now. Until the honest ticks are open every event
 * counts, as it always did; once they are, the audience rule applies.
 */
export function countedQuestEvents(
  events: readonly QuestEvent[],
  learner: { todayLearner: boolean; honestTicks: boolean },
): QuestEvent[] {
  return learner.honestTicks ? eventsForAudience(events, learner.todayLearner) : [...events];
}

export function questProgressPercent(quest: Pick<DailyQuest, "progress" | "target">): number {
  if (quest.target <= 0) return 100;
  return Math.min(100, Math.round((quest.progress / quest.target) * 100));
}

export function allQuestsCompleted(quests: readonly Pick<DailyQuest, "completed">[]): boolean {
  return quests.length > 0 && quests.every((quest) => quest.completed);
}
