"use server";

import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { knownVideoIds, recordVideoFinish } from "@/lib/supabase/queries/video-finishes";
import { parseVideoFinishId } from "@/lib/video-dictation/finishes";

/**
 * Records that the signed-in learner reached the finish screen of a video, for the «videos finished»
 * number of Home's achievements panel. The id arrives from the browser, so it is checked against the
 * library, and the "homeCards" permission must be open for the caller (a Server Action is reachable as
 * a direct POST, and nothing is written for anyone the panel is not open to yet). Best-effort: it never
 * throws into the finish screen, and on a project without the table it records nothing.
 */
export async function recordVideoFinishAction(videoId: unknown): Promise<{ ok: boolean }> {
  try {
    const id = parseVideoFinishId(videoId, knownVideoIds());
    if (!id) return { ok: false };
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.homeCards || !user) return { ok: false };
    return { ok: await recordVideoFinish(user.id, id) };
  } catch (error) {
    console.error("[video-finishes] recordVideoFinishAction failed", error);
    return { ok: false };
  }
}
