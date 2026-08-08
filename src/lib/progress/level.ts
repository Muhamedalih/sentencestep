import type { LessonUnit } from "@/types/content";

/** The first level with an incomplete lesson, or the highest level once all are done. */
export function getCurrentLevel(units: LessonUnit[], completedIds: string[]): number {
  const levels = Array.from(new Set(units.map((unit) => unit.level))).sort((a, b) => a - b);

  for (const level of levels) {
    const levelUnits = units.filter((unit) => unit.level === level);
    const allDone = levelUnits.every((unit) => completedIds.includes(unit.id));
    if (!allDone) return level;
  }

  return levels[levels.length - 1] ?? 1;
}

/** The next free lesson (in display order) the learner hasn't completed yet, or undefined once all free lessons are done. */
export function findCurrentLesson(
  units: LessonUnit[],
  completedIds: string[],
): LessonUnit | undefined {
  const sorted = units.filter((unit) => unit.isFree).sort((a, b) => a.order - b.order);
  return sorted.find((unit) => !completedIds.includes(unit.id));
}
