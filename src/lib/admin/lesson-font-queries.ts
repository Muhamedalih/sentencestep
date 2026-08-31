import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_LESSON_FONT_SETTINGS,
  sanitizeLessonFontSettings,
} from "@/lib/admin/lesson-font-settings";
import type { LessonFontSettings } from "@/lib/admin/lesson-font-settings";

/**
 * Reads the one admin-configured lesson font settings row. Called both from
 * the admin Fonts page (to seed the form) and from src/app/learn/layout.tsx
 * (to hand the same overrides to every learner's LessonFontSettingsProvider)
 * — same read, same sanitize, so an unconfigured project renders each
 * section's original font in both places.
 */
export async function getLessonFontSettings(): Promise<LessonFontSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_LESSON_FONT_SETTINGS;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lesson_font_settings")
    .select("fonts")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data || typeof data.fonts !== "object" || data.fonts === null) {
    return DEFAULT_LESSON_FONT_SETTINGS;
  }

  return sanitizeLessonFontSettings(data.fonts);
}
