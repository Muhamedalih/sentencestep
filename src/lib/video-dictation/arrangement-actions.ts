"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

import { encodeStored, sanitizeArrangement } from "./arrange";
import {
  VIDEO_ARRANGEMENT_CACHE_TAG,
  getVideoArrangement,
  isMissingTable,
} from "./arrangement-store";
import { getVideoLessons } from "./content";
import { videoStrings } from "./strings";

const strings = videoStrings(null);

/** Every page that lists the videos or follows their order must not serve the old arrangement. */
function refreshPages(): void {
  revalidateTag(VIDEO_ARRANGEMENT_CACHE_TAG);
  revalidatePath("/learn/video");
  revalidatePath("/learn/video/[id]", "page");
}

/**
 * Saves the arrangement of the Video library from the Admin's arrange mode: the sections in the order
 * he chose, each with its videos in the order he chose, and the videos he deleted (`removed`: listed
 * for nobody, still in the code, restorable). Everything arrives as client input (a Server
 * Action is reachable as a direct POST), so it is checked here again: the shape must be a list of
 * sections with a known kind each (once), the ids must be known videos (one removed since is dropped).
 * Admin-only here and again by row-level security; the change goes to the audit log (how many, and
 * which videos were deleted: their ids are public slugs, never learner data).
 */
export async function saveVideoArrangementAction(input: unknown): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: strings.arrangeNotAllowed };
  if (!isServiceRoleConfigured()) return { error: strings.arrangeFailed };

  const arrangement = sanitizeArrangement(
    input,
    new Set(getVideoLessons().map((lesson) => lesson.id)),
  );
  if (!arrangement) return { error: strings.arrangeInvalid };

  const user = await getCurrentUser();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("video_arrangement").upsert(
    {
      id: "library",
      sections: encodeStored(arrangement),
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) {
    console.error("[video] saveVideoArrangementAction failed", error);
    return { error: isMissingTable(error) ? strings.arrangeNoTable : strings.arrangeFailed };
  }

  void logAdminAction("video.arranged", "video_arrangement", "library", {
    sections: arrangement.sections.length,
    videos: arrangement.sections.reduce((total, section) => total + section.ids.length, 0),
    removed: arrangement.removed ?? [],
  });
  refreshPages();
  return { success: strings.arrangeSaved };
}

/**
 * Puts the library back to the default order (comedy first, easiest first). The videos an Admin deleted
 * stay deleted (the row keeps only them); with none deleted the saved row goes away. Admin-only.
 */
export async function resetVideoArrangementAction(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: strings.arrangeNotAllowed };
  if (!isServiceRoleConfigured()) return { error: strings.arrangeFailed };

  const supabase = createServiceRoleClient();
  const removed = (await getVideoArrangement({ fresh: true }))?.removed ?? [];
  const user = await getCurrentUser();
  const { error } =
    removed.length > 0
      ? await supabase.from("video_arrangement").upsert(
          {
            id: "library",
            sections: encodeStored({ sections: [], removed }),
            updated_at: new Date().toISOString(),
            updated_by: user?.id ?? null,
          },
          { onConflict: "id" },
        )
      : await supabase.from("video_arrangement").delete().eq("id", "library");
  if (error) {
    console.error("[video] resetVideoArrangementAction failed", error);
    return { error: isMissingTable(error) ? strings.arrangeNoTable : strings.arrangeFailed };
  }

  void logAdminAction("video.arrangement_reset", "video_arrangement", "library");
  refreshPages();
  return { success: strings.arrangeResetDone };
}
