import { createClient } from "@/lib/supabase/server";
import { DEFAULT_DAILY_GOAL } from "@/lib/progress/types";

/** This learner's chosen avatar sticker id, or null if never chosen — see src/lib/avatars.ts for the curated set and default fallback. */
export async function fetchProfileAvatarId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.avatar_id ?? null;
}

/** This learner's own daily sentence-count target — see src/lib/progress/daily-goal.ts. Falls back to DEFAULT_DAILY_GOAL only if the row itself is somehow missing (the profiles row always exists for a real signed-in user via handle_new_user). */
export async function fetchProfileDailyGoal(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("daily_goal")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.daily_goal ?? DEFAULT_DAILY_GOAL;
}

/** Null = never asked (see StartingLevelOnboarding), 0 = asked and skipped, a positive integer = the chosen tier level. */
export async function fetchProfileStartingLevel(userId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("starting_level")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.starting_level ?? null;
}

/** The profile row's own created_at — set once at signup by the handle_new_user trigger, used as "member since" on the Settings account section. */
export async function fetchProfileCreatedAt(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.created_at ?? null;
}
