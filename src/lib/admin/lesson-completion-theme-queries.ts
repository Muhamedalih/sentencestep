import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_LESSON_COMPLETION_THEME,
  sanitizeLessonCompletionTheme,
} from "@/lib/admin/lesson-completion-theme";
import type { LessonCompletionTheme } from "@/lib/admin/lesson-completion-theme";

/**
 * Reads the one admin-configured lesson-completion theme row, merged over
 * the code-level defaults so any field never set (or added after this row
 * was last saved) still renders correctly. Called both from the admin
 * lesson-completion page (to seed the customizer) and from
 * src/app/learn/layout.tsx (to hand the same theme to every learner's
 * LessonCompletionThemeProvider) — same read, same fallback, so an
 * unconfigured project renders the default design in both places.
 */
export async function getLessonCompletionTheme(): Promise<LessonCompletionTheme> {
  if (!isSupabaseConfigured()) return DEFAULT_LESSON_COMPLETION_THEME;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lesson_completion_theme")
    .select("theme")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data || typeof data.theme !== "object" || data.theme === null) {
    return DEFAULT_LESSON_COMPLETION_THEME;
  }

  return sanitizeLessonCompletionTheme(
    data.theme as Partial<Record<keyof LessonCompletionTheme, unknown>>,
  );
}
