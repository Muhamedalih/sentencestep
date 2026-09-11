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
 * the same as "keep whatever was there" by the function itself. `sentenceId`
 * is null for a mistake with no owning lesson sentence (Word Lists practice
 * — see recordWordListMistakeAction in mistakes/actions.ts); every
 * sentence-scoped reader already treats an unresolvable sentence as "drop
 * this row" (see fetchMistakesAction), so a null one is simply never picked
 * up there while still counting toward "Review All Words".
 */
export async function recordMistake(
  word: string,
  sentenceId: string | null,
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
  /** Null for a Word-List-originated mistake — see recordMistake's doc comment. */
  sentenceId: string | null;
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

/**
 * Fully clears a word out of "weak" (see isWeakWord) in one step, no matter
 * which state its mistakes row is currently in — active, or corrected with
 * a schedule still below WEAK_WORD_REVIEW_STAGE_THRESHOLD. Used only when
 * ordinary Word Lists practice (never the dedicated Review/Fix-Your-Mistakes
 * queues) is the one reporting the correct answer.
 *
 * This is deliberately NOT the same one-stage-at-a-time advance those two
 * queues use (markMistakeCorrected / recordMistakeReview): that gradual
 * schedule is real spaced repetition, and staying at review_stage 1 or 2
 * after just one clean pass is its whole point (see isWeakWord's doc
 * comment) — a word answered right in the dedicated Review queue is
 * SUPPOSED to still come back for another check a few days later. Ordinary
 * practice makes a strictly different promise: the learner got this word
 * right just now, so stop flagging it, full stop — jumping straight to the
 * fully-graduated state (`next_review_at: null`) is what actually delivers
 * that, since isWeakWord only ever reads review_stage when a review is
 * still scheduled at all.
 *
 * A plain update, not an RPC: this only ever runs from one learner's own
 * single in-flight request, not the concurrent-write case record_mistake's
 * atomic increment exists for. A no-op if the word was never tracked as a
 * mistake to begin with — nothing matches the filter.
 */
export async function masterMistakeWord(userId: string, word: string): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("mistakes")
    .update({
      status: "corrected",
      corrected_at: now,
      review_stage: 0,
      next_review_at: null,
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("word", word);
  if (error) throw error;
}
