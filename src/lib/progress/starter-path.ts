import type { LessonUnit } from "@/types/content";

export interface StarterPathProgress {
  /** Starter lessons this learner has completed. */
  done: number;
  /** Every lesson that is free for everyone. */
  total: number;
  /** Whether there are starter lessons and all of them are done. */
  finished: boolean;
}

/**
 * How far a learner is through the lessons that are open to everyone — the
 * "starter lessons" the Home page shows as a calm progress line while the
 * rest is Premium. Completions of lessons that are not free (a learner who
 * did them while everything was open) never count towards it, so the line
 * can only ever reach "all done" by finishing the free ones, which is also
 * exactly when HomeHero runs out of free lessons to recommend.
 */
export function starterPathProgress(
  units: readonly Pick<LessonUnit, "id" | "isFree">[],
  completedIds: readonly string[],
): StarterPathProgress {
  const completed = new Set(completedIds);
  const free = units.filter((unit) => unit.isFree);
  const done = free.filter((unit) => completed.has(unit.id)).length;
  return { done, total: free.length, finished: free.length > 0 && done >= free.length };
}
