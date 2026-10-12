import { getCurrentLevel } from "@/lib/progress/level";
import { resumePoint } from "@/lib/word-mastery/schedule";
import type { WordGroupSummary } from "@/types/word-lists";

/**
 * Pure rules behind Home's "Today's plan" (admin preview): three steps in a
 * fixed order — a few new words, a story, a writing lesson — and the level card
 * on the Profile that measures the same three tracks together. No I/O: the
 * words come from words.ts, lessons and stories from what Home already loads.
 */

/** New words per day: one practice block (BLOCK_SIZE in vocabulary-practice.tsx). */
export const WORDS_PER_DAY = 5;

/** Words feed the story, the story is read for language, writing then makes both stick. */
export const PLAN_STEPS = ["words", "story", "write"] as const;
export type PlanStep = (typeof PLAN_STEPS)[number];
export type StepState = "done" | "current" | "todo";

/** The first step not done yet is the current one; later ones wait for it. */
export function stepStates(done: Record<PlanStep, boolean>): Record<PlanStep, StepState> {
  const current = PLAN_STEPS.find((step) => !done[step]);
  const states = {} as Record<PlanStep, StepState>;
  for (const step of PLAN_STEPS)
    states[step] = done[step] ? "done" : step === current ? "current" : "todo";
  return states;
}

export const TRACKS = ["words", "stories", "lessons"] as const;
export type Track = (typeof TRACKS)[number];
export interface TrackCount {
  done: number;
  total: number;
}

export interface LevelSummary {
  /** 0–100: the average of the tracks' completion, each track counting equally. */
  percent: number;
  /** The track furthest behind, or null when there is nothing to measure. */
  weakest: Track | null;
}

export function summarizeLevel(counts: Record<Track, TrackCount>): LevelSummary {
  const ratios = TRACKS.filter((track) => counts[track].total > 0).map((track) => ({
    track,
    ratio: Math.min(1, counts[track].done / counts[track].total),
  }));
  if (ratios.length === 0) return { percent: 0, weakest: null };
  const percent = Math.round(
    (ratios.reduce((sum, entry) => sum + entry.ratio, 0) / ratios.length) * 100,
  );
  const weakest = ratios.reduce((low, entry) => (entry.ratio < low.ratio ? entry : low)).track;
  return { percent, weakest };
}

const CEFR = ["A1", "A2-B1", "B2"] as const;

/** The CEFR code of a level, matching the unit names in src/data/units.ts. */
export function cefrForLevel(level: number): string {
  return CEFR[Math.min(Math.max(level, 1), CEFR.length) - 1]!;
}

/** Completed lessons of one level among the ones this learner can open. */
export function levelCount(
  units: readonly { id: string; level: number; isFree: boolean }[],
  completedIds: readonly string[],
  level: number,
  isPremiumUser: boolean,
): TrackCount {
  const done = new Set(completedIds);
  const inLevel = units.filter((unit) => unit.level === level && (isPremiumUser || unit.isFree));
  return { done: inLevel.filter((unit) => done.has(unit.id)).length, total: inLevel.length };
}

function openGroups(groups: readonly WordGroupSummary[], isPremiumUser: boolean) {
  return groups
    .filter((group) => (isPremiumUser || group.isFree) && group.wordIds.length > 0)
    .sort((a, b) => a.level - b.level || a.order - b.order);
}

/** Words completed and total per level, over the groups this learner can open. */
export function wordCountsByLevel(
  groups: readonly WordGroupSummary[],
  completed: ReadonlySet<string>,
  isPremiumUser: boolean,
): Record<number, TrackCount> {
  const byLevel: Record<number, TrackCount> = {};
  for (const group of openGroups(groups, isPremiumUser)) {
    const entry = (byLevel[group.level] ??= { done: 0, total: 0 });
    entry.total += group.wordIds.length;
    entry.done += group.wordIds.filter((id) => completed.has(id)).length;
  }
  return byLevel;
}

/**
 * The learner's current level (by their lessons, like everywhere else) and how
 * far each of the three tracks is inside it — what the Profile's level card shows.
 */
export function levelProgress(input: {
  units: readonly { id: string; level: number; isFree: boolean }[];
  storiesUnits: readonly { id: string; level: number; isFree: boolean }[];
  groups: readonly WordGroupSummary[];
  lessonIds: readonly string[];
  storyIds: readonly string[];
  completedWordIds: ReadonlySet<string>;
  startingLevel: number | null;
  isPremiumUser: boolean;
}): { level: number; counts: Record<Track, TrackCount> } {
  const level = getCurrentLevel(input.units, input.lessonIds, input.startingLevel);
  return {
    level,
    counts: {
      words: wordCountsByLevel(input.groups, input.completedWordIds, input.isPremiumUser)[
        level
      ] ?? {
        done: 0,
        total: 0,
      },
      stories: levelCount(input.storiesUnits, input.storyIds, level, input.isPremiumUser),
      lessons: levelCount(input.units, input.lessonIds, level, input.isPremiumUser),
    },
  };
}

export interface NextWordBlock {
  group: WordGroupSummary;
  /** 0-based block of WORDS_PER_DAY words inside the group. */
  blockIndex: number;
  /** 1-based positions shown to the learner, e.g. words 6–10 of 20. */
  from: number;
  to: number;
  /** Some of this group is already done, so Continue resumes instead of restarting. */
  started: boolean;
}

/**
 * Where today's words come from: the first group (level, then order) with an
 * unfinished word, and the block holding that word — the same block the
 * practice screen resumes at. A learner with no finished word yet starts at
 * their onboarding level, the way findCurrentLesson does for lessons.
 */
export function pickNextWordBlock(
  groups: readonly WordGroupSummary[],
  completed: ReadonlySet<string>,
  options: { isPremiumUser: boolean; startingLevel: number | null },
): NextWordBlock | null {
  const open = openGroups(groups, options.isPremiumUser);
  const startAt = completed.size === 0 && options.startingLevel ? options.startingLevel : 0;
  const atOrAbove = open.filter((group) => group.level >= startAt);
  for (const group of atOrAbove.length > 0 ? atOrAbove : open) {
    if (group.wordIds.every((id) => completed.has(id))) continue;
    const { blockIndex } = resumePoint(group.wordIds, completed, WORDS_PER_DAY);
    const from = blockIndex * WORDS_PER_DAY + 1;
    return {
      group,
      blockIndex,
      from,
      to: Math.min(from + WORDS_PER_DAY - 1, group.wordIds.length),
      started: group.wordIds.some((id) => completed.has(id)),
    };
  }
  return null;
}
