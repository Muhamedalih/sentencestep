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
