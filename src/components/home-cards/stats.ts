/**
 * The pure parts of the achievements panel: what counts as a finished story and how far a learner is
 * along their level. Kept apart from the component so they can be tested.
 */

/** A completed lesson as the progress provider holds it. */
export interface FinishedLesson {
  mode: string;
  lessonId: string;
}

/**
 * Stories finished: each story once (a replay never counts twice), and only stories that still exist
 * (a story taken out of the catalogue has no entry in Home's lesson totals), the same rule the sentence
 * and word totals of the header follow.
 */
export function countFinishedStories(
  completions: ReadonlyArray<FinishedLesson>,
  lessonStats: Readonly<Record<string, unknown>>,
): number {
  const seen = new Set<string>();
  for (const completion of completions) {
    if (completion.mode !== "stories") continue;
    if (!lessonStats[`stories:${completion.lessonId}`]) continue;
    seen.add(completion.lessonId);
  }
  return seen.size;
}

/**
 * The share of the way to the next level, as a whole percent. It never says 100 while a next level
 * exists (the learner has not reached it yet), and a learner at the top level has no share to show.
 */
export function levelPercent(progress: number, hasNext: boolean): number {
  if (!hasNext) return 100;
  if (!Number.isFinite(progress)) return 0;
  return Math.min(99, Math.max(0, Math.floor(progress * 100)));
}
