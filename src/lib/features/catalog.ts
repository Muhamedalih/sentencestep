import { LEARNER_LEVELS } from "@/lib/progress/learner-level";

/**
 * Static catalogs for the engagement features (daily quests + badges). Kept
 * in one dependency-light module so config.ts (which validates admin input
 * against these ids) and the quest/badge logic can both import them without
 * a cycle. Display text (names, descriptions) is NOT here — it lives in the
 * i18n dictionaries, keyed by these ids, so it renders in the learner's
 * support language.
 */

// --- Daily quests ---

export const QUEST_TYPES = [
  "sentences",
  "lessons",
  "accuracy",
  "masterWords",
  "dictation",
  "dailySession",
] as const;

export type QuestType = (typeof QUEST_TYPES)[number];

export interface QuestDefault {
  /** How much of the metric completes the quest. */
  target: number;
  /** XP granted once when it completes. */
  xp: number;
}

/** Shipped defaults; an admin can override `target`/`xp` per type (and switch a type off) from /admin/features. */
export const QUEST_DEFAULTS: Record<QuestType, QuestDefault> = {
  sentences: { target: 15, xp: 10 },
  lessons: { target: 2, xp: 10 },
  accuracy: { target: 1, xp: 15 },
  masterWords: { target: 5, xp: 10 },
  dictation: { target: 5, xp: 15 },
  dailySession: { target: 1, xp: 15 },
};

/** How many quests a learner is dealt per day. */
export const DAILY_QUEST_COUNT = 3;

// --- Badges ---

/** Which learner stat a metric badge is measured against (see badges.ts). "event" badges are awarded when the action happens, not derived from a stat. */
export type BadgeMetric =
  | "longestStreak"
  | "totalSentences"
  | "lessonCount"
  | "perfectLessons"
  | "maxWpm"
  | "xp"
  | "fixedWords"
  | "event";

export type BadgeGroup = "streak" | "practice" | "speed" | "level" | "words" | "firsts" | "quests";

export interface BadgeDef {
  id: string;
  group: BadgeGroup;
  metric: BadgeMetric;
  /** Value the metric must reach (1 for event badges). */
  threshold: number;
}

function levelThreshold(name: string): number {
  return LEARNER_LEVELS.find((level) => level.name === name)?.minXp ?? 0;
}

export const BADGE_DEFS = [
  { id: "streak3", group: "streak", metric: "longestStreak", threshold: 3 },
  { id: "streak7", group: "streak", metric: "longestStreak", threshold: 7 },
  { id: "streak30", group: "streak", metric: "longestStreak", threshold: 30 },
  { id: "streak100", group: "streak", metric: "longestStreak", threshold: 100 },
  { id: "sentences100", group: "practice", metric: "totalSentences", threshold: 100 },
  { id: "sentences500", group: "practice", metric: "totalSentences", threshold: 500 },
  { id: "sentences1000", group: "practice", metric: "totalSentences", threshold: 1000 },
  { id: "lessons1", group: "practice", metric: "lessonCount", threshold: 1 },
  { id: "lessons10", group: "practice", metric: "lessonCount", threshold: 10 },
  { id: "lessons50", group: "practice", metric: "lessonCount", threshold: 50 },
  { id: "perfectLesson", group: "practice", metric: "perfectLessons", threshold: 1 },
  { id: "wpm30", group: "speed", metric: "maxWpm", threshold: 30 },
  { id: "wpm50", group: "speed", metric: "maxWpm", threshold: 50 },
  { id: "wpm70", group: "speed", metric: "maxWpm", threshold: 70 },
  { id: "levelExplorer", group: "level", metric: "xp", threshold: levelThreshold("Explorer") },
  { id: "levelBuilder", group: "level", metric: "xp", threshold: levelThreshold("Builder") },
  { id: "levelFluent", group: "level", metric: "xp", threshold: levelThreshold("Fluent") },
  { id: "levelAdvanced", group: "level", metric: "xp", threshold: levelThreshold("Advanced") },
  { id: "words25", group: "words", metric: "fixedWords", threshold: 25 },
  { id: "words100", group: "words", metric: "fixedWords", threshold: 100 },
  { id: "firstDictation", group: "firsts", metric: "event", threshold: 1 },
  { id: "firstFromMemory", group: "firsts", metric: "event", threshold: 1 },
  { id: "firstCard", group: "firsts", metric: "event", threshold: 1 },
  { id: "firstDailySession", group: "firsts", metric: "event", threshold: 1 },
  { id: "questDay", group: "quests", metric: "event", threshold: 1 },
] as const satisfies readonly BadgeDef[];

export type BadgeId = (typeof BADGE_DEFS)[number]["id"];

export const BADGE_IDS: readonly BadgeId[] = BADGE_DEFS.map((badge) => badge.id);

export function isBadgeId(value: string): value is BadgeId {
  return (BADGE_IDS as readonly string[]).includes(value);
}

/** Event badges are awarded by name when the action happens (see awardEventBadgeAction). */
export type EventBadgeId =
  "firstDictation" | "firstFromMemory" | "firstCard" | "firstDailySession" | "questDay";
