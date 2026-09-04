import { createClient } from "@/lib/supabase/server";
import type { LearningMode } from "@/types/content";

/** Signed-in-only reads/writes for `mistakes` — always the session-aware server client, since RLS scopes every row to auth.uid() = user_id. */

export async function fetchActiveMistakeCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("mistakes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw error;
  return count ?? 0;
}

/**
 * How many corrected words are due for a spaced review right now — added to
 * fetchActiveMistakeCount's count so LessonCompletion's "Fix Your Mistakes"
 * CTA also accounts for reviews, the only entry point into that flow (see
 * fetchDueReviewRows for the equivalent hydrated-row read).
 */
export async function fetchDueReviewCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("mistakes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "corrected")
    .not("next_review_at", "is", null)
    .lte("next_review_at", new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}

/**
 * Atomic upsert via the record_mistake() function (see its migration doc
 * comment for why this can't be a plain client-side upsert: incrementing
 * mistake_count safely needs a single `... DO UPDATE SET x = x + 1`, which
 * only a real SQL statement can express race-free). auth.uid() is read
 * inside the function itself, never trusted from the caller. `errorIndexes`
 * are every word-relative position of a wrong keystroke that produced this
 * mistake (see mistakes.error_indexes) — an empty/omitted array is treated
 * the same as "keep whatever was there" by the function itself.
 */
export async function recordMistake(
  word: string,
  sentenceId: string,
  errorIndexes: number[] = [],
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_mistake", {
    p_word: word,
    p_sentence_id: sentenceId,
    p_error_indexes: errorIndexes,
  });
  if (error) throw error;
}

export interface WeakCandidateMistakeRow {
  word: string;
  status: "active" | "corrected";
  reviewStage: number;
  nextReviewAt: string | null;
}

/**
 * Every mistake row that could possibly be "weak" (see isWeakWord in
 * src/lib/weak-words/types.ts) — active mistakes, plus corrected words still
 * carrying a scheduled review. A mastered word (corrected, next_review_at
 * null) is excluded here at the query level since isWeakWord can never
 * return true for one; the finer review_stage cutoff is applied in JS by
 * the caller rather than here, so that threshold stays in one place. This
 * set is small by construction — the same "tens of rows per learner" scale
 * fetchActiveMistakeRows already relies on — so filtering the rest in JS
 * costs nothing meaningful.
 */
export async function fetchWeakCandidateMistakeRows(
  userId: string,
): Promise<WeakCandidateMistakeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mistakes")
    .select("word, status, review_stage, next_review_at")
    .eq("user_id", userId)
    .or("status.eq.active,next_review_at.not.is.null");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    word: row.word,
    status: row.status,
    reviewStage: row.review_stage,
    nextReviewAt: row.next_review_at,
  }));
}

export interface ActiveMistakeRow {
  word: string;
  sentenceId: string;
  errorIndexes: number[];
}

export async function fetchActiveMistakeRows(userId: string): Promise<ActiveMistakeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mistakes")
    .select("word, sentence_id, error_indexes")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    word: row.word,
    sentenceId: row.sentence_id,
    errorIndexes: row.error_indexes ?? [],
  }));
}

/** Same shape as fetchActiveMistakeRows, for corrected words whose scheduled review is now due (see the mistake_review_scheduling migration). */
export async function fetchDueReviewRows(userId: string): Promise<ActiveMistakeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mistakes")
    .select("word, sentence_id, error_indexes")
    .eq("user_id", userId)
    .eq("status", "corrected")
    .not("next_review_at", "is", null)
    .lte("next_review_at", new Date().toISOString());
  if (error) throw error;
  return (data ?? []).map((row) => ({
    word: row.word,
    sentenceId: row.sentence_id,
    errorIndexes: row.error_indexes ?? [],
  }));
}

export interface MistakeSentenceRow {
  id: string;
  en: string;
  ar: string;
  lessonId: string;
  wordTranslations: { en: string; ar: string }[] | null;
}

/**
 * Deliberately a flat `id in (...)` lookup, not a nested Supabase embed
 * (`sentences(lessons(...))`) — the hand-maintained Database type (see
 * src/types/database.ts; there's no Supabase CLI codegen in this project)
 * declares no FK Relationships for the new `mistakes` table, so a nested
 * embed would need an unsafe cast. Three flat, fully-typed queries reading
 * a small (tens-of-rows) mistake queue costs nothing meaningful in
 * exchange. RLS on `sentences` is premium-gated (see the content-redesign
 * migration) — a sentence the caller can no longer access (e.g. a lapsed
 * subscription) simply doesn't come back here, which fetchMistakesAction
 * treats as "drop this mistake from the queue" rather than an error.
 */
export async function fetchSentencesByIds(sentenceIds: string[]): Promise<MistakeSentenceRow[]> {
  if (sentenceIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sentences")
    .select("id, en, ar, lesson_id, word_translations")
    .in("id", sentenceIds);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    en: row.en,
    ar: row.ar,
    lessonId: row.lesson_id,
    wordTranslations: row.word_translations,
  }));
}

export interface MistakeLessonRow {
  id: string;
  mode: LearningMode;
  orderIndex: number;
}

export async function fetchLessonsByIds(lessonIds: string[]): Promise<MistakeLessonRow[]> {
  if (lessonIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, mode, order_index")
    .in("id", lessonIds);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, mode: row.mode, orderIndex: row.order_index }));
}

/**
 * First review interval, in days — mirrors v_schedule[1] in
 * record_mistake_review's migration (kept in sync by that function's own
 * doc comment, since SQL and TS can't share one literal). This is the only
 * schedule value a plain client-side update needs: seeding review_stage=1
 * here has no prior row value to read, unlike every later advance/reset,
 * which record_mistake_review computes atomically in the database instead.
 */
const FIRST_REVIEW_INTERVAL_DAYS = 1;

export async function markMistakeCorrected(userId: string, word: string): Promise<void> {
  const supabase = await createClient();
  const now = new Date();
  const { error } = await supabase
    .from("mistakes")
    .update({
      status: "corrected",
      corrected_at: now.toISOString(),
      review_stage: 1,
      next_review_at: new Date(
        now.getTime() + FIRST_REVIEW_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .eq("word", word)
    .eq("status", "active");
  if (error) throw error;
}

/**
 * Advances or resets one word's review schedule via the atomic
 * record_mistake_review() RPC (see its migration doc comment) — never a
 * client read-then-write, and safe to call again for the same word: once
 * the DB-side guard (`next_review_at <= now()`) no longer matches, a
 * duplicate/replayed call is a no-op.
 */
export async function recordMistakeReview(word: string, hadErrors: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_mistake_review", {
    p_word: word,
    p_had_errors: hadErrors,
  });
  if (error) throw error;
}
