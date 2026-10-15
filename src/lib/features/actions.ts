"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { sanitizeFeatureConfig } from "@/lib/features/config";
import type { FeatureConfig } from "@/lib/features/config";
import { syncPassageWordGroups } from "@/lib/passages/publish";
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

  // Where the Passages switch stood before this save — the word lessons made
  // from the passages only change when it does (see syncPassageWordGroups), so a
  // save that touches some other feature never republishes a lesson an admin
  // hid by hand.
  const { data: previousRow } = await supabase
    .from("feature_settings")
    .select("config")
    .eq("id", 1)
    .maybeSingle();
  const previousPassagesState = sanitizeFeatureConfig(previousRow?.config).features.passages.state;

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

  // The settings are saved; a failure keeping the word lessons in step is reported, not fatal.
  const passagesWarning =
    config.features.passages.state !== previousPassagesState ? await syncPassageWordGroups() : null;

  void logAdminAction("feature_settings.updated", "feature_settings", null, {
    states: Object.fromEntries(
      Object.entries(config.features).map(([id, entry]) => [id, entry.state]),
    ),
  });
  // The share-cached settings read (see readFeatureConfigRow) must not serve the old document.
  revalidateTag("feature-settings");
  // Passages' share-cached reads carry the word lesson's status — refresh them with the switch.
  revalidateTag(PASSAGES_CACHE_TAG);
  // "layout" so every /learn/* route's cached client payload picks up the new
  // availability immediately, same reasoning as setFreeForAll.
  revalidatePath("/learn", "layout");
  revalidatePath("/admin/features");
  return {
    success: passagesWarning
      ? `Feature settings saved. ${passagesWarning}`
      : "Feature settings saved.",
  };
}
