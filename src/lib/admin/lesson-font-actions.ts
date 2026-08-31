"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { sanitizeLessonFontSettings } from "@/lib/admin/lesson-font-settings";
import type { LessonFontSettings } from "@/lib/admin/lesson-font-settings";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "You don't have permission to do that.";
  return null;
}

/**
 * Persists the admin's per-section font overrides as the one row every
 * learner's lesson/book/word-list/fix-mistakes screen reads back through
 * getLessonFontSettings(). Input is re-sanitized server-side (never trusted
 * as-is from the client) using the exact same validation the reader
 * applies, so a bad payload can never produce an invalid stored value.
 */
export async function saveLessonFontSettings(input: LessonFontSettings): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const clean = sanitizeLessonFontSettings(input);

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_font_settings")
    .update({
      fonts: clean as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: "Couldn't save the font settings. Please try again." };

  void logAdminAction("lesson_font_settings.updated", "lesson_font_settings", null);
  revalidatePath("/admin/lesson-fonts");
  revalidatePath("/learn");
  return { success: "Font settings saved." };
}

/** Resets every section back to its code-level default font (an empty override object), for the admin's "Reset all to default" action. */
export async function resetLessonFontSettings(): Promise<ActionResult> {
  return saveLessonFontSettings({});
}
