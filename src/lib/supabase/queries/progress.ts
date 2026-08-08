import { createClient } from "@/lib/supabase/server";
import type { LearningMode } from "@/types/content";

/**
 * Supabase-backed progress persistence, matching src/lib/progress/store.ts's
 * shape. Not called anywhere yet — there's no auth flow to supply a real
 * user id. Once auth exists, branch src/hooks/use-progress.ts on session
 * presence and call these instead of the local store.
 */

interface LessonCompletionInput {
  userId: string;
  lessonId: string;
  mode: LearningMode;
  accuracy: number;
}

export async function upsertLessonCompletion({
  userId,
  lessonId,
  mode,
  accuracy,
}: LessonCompletionInput): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_progress")
    .select("attempt_count")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      mode,
      accuracy,
      completed_at: new Date().toISOString(),
      attempt_count: (existing?.attempt_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) throw error;
}

export async function fetchUserProgress(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

interface StreakInput {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export async function upsertStreak(userId: string, streak: StreakInput): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("streaks").upsert(
    {
      user_id: userId,
      current_streak: streak.currentStreak,
      longest_streak: streak.longestStreak,
      last_active_date: streak.lastActiveDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}
