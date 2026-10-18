import { withOpeningLessonPlacement } from "@/lib/content-helpers";
import { OPENING_LESSON_ID } from "@/lib/progress/starting-level";
import type { LessonUnit } from "@/types/content";

/**
 * The free path: the lessons a learner on the free plan can do in one level,
 * in the order the catalog shows them. It is what the lesson list's counter,
 * the "one free lesson left" note on the finish screen and the screen shown
 * once the path is done all read, so they can never disagree about what
 * counts. Which lessons are free is data (`lessons.is_free`, set in the admin
 * Content page); nothing here assumes a number.
 *
 * A learner meets only the lessons the catalog shows, so that is what is
 * counted: First Steps is pinned first in Beginner and hidden in the other two
 * levels (see withOpeningLessonPlacement). The one exception is a hidden First
 * Steps the learner has already finished — an Intermediate or Advanced learner
 * starts with theirs — which counts as theirs, so their path reads like every
 * other level's.
 */

/** Just what the path reads off a lesson, so a catalog card and a lesson-nav entry both fit. */
export type FreePathUnit = Pick<LessonUnit, "id" | "level" | "order" | "isFree">;

export interface FreePath {
  level: number;
  /** Lesson ids in the order the learner meets them. */
  ids: string[];
  total: number;
  /** How many of them are finished. */
  done: number;
  /** The ones not finished yet, in order — the first is the next free lesson. */
  remainingIds: string[];
  /** True once the path has at least one lesson and every one is finished. */
  finished: boolean;
}

/** The First Steps copies the catalog hides (Beginner's is pinned in its list instead). */
const HIDDEN_OPENING_IDS: ReadonlySet<string> = new Set([
  OPENING_LESSON_ID.intermediate,
  OPENING_LESSON_ID.advanced,
]);

function byLevelThenOrder<T extends FreePathUnit>(a: T, b: T): number {
  return a.level - b.level || a.order - b.order;
}

/** The free path of one level for a learner who has finished `completedIds`. */
export function freePathForLevel(
  units: readonly FreePathUnit[],
  level: number,
  completedIds: readonly string[],
): FreePath {
  const completed = new Set(completedIds);
  const sorted = [...units].sort(byLevelThenOrder);
  const shown = withOpeningLessonPlacement(sorted).filter(
    (unit) => unit.level === level && unit.isFree,
  );
  const shownIds = new Set(shown.map((unit) => unit.id));
  const earned = sorted.filter(
    (unit) =>
      unit.level === level &&
      unit.isFree &&
      HIDDEN_OPENING_IDS.has(unit.id) &&
      completed.has(unit.id) &&
      !shownIds.has(unit.id),
  );

  const ids = [...earned, ...shown].map((unit) => unit.id);
  const remainingIds = ids.filter((id) => !completed.has(id));
  return {
    level,
    ids,
    total: ids.length,
    done: ids.length - remainingIds.length,
    remainingIds,
    finished: ids.length > 0 && remainingIds.length === 0,
  };
}

/**
 * The path the learner is on right now: the first level, starting from their own
 * (`startingLevel`, the placement they chose) and wrapping round to the lower ones,
 * that still has a free lesson to do. When every level's free lessons are done it is
 * the learner's own level, finished. Null when no lesson is free anywhere.
 */
export function freePathFocus(
  units: readonly FreePathUnit[],
  completedIds: readonly string[],
  startingLevel?: number | null,
): FreePath | null {
  const levels = Array.from(
    new Set(units.filter((unit) => unit.isFree).map((unit) => unit.level)),
  ).sort((a, b) => a - b);
  const first = levels[0];
  if (first === undefined) return null;

  const start = startingLevel && startingLevel > 0 ? startingLevel : first;
  const order = [
    ...levels.filter((level) => level >= start),
    ...levels.filter((level) => level < start),
  ];

  let fallback: FreePath | null = null;
  for (const level of order) {
    const path = freePathForLevel(units, level, completedIds);
    if (path.total === 0) continue;
    if (path.remainingIds.length > 0) return path;
    fallback ??= path;
  }
  return fallback;
}

/** The name every level's opening lesson carries: it is named on the path, never numbered. */
export const FIRST_STEPS_LABEL = "First Steps";

const OPENING_IDS: ReadonlySet<string> = new Set(Object.values(OPENING_LESSON_ID));

/**
 * One label per lesson of a path for the row of chips on the screen after it: the opening
 * lesson by name, every other lesson by its number (1, 2, 3 …), and `nextNumber`, the number
 * the lesson behind the lock would carry.
 */
export function pathChips(ids: readonly string[]): { labels: string[]; nextNumber: number } {
  let numbered = 0;
  const labels = ids.map((id) => (OPENING_IDS.has(id) ? FIRST_STEPS_LABEL : String(++numbered)));
  return { labels, nextNumber: numbered + 1 };
}

/** What a learner who opens a lesson that is part of Premium is shown. */
export type LockedLessonOutcome =
  { kind: "milestone" } | { kind: "redirect"; lessonId: string } | { kind: "preview" };

/**
 * The calmest honest answer for someone who opened a Premium lesson:
 *  - the free path of that lesson's level is done: the screen that says so, with the offer;
 *  - there are free lessons left and they arrived from outside the app (a bookmark, an email,
 *    a search result, or back from signing in): their next free lesson, since the lesson
 *    they asked for was never one they could open;
 *  - otherwise (they tapped it in the app, or nothing is known about their progress): a
 *    few lines of it, so what is behind the lock is something they have seen.
 * `path` is null for anything that has no free path (Stories, a guest).
 */
export function lockedLessonOutcome(
  path: FreePath | null,
  options: { signedIn: boolean; fromInApp: boolean },
): LockedLessonOutcome {
  if (!options.signedIn || !path || path.total === 0) return { kind: "preview" };
  if (path.finished) return { kind: "milestone" };
  const next = path.remainingIds[0];
  if (next && !options.fromInApp) return { kind: "redirect", lessonId: next };
  return { kind: "preview" };
}
