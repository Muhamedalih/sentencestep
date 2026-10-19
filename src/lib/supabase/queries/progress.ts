import { createClient } from "@/lib/supabase/server";
import { emptyDailyProgress } from "@/lib/progress/types";
import type { DailyProgressState, StreakState } from "@/lib/progress/types";
import type { LearningMode } from "@/types/content";

/**
 * Supabase-backed progress persistence, matching src/lib/progress/store.ts's
 * shape. Called from src/lib/progress/actions.ts (Server Actions), which
 * derive the user id from the authenticated session rather than trusting a
 * caller-supplied one — see useProgress, which branches between these and
 * the local store based on whether a session exists.
 */

interface LessonCompletionInput {
  userId: string;
  lessonId: string;
  mode: LearningMode;
  accuracy: number;
}

/**
 * Atomically upserts via the complete_lesson() RPC (see its migration doc
 * comment) — never a client read-then-write for attempt_count, and
 * is_first_completion is read back from the same statement (the standard
 * upsert "was this row just inserted" trick) rather than a separate prior
 * read, so two near-simultaneous completions of the same lesson (two open
 * tabs, a slow-network retry) can never both be treated as the first one.
 */
export async function upsertLessonCompletion({
  lessonId,
  mode,
  accuracy,
}: LessonCompletionInput): Promise<{ isFirstCompletion: boolean; attemptCount: number }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("complete_lesson", { p_lesson_id: lessonId, p_mode: mode, p_accuracy: accuracy })
    .single();

  if (error) throw error;
  return { isFirstCompletion: data.is_first_completion, attemptCount: data.attempt_count };
}

export async function fetchUserProgress(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchXp(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_xp")
    .select("xp")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.xp ?? 0;
}

export async function upsertXp(userId: string, xp: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_xp")
    .upsert(
      { user_id: userId, xp, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

/**
 * Atomically adds `delta` to the signed-in learner's XP via the
 * increment_xp() RPC (see its migration doc comment) — never a client
 * read-then-write, so two completions landing close together can never
 * clobber one another's increment. previousXp is always exactly
 * `xp - delta`, so callers that need a "before" value for level-up
 * detection (see recordCompletionAction) never need a separate read.
 */
export async function incrementXp(delta: number): Promise<{ previousXp: number; xp: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("increment_xp", { p_delta: delta }).single();
  if (error) throw error;
  return { previousXp: data.previous_xp, xp: data.xp };
}

export async function fetchDailyProgress(
  userId: string,
  todayISO: string,
): Promise<DailyProgressState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_progress")
    .select("date, sentences_completed, goal")
    .eq("user_id", userId)
    .eq("date", todayISO)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...emptyDailyProgress, date: todayISO };

  return { date: data.date, sentencesCompleted: data.sentences_completed, goal: data.goal };
}

export async function upsertDailyProgress(
  userId: string,
  progress: DailyProgressState,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("daily_progress").upsert(
    {
      user_id: userId,
      date: progress.date,
      sentences_completed: progress.sentencesCompleted,
      goal: progress.goal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" },
  );
  if (error) throw error;
}

/**
 * Atomically adds `sentencesJustCompleted` to today's tally via the
 * increment_daily_progress() RPC (see its migration doc comment) — the
 * same "never a client read-then-write" fix as incrementXp, for the same
 * reason: sentences_completed is additive, so a client-computed absolute
 * overwrite can lose a concurrent completion's contribution. A new
 * `dateISO` is naturally a fresh row (the RPC's own ON CONFLICT is keyed on
 * (user_id, date)), so there is no separate "did the day roll over" branch
 * to get right here the way the old updateDailyProgress had to.
 */
export async function incrementDailyProgress(
  dateISO: string,
  sentencesJustCompleted: number,
  defaultGoal: number,
): Promise<DailyProgressState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("increment_daily_progress", {
      p_date: dateISO,
      p_delta: sentencesJustCompleted,
      p_default_goal: defaultGoal,
    })
    .single();
  if (error) throw error;
  return { date: dateISO, sentencesCompleted: data.sentences_completed, goal: data.goal };
}

interface LessonAttemptInput {
  userId: string;
  lessonId: string;
  mode: LearningMode;
  accuracy: number;
  wpm: number;
}

/** Append-only — the Phase 11 adaptive-difficulty foundation, and the first place WPM is ever persisted (see src/hooks/use-typing-engine.ts, which previously only computed it live). */
export async function insertLessonAttempt({
  userId,
  lessonId,
  mode,
  accuracy,
  wpm,
}: LessonAttemptInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("lesson_attempts").insert({
    user_id: userId,
    lesson_id: lessonId,
    mode,
    accuracy,
    wpm,
  });
  if (error) throw error;
}

/**
 * Total learning sessions for the Home page's stats row (see
 * src/components/app/home-hero.tsx) — one row per lesson attempt in
 * lesson_attempts (see insertLessonAttempt above), so this is a plain
 * row count rather than a second counter: `head: true` skips returning any
 * rows, so this is a single cheap count-only query, not a real data fetch.
 */
export async function fetchAttemptCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("lesson_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchStreak(userId: string): Promise<StreakState | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActiveDate: data.last_active_date,
  };
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
