import { createClient } from "@/lib/supabase/server";
import { MAX_RECALL_SESSION_WORDS } from "@/lib/vocabulary-recall/constants";
import type { LearningMode } from "@/types/content";

/**
 * Vocabulary Recall: signed-in-only reads/writes for `vocabulary_encounters`
 * (see that table's migration doc comment) — the spaced-repetition queue for
 * words a learner has met in Normal lessons and Stories, kept deliberately
 * separate from `mistakes` (typing errors) and Word Lists' own catalog.
 */

export async function fetchDueVocabularyRecallCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("vocabulary_encounters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("next_review_at", "is", null)
    .lte("next_review_at", new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}

export interface DueVocabularyRecallRow {
  word: string;
  ar: string;
  lessonTitle: string;
  sentenceEn: string;
  wordIndex: number;
  createdAt: string;
}

/** Oldest-due first, capped at MAX_RECALL_SESSION_WORDS — a review visit is always a short queue, never the learner's entire backlog at once. */
export async function fetchDueVocabularyRecallRows(
  userId: string,
): Promise<DueVocabularyRecallRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vocabulary_encounters")
    .select("word, ar, lesson_title, sentence_en, word_index, created_at")
    .eq("user_id", userId)
    .not("next_review_at", "is", null)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(MAX_RECALL_SESSION_WORDS);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    word: row.word,
    ar: row.ar,
    lessonTitle: row.lesson_title,
    sentenceEn: row.sentence_en,
    wordIndex: row.word_index,
    createdAt: row.created_at,
  }));
}

export interface VocabularyEncounterInput {
  word: string;
  ar: string;
  mode: LearningMode;
  lessonId: string;
  lessonTitle: string;
  sentenceEn: string;
  wordIndex: number;
}

/**
 * Atomic upsert via record_vocabulary_encounter() (see its migration doc
 * comment for why "first encounter wins" needs a real ON CONFLICT DO NOTHING
 * rather than a client read-then-write). Silently a no-op for a word this
 * learner already has a row for — that's the intended behavior, not an
 * error, so callers never need to check for it.
 */
export async function recordVocabularyEncounter(input: VocabularyEncounterInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_vocabulary_encounter", {
    p_word: input.word,
    p_ar: input.ar,
    p_mode: input.mode,
    p_lesson_id: input.lessonId,
    p_lesson_title: input.lessonTitle,
    p_sentence_en: input.sentenceEn,
    p_word_index: input.wordIndex,
  });
  if (error) throw error;
}

/**
 * Advances or resets one word's review schedule via the atomic
 * record_vocabulary_review() RPC — never a client read-then-write, and safe
 * to call again for the same word (the DB-side guard makes a duplicate call
 * a no-op once the first has already pushed next_review_at into the future).
 */
export async function recordVocabularyReview(word: string, hadErrors: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_vocabulary_review", {
    p_word: word,
    p_had_errors: hadErrors,
  });
  if (error) throw error;
}
