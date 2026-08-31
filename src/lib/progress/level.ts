import type { LessonUnit } from "@/types/content";

/**
 * The first level with an incomplete lesson, or the highest level once all
 * are done. `startingLevel` (a learner's onboarding placement choice, or null
 * if unset/skipped — see StartingLevelOnboarding) only ever nudges this for a
 * learner with NO completions yet: the moment even one lesson is completed,
 * ordinary "first incomplete level" progression takes back over, so this
 * never re-applies to a returning learner or overrides real progress.
 */
export function getCurrentLevel(
  units: LessonUnit[],
  completedIds: string[],
  startingLevel?: number | null,
): number {
  const levels = Array.from(new Set(units.map((unit) => unit.level))).sort((a, b) => a - b);

  if (completedIds.length === 0 && startingLevel) {
    const atOrAbove = levels.filter((level) => level >= startingLevel);
    if (atOrAbove.length > 0) return atOrAbove[0]!;
  }

  for (const level of levels) {
    const levelUnits = units.filter((unit) => unit.level === level);
    const allDone = levelUnits.every((unit) => completedIds.includes(unit.id));
    if (!allDone) return level;
  }

  return levels[levels.length - 1] ?? 1;
}

/**
 * The next lesson (in display order) the learner hasn't completed yet, or
 * undefined once every eligible lesson is done. Free learners only ever see
 * free lessons here — `isPremiumUser` widens eligibility to the full
 * catalog so premium/admin learners keep getting a next-lesson recommendation
 * past the point a free learner would dead-end (see HomeHero).
 *
 * `startingLevel` shifts the recommendation to that level's first lesson for
 * a brand-new learner (no completions at all) who chose a placement above
 * Beginner — see getCurrentLevel's doc comment for the exact same guard. If
 * every lesson at or above that level happens to be locked/unavailable for
 * this learner, this quietly falls back to the ordinary first-eligible-lesson
 * behavior rather than recommending nothing.
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
): LessonUnit | undefined {
  const eligible = isPremiumUser ? units : units.filter((unit) => unit.isFree);
  const sorted = eligible.slice().sort((a, b) => a.level - b.level || a.order - b.order);

  if (completedIds.length === 0 && startingLevel) {
    const fromStartingLevel = sorted.find((unit) => unit.level >= startingLevel);
    if (fromStartingLevel) return fromStartingLevel;
  }

  return sorted.find((unit) => !completedIds.includes(unit.id));
}
