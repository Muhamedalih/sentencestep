"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { sanitizeLessonColorSettings } from "@/lib/admin/lesson-color-settings";
import type { LessonColorSettings } from "@/lib/admin/lesson-color-settings";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "You don't have permission to do that.";
  return null;
}

/**
 * Persists the admin's Lesson Player color overrides as the one row every
 * learner's lesson player reads back through getLessonColorSettings(). Input
 * is re-sanitized server-side (never trusted as-is from the client) using
 * the exact same hex validation the reader applies, so a bad payload can
 * never produce a broken or unsafe stored value — only a strict 6-digit hex
 * color per known role ever reaches the database.
 */
export async function saveLessonColorSettings(input: LessonColorSettings): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const clean = sanitizeLessonColorSettings(input);

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_color_settings")
    .update({
      colors: clean as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: "Couldn't save the color settings. Please try again." };

  void logAdminAction("color_settings.updated", "lesson_color_settings", null);
  revalidatePath("/admin/color-settings");
  revalidatePath("/learn");
  return { success: "Color settings saved." };
}

/** Resets every role back to its code-level default (an empty override object), for the admin's "Reset all to default" action. */
export async function resetLessonColorSettings(): Promise<ActionResult> {
  return saveLessonColorSettings({});
}
