import { withOpeningLessonPlacement } from "@/lib/content-helpers";
import { findCurrentLesson } from "@/lib/progress/level";
import type { LessonUnit } from "@/types/content";

/**
 * Which lesson or story Today's session opens (pure — the loader reads the lists and the learner's
 * finished ones, this only picks). The two lists each have their own "next one" by the same rule as
 * everywhere else (the learner's level is a floor when that permission is open, see
 * findCurrentLesson); Today alternates between them so the days differ: a lesson after a story,
 * a story after a lesson.
 */

export type TodayMode = "normal" | "stories";

export interface TodayItem {
  id: string;
  mode: TodayMode;
  title: string;
  /** The title in the learner's language, when it has one. */
  supportTitle: string | null;
  level: number;
  isFree: boolean;
}

export interface TodayNewPick {
  /** What the session opens, or null when nothing this learner can open is left. */
  next: TodayItem | null;
  /** The next two after it (Path card), in the order Today would serve them. */
  upcoming: TodayItem[];
  /** The next Premium item a free learner is held at, or null. */
  locked: TodayItem | null;
}

interface FinishedLesson {
  lessonId: string;
  mode: string;
  completedAt: string;
}

function toItem(unit: LessonUnit, mode: TodayMode): TodayItem {
  return {
    id: unit.id,
    mode,
    title: unit.title,
    supportTitle: unit.supportTitle ?? null,
    level: unit.level,
    isFree: unit.isFree,
  };
}

export function pickNewItems(input: {
  units: LessonUnit[];
  storiesUnits: LessonUnit[];
  completions: readonly FinishedLesson[];
  startingLevel: number | null;
  isPremium: boolean;
  floor: boolean;
}): TodayNewPick {
  const { units, storiesUnits, completions, startingLevel, isPremium, floor } = input;
  const lists: Record<TodayMode, LessonUnit[]> = {
    normal: withOpeningLessonPlacement(units),
    stories: storiesUnits,
  };
  const done: Record<TodayMode, string[]> = {
    normal: completions.filter((entry) => entry.mode === "normal").map((entry) => entry.lessonId),
    stories: completions.filter((entry) => entry.mode === "stories").map((entry) => entry.lessonId),
  };

  const latest = completions
    .filter((entry) => entry.mode === "normal" || entry.mode === "stories")
    .reduce<FinishedLesson | null>(
      (best, entry) => (best === null || entry.completedAt > best.completedAt ? entry : best),
      null,
    );
  // The first session opens the opening lesson (a Normal lesson); after that, the other kind.
  let preferred: TodayMode = latest?.mode === "normal" ? "stories" : "normal";

  // The Premium item a free learner is held at, from what they really finished (the loop below
  // pretends the served ones are finished to find what comes after them).
  let locked: TodayItem | null = null;
  if (!isPremium) {
    const heldNormal = findCurrentLesson(lists.normal, done.normal, true, startingLevel, floor);
    const heldStory = findCurrentLesson(lists.stories, done.stories, true, startingLevel, floor);
    const held = [heldNormal, heldStory].find((unit) => unit && !unit.isFree);
    if (held) locked = toItem(held, lists.normal.includes(held) ? "normal" : "stories");
  }

  const served: TodayItem[] = [];
  for (let step = 0; step < 3; step++) {
    const candidate = (mode: TodayMode) =>
      findCurrentLesson(lists[mode], done[mode], isPremium, startingLevel, floor);
    const other: TodayMode = preferred === "normal" ? "stories" : "normal";
    const unit = candidate(preferred) ?? candidate(other);
    if (!unit) break;
    const mode: TodayMode = lists[preferred].includes(unit) ? preferred : other;
    served.push(toItem(unit, mode));
    done[mode] = [...done[mode], unit.id];
    preferred = mode === "normal" ? "stories" : "normal";
  }

  return { next: served[0] ?? null, upcoming: served.slice(1), locked };
}
