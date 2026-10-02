import { createClient } from "@/lib/supabase/server";
import type { MasteryState, WordOutcome } from "@/lib/word-mastery/schedule";

/**
 * Reads and writes of `word_mastery` (see 20250323000000_word_mastery.sql) —
 * the per-learner strength and due day of every Word Lists word the learner has
 * practiced. Session-aware client throughout: RLS is what limits every call to
 * the learner's own rows, so none of these takes a user id it would have to be
 * trusted with (the id passed to the read is only a filter, RLS is the boundary).
 *
 * Every caller treats a failure as "no schedule yet" (the table may not exist
 * on a project that has not applied the migration): a missing optional feature
 * must never take a learner page down.
 */

/**
 * Every mastery row the learner has, as a map by word id. One small read: a
 * learner has at most a few hundred rows (the whole catalog is a few hundred
 * words), so there is no per-group or paged variant to maintain.
 */
export async function fetchMasteryStates(userId: string): Promise<Map<string, MasteryState>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("word_mastery")
    .select("word_id, strength, due_on")
    .eq("user_id", userId);
  if (error) throw error;
  return new Map(
    (data ?? []).map((row) => [row.word_id, { strength: row.strength, dueOn: row.due_on }]),
  );
}

export interface RecordedReview {
  strength: number;
  dueOn: string;
  /** The word moved up a step with this visit. */
  advanced: boolean;
}

/**
 * Records one practice visit through the atomic record_word_review() function
 * (see its migration comment for the rules): never a client read-then-write, so
 * two tabs can never compute from the same stale strength. Returns where the
 * word stands afterwards, or null when the function answered with nothing.
 */
export async function recordWordReview(
  wordId: string,
  outcome: WordOutcome,
  todayISO: string,
): Promise<RecordedReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_word_review", {
    p_word_id: wordId,
    p_outcome: outcome,
    p_today: todayISO,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return { strength: row.out_strength, dueOn: row.out_due_on, advanced: row.out_advanced };
}
