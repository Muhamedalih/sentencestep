import { unstable_cache } from "next/cache";

import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

import { isMissingTable } from "./arrangement-store";
import { applyTimings } from "./timings";
import type { VideoLesson } from "./types";

/** Revalidated by the save and reset actions, so a change shows at once instead of after the expiry below. */
export const VIDEO_TIMINGS_CACHE_TAG = "video-timings";

async function readAll(): Promise<Record<string, unknown>> {
  const { data, error } = await createServiceRoleClient()
    .from("video_timings")
    .select("video_id, sentences");
  // No table yet is the same as nothing saved: the times written in the video's file.
  if (error && isMissingTable(error)) return {};
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.video_id, row.sentences]));
}

/** Every saved row (a few small ones), share-cached across requests: it changes only when an Admin saves. */
const readAllCached = unstable_cache(readAll, ["video-timings"], {
  tags: [VIDEO_TIMINGS_CACHE_TAG],
  revalidate: 60,
});

/**
 * The video with the times an Admin saved by hand, or the video as it is in its file when none are saved.
 * Anything that goes wrong (no project linked, the table not created yet, a database error, a row that
 * does not fit the video) reads as "none saved": the practice screen always has times to play.
 */
export async function withSavedTimings(lesson: VideoLesson): Promise<VideoLesson> {
  if (!isServiceRoleConfigured()) return lesson;
  try {
    const all = await readAllCached();
    return applyTimings(lesson, all[lesson.id]);
  } catch (error) {
    console.error("[video] could not read the saved stops; the video's own times are used", error);
    return lesson;
  }
}
