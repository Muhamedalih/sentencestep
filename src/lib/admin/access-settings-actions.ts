"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";

/**
 * The single admin control for the sitewide "everything is free" promotion
 * (see 20250228000000_free_for_all_access.sql and access-settings-queries.ts).
 * Flipping this is the entire on/off switch — no subscriptions row is ever
 * touched, so turning it back off restores every learner's real plan
 * exactly as getAccessState() would have computed it without this feature.
 */
export async function setFreeForAll(enabled: boolean): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("access_settings")
    .update({ free_for_all: enabled, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: "Couldn't save that. Please try again." };

  void logAdminAction("access_settings.free_for_all_updated", "access_settings", null, {
    enabled,
  });
  revalidatePath("/admin/free-access");
  revalidatePath("/learn");
  revalidatePath("/upgrade");
  return {
    success: enabled
      ? "Everything is free — subscriptions are suspended."
      : "Subscriptions restored — premium content is locked again.",
  };
}
