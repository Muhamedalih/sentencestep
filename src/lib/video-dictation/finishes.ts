/**
 * Videos a learner has finished (table `video_finishes`, see 20250355000000_video_finishes.sql): the
 * pure rules around it. Written once per learner and video when the finish screen is reached; read
 * only as a count for Home's achievements panel.
 */

/** A video id as the browser sends it: a short slug that names a prepared video. Anything else is dropped. */
export function parseVideoFinishId(input: unknown, known: ReadonlySet<string>): string | null {
  if (typeof input !== "string") return null;
  if (input.length < 1 || input.length > 120) return null;
  return known.has(input) ? input : null;
}

/**
 * "Videos finished": each video once, and only the ones the library still has (a video taken out of
 * the library later is not a video the learner can find again, so it is not counted, the same rule
 * Home's other totals follow).
 */
export function countFinishedVideos(
  videoIds: ReadonlyArray<string>,
  known: ReadonlySet<string>,
): number {
  const seen = new Set<string>();
  for (const id of videoIds) if (known.has(id)) seen.add(id);
  return seen.size;
}

/** True when the error says the table is not there yet (the migration has not been applied). */
export function isMissingFinishesSchema(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (typeof message === "string" && /video_finishes/.test(message))
  );
}
