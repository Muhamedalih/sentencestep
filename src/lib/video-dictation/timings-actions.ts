"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

import { isMissingTable } from "./arrangement-store";
import { getVideoLesson } from "./content";
import { videoStrings } from "./strings";
import { sanitizeTimings } from "./timings";
import { VIDEO_TIMINGS_CACHE_TAG } from "./timings-store";

const strings = videoStrings(null);

function refreshPages(videoId: string): void {
  revalidateTag(VIDEO_TIMINGS_CACHE_TAG);
  revalidatePath(`/learn/video/${videoId}`);
}

/**
 * Saves the times an Admin set by hand for one video (where each sentence starts and where the video
 * stops after it). The input is client input, so it is checked again against the video's own sentences
 * (see sanitizeTimings). Admin-only here and again by row-level security; the change goes to the audit
 * log (which video and how many sentences, never more).
 */
export async function saveVideoTimingsAction(
  videoId: string,
  input: unknown,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: strings.stopsNotAllowed };
  if (!isServiceRoleConfigured()) return { error: strings.stopsFailed };

  const lesson = getVideoLesson(videoId);
  const timings = lesson ? sanitizeTimings(input, lesson) : null;
  if (!lesson || !timings) return { error: strings.stopsInvalid };

  const user = await getCurrentUser();
  const { error } = await createServiceRoleClient()
    .from("video_timings")
    .upsert(
      {
        video_id: lesson.id,
        sentences: timings,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      },
      { onConflict: "video_id" },
    );
  if (error) {
    console.error("[video] saveVideoTimingsAction failed", error);
    return { error: isMissingTable(error) ? strings.stopsNoTable : strings.stopsFailed };
  }

  void logAdminAction("video.stops_edited", "video_timings", lesson.id, {
    sentences: timings.length,
  });
  refreshPages(lesson.id);
  return { success: strings.stopsSaved };
}

/** Deletes the times saved for one video, so it plays with the times written in its file again. Admin-only. */
export async function resetVideoTimingsAction(videoId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: strings.stopsNotAllowed };
  if (!isServiceRoleConfigured()) return { error: strings.stopsFailed };
  const lesson = getVideoLesson(videoId);
  if (!lesson) return { error: strings.stopsInvalid };

  const { error } = await createServiceRoleClient()
    .from("video_timings")
    .delete()
    .eq("video_id", lesson.id);
  if (error) {
    console.error("[video] resetVideoTimingsAction failed", error);
    return { error: isMissingTable(error) ? strings.stopsNoTable : strings.stopsFailed };
  }

  void logAdminAction("video.stops_reset", "video_timings", lesson.id);
  refreshPages(lesson.id);
  return { success: strings.stopsResetDone };
}
