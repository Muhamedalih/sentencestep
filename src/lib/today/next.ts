import { findCurrentLesson } from "@/lib/progress/level";
import { openablePassages } from "@/lib/passages/access";
import { passageStatus } from "@/lib/passages/progress";
import { PASSAGE_LEVELS } from "@/lib/passages/types";
import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import type { LessonUnit } from "@/types/content";

/**
 * Which passage and which story Today opens (pure — the loader reads the lists and the learner's
 * progress, this only picks). The learner's chosen level is a floor for both: a passage or story of
 * a lower level only comes up once nothing at or above it is left open.
 */

/** The passage level a learner's chosen level (1 Beginner, 2 Intermediate, 3 Advanced) starts on. */
export function passageStartIndex(startingLevel: number | null): number {
  if (startingLevel === 2) return 1;
  if (startingLevel === 3) return 2;
  return 0;
}

/**
 * The passage to listen to: one already started comes first (finish what you began), then the first
 * not started, in level order from the learner's own level up. Never a Premium one a free learner
 * can't open. Null once every open passage is done.
 */
export function pickPassage(
  summaries: readonly PassageSummary[],
  progressById: ReadonlyMap<string, PassageProgress>,
  canOpenPremium: boolean,
  startingLevel: number | null,
): PassageSummary | null {
  const start = passageStartIndex(startingLevel);
  const rank = (passage: PassageSummary) => {
    const index = PASSAGE_LEVELS.indexOf(passage.level);
    return (index >= start ? 0 : 10) + index;
  };
  const ordered = openablePassages(summaries, canOpenPremium).sort(
    (a, b) => rank(a) - rank(b) || a.order - b.order,
  );
  const status = (passage: PassageSummary) =>
    passageStatus(progressById.get(passage.id), passage.sectionCount);
  return (
    ordered.find((passage) => status(passage) === "in-progress") ??
    ordered.find((passage) => status(passage) === "new") ??
    null
  );
}

/** The story to type: the next one this learner can open, from their level up (see findCurrentLesson). */
export function pickStory(
  storiesUnits: LessonUnit[],
  completedStoryIds: string[],
  isPremium: boolean,
  startingLevel: number | null,
): LessonUnit | null {
  return findCurrentLesson(storiesUnits, completedStoryIds, isPremium, startingLevel, true) ?? null;
}
