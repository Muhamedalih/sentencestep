"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { sanitizeFeatureConfig } from "@/lib/features/config";
import type { FeatureConfig } from "@/lib/features/config";
import { PASSAGES_CACHE_TAG } from "@/lib/passages/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Saves the whole feature-availability document from /admin/features. The
 * submitted object is re-sanitized here — a Server Action is reachable as a
 * direct POST, so the form's own validation is a convenience, never the
 * boundary — and the write is admin-only both here (requireAdmin) and in RLS
 * ("Admins manage feature settings").
 */
export async function saveFeatureConfig(input: FeatureConfig): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const config = sanitizeFeatureConfig(input);
  const supabase = await createClient();

  // `.select("id")` so a write that matched no row (RLS refusing a session that is not
  // really an admin updates nothing and raises no error) is reported, not mistaken for a save.
  const { data: updated, error } = await supabase
    .from("feature_settings")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("id");

  if (error || !updated || updated.length === 0) {
    return { error: "Couldn't save the feature settings. Please try again." };
  }

  void logAdminAction("feature_settings.updated", "feature_settings", null, {
    states: Object.fromEntries(
      Object.entries(config.features).map(([id, entry]) => [id, entry.state]),
    ),
  });
  // The share-cached settings read (see readFeatureConfigRow) must not serve the old document.
  revalidateTag("feature-settings");
  // Passages' share-cached reads follow the switch — refresh them with it.
  revalidateTag(PASSAGES_CACHE_TAG);
  // "layout" so every /learn/* route's cached client payload picks up the new
  // availability immediately, same reasoning as setFreeForAll.
  revalidatePath("/learn", "layout");
  revalidatePath("/admin/features");
  return { success: "Feature settings saved." };
}
