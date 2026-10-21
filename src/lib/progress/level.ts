import { OPENING_LESSON_ID, difficultyForStartingLevel } from "@/lib/progress/starting-level";
import type { LessonUnit } from "@/types/content";

/**
 * The level the learner is on: the first level with an incomplete lesson, or the highest level once
 * all are done. `startingLevel` (the tier chosen in StartingLevelOnboarding or Settings, or null/0 if
 * unset/skipped) nudges this for a learner with NO completions yet — and, with `floor` on (the
 * "Chosen level shapes the path" permission, see src/lib/rollouts), for good: it is then a floor, and
 * a level below it only counts once nothing at or above it is left. Without `floor` the moment even
 * one lesson is completed ordinary "first incomplete level" progression takes back over, which sent
 * learners who had chosen Intermediate or Advanced back through Level 1 from their second lesson.
 */
export function getCurrentLevel(
  units: readonly Pick<LessonUnit, "id" | "level">[],
  completedIds: readonly string[],
  startingLevel?: number | null,
  floor = false,
): number {
  const levels = Array.from(new Set(units.map((unit) => unit.level))).sort((a, b) => a - b);
  const hasOpenLesson = (level: number) =>
    units.some((unit) => unit.level === level && !completedIds.includes(unit.id));

  const floorLevel = startingLevel && (floor || completedIds.length === 0) ? startingLevel : 0;
  const current = levels.find((level) => level >= floorLevel && hasOpenLesson(level));
  return current ?? levels.find(hasOpenLesson) ?? levels[levels.length - 1] ?? 1;
}

/**
 * The next lesson (in display order) the learner hasn't completed yet, or
 * undefined once every eligible lesson is done. Free learners only ever see
 * free lessons here — `isPremiumUser` widens eligibility to the full
 * catalog so premium/admin learners keep getting a next-lesson recommendation
 * past the point a free learner would dead-end (see HomeHero).
 *
 * `startingLevel` shifts the recommendation to that level's first lesson for
 * a brand-new learner (no completions at all) — see getCurrentLevel's doc
 * comment for the exact same guard — and, with `floor` on, keeps it a floor
 * afterwards: the next lesson is the first incomplete one at or above that
 * level, and only once none is left there does the pick fall back to the
 * lessons below it, so a learner is never recommended nothing while something
 * is still open.
 *
 * For a brand-new learner (no completions at all) that tier's dedicated
 * OPENING_LESSON_ID (the exact lesson OnboardingIntroCard's own "Start" button
 * routes to) is preferred first, when it's actually in this eligible set:
 * plain `order` doesn't guarantee it sorts before the tier's other lessons
 * (its order_index just reflects wherever it was published in the catalog), so
 * without this a learner who left it mid-way (or who reached the dashboard
 * before ever tapping OnboardingIntroCard's "Start") could get recommended
 * an ordinary lesson instead of the one lesson written for this exact first
 * moment. Falls through to the plain "first lesson at or above this level"
 * pick when that opening lesson isn't eligible (wrong catalog/mode, filtered
 * out for a free learner, or already completed elsewhere), and once more to
 * ordinary first-eligible-lesson behavior if every lesson at or above that
 * level happens to be locked/unavailable, rather than recommending nothing.
 *
 * Sorted by level first and `order` only as the tiebreaker within a level —
 * `order` is a single sequence per mode (see LessonUnit.order's doc comment)
 * and is not guaranteed to stay level-monotonic as content is added over
 * time (Stories content authored in mixed-level batches is the concrete
 * case this was fixed for). Sorting by `order` alone could walk a learner
 * from a higher level back down to a lower one mid-catalog; leveling first
 * guarantees this always recommends within the learner's current level
 * before ever advancing to the next one.
 */
export function findCurrentLesson(
  units: LessonUnit[],
  completedIds: string[],
  isPremiumUser = false,
  startingLevel?: number | null,
  floor = false,
): LessonUnit | undefined {
  const eligible = isPremiumUser ? units : units.filter((unit) => unit.isFree);
  const sorted = eligible.slice().sort((a, b) => a.level - b.level || a.order - b.order);
  const isOpen = (unit: LessonUnit) => !completedIds.includes(unit.id);

  if (startingLevel && (floor || completedIds.length === 0)) {
    if (completedIds.length === 0) {
      const difficulty = difficultyForStartingLevel(startingLevel);
      const openingLesson = difficulty
        ? sorted.find((unit) => unit.id === OPENING_LESSON_ID[difficulty])
        : undefined;
      if (openingLesson) return openingLesson;
    }

    const fromStartingLevel = sorted.find((unit) => unit.level >= startingLevel && isOpen(unit));
    if (fromStartingLevel) return fromStartingLevel;
  }

  return sorted.find(isOpen);
}
