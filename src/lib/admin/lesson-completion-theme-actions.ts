"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import {
  DEFAULT_LESSON_COMPLETION_THEME,
  sanitizeLessonCompletionTheme,
} from "@/lib/admin/lesson-completion-theme";
import type { LessonCompletionTheme } from "@/lib/admin/lesson-completion-theme";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "You don't have permission to do that.";
  return null;
}

/**
 * Persists the admin's Lesson Completion theme as the one row every
 * learner's LessonCompletionThemeProvider reads back through
 * getLessonCompletionTheme(). Input is re-sanitized server-side (never
 * trusted as-is from the client) using the exact same clamping the reader
 * applies, so a bad payload can never produce a broken stored theme.
 */
export async function saveLessonCompletionTheme(
  input: LessonCompletionTheme,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const clean = sanitizeLessonCompletionTheme(input);

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_completion_theme")
    .update({
      theme: clean as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: "Couldn't save the lesson completion theme. Please try again." };

  void logAdminAction("lesson_completion_theme.updated", "lesson_completion_theme", null);
  revalidatePath("/admin/lesson-completion");
  revalidatePath("/learn");
  return { success: "Lesson completion theme saved." };
}

/** Resets the stored theme back to an empty override (i.e. the code-level defaults), for the admin's "Reset to default" action. */
export async function resetLessonCompletionTheme(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_completion_theme")
    .update({
      theme: DEFAULT_LESSON_COMPLETION_THEME as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: "Couldn't reset the lesson completion theme. Please try again." };

  void logAdminAction("lesson_completion_theme.reset", "lesson_completion_theme", null);
  revalidatePath("/admin/lesson-completion");
  revalidatePath("/learn");
  return { success: "Lesson completion theme reset to default." };
}
