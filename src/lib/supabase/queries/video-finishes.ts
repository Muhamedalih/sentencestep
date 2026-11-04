import { createClient } from "@/lib/supabase/server";
import { getVideoLessons } from "@/lib/video-dictation/content";
import { countFinishedVideos, isMissingFinishesSchema } from "@/lib/video-dictation/finishes";

/**
 * Reads and writes of `video_finishes` (see 20250355000000_video_finishes.sql). Session-aware client:
 * row level security limits every call to the learner's own rows, so the id passed in is only a
 * filter or the row's owner, never what the boundary trusts. A project that has not applied the
 * migration answers "nothing recorded" and "no number", and never takes a page down.
 */

/** The set of video ids the library has right now. */
export function knownVideoIds(): Set<string> {
  return new Set(getVideoLessons().map((lesson) => lesson.id));
}

/** Records that the learner finished a video. A second finish of the same video changes nothing. */
export async function recordVideoFinish(userId: string, videoId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("video_finishes")
    .upsert(
      { user_id: userId, video_id: videoId },
      { onConflict: "user_id,video_id", ignoreDuplicates: true },
    );
  if (error) {
    if (isMissingFinishesSchema(error)) return false;
    throw error;
  }
  return true;
}

/** How many of the library's videos the learner has finished, or null when the number cannot be read (the table is missing, anything failed). */
export async function fetchFinishedVideoCount(userId: string): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("video_finishes")
      .select("video_id")
      .eq("user_id", userId);
    if (error) {
      if (!isMissingFinishesSchema(error)) console.error("[video-finishes] read failed", error);
      return null;
    }
    return countFinishedVideos(
      (data ?? []).map((row) => row.video_id),
      knownVideoIds(),
    );
  } catch (error) {
    console.error("[video-finishes] read failed", error);
    return null;
  }
}
