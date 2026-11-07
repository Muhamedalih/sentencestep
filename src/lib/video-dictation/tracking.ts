import { parseVideoFinishId } from "@/lib/video-dictation/finishes";

/**
 * How the practice screen of Video dictation reports a video for the analytics events VIDEO_STARTED and
 * VIDEO_FINISHED (see trackVideoAction): the video was opened, or its finish screen was reached with the
 * share of letters typed right (0–1, the number the finish screen shows).
 */
export type VideoTrackReport =
  { event: "started"; videoId: string } | { event: "finished"; videoId: string; accuracy: number };

/**
 * Checks a report that arrived from the browser: a known event, an id the library has, and for a finish
 * an accuracy between 0 and 1 (kept to two decimals). Anything else is null and is simply not recorded.
 */
export function parseVideoTrackReport(
  input: unknown,
  known: ReadonlySet<string>,
): VideoTrackReport | null {
  if (typeof input !== "object" || input === null) return null;
  const { event, videoId, accuracy } = input as Record<string, unknown>;
  const id = parseVideoFinishId(videoId, known);
  if (!id) return null;
  if (event === "started") return { event, videoId: id };
  if (event !== "finished") return null;
  if (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) {
    return null;
  }
  return { event, videoId: id, accuracy: Math.round(accuracy * 100) / 100 };
}
