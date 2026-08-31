import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_LESSON_COLOR_SETTINGS,
  sanitizeLessonColorSettings,
} from "@/lib/admin/lesson-color-settings";
import type { LessonColorSettings } from "@/lib/admin/lesson-color-settings";

/**
 * Reads the one admin-configured lesson color settings row. Called both from
 * the admin Color Settings page (to seed the customizer) and from
 * src/app/learn/layout.tsx (to build the <style> override every learner's
 * lesson player gets) — same read, same sanitize, so an unconfigured project
 * renders the original design in both places.
 */
export async function getLessonColorSettings(): Promise<LessonColorSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_LESSON_COLOR_SETTINGS;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lesson_color_settings")
    .select("colors")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data || typeof data.colors !== "object" || data.colors === null) {
    return DEFAULT_LESSON_COLOR_SETTINGS;
  }

  return sanitizeLessonColorSettings(data.colors);
}
