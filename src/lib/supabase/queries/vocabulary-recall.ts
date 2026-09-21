import { createClient } from "@/lib/supabase/server";
import { MAX_RECALL_SESSION_WORDS, type RecallMode } from "@/lib/vocabulary-recall/constants";

/**
 * Vocabulary Recall: signed-in-only reads/writes for `vocabulary_encounters`
 * (see that table's migration doc comment) — the spaced-repetition queue for
 * words a learner has met in Normal lessons and Stories, kept deliberately
 * separate from `mistakes` (typing errors) and Word Lists' own catalog.
 */

/**
 * `mode` scopes the count to one section (Normal or Stories) — the card
 * lives inside each mode's own lesson-list page now, not a single
 * mode-agnostic Home card, so a learner only ever sees "words from this
 * section" here, never a mixed count.
 */
export async function fetchDueVocabularyRecallCount(
  userId: string,
  mode?: RecallMode,
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("vocabulary_encounters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("next_review_at", "is", null)
    .lte("next_review_at", new Date().toISOString());
  if (mode) query = query.eq("mode", mode);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export interface DueVocabularyRecallRow {
  word: string;
  ar: string;
  lessonTitle: string;
  /** Real `sentences.id` this word came from — see recordVocabularyEncounter's doc comment for why this rides along instead of just the sentence_en snapshot. */
  sentenceId: string;
  sentenceEn: string;
  wordIndex: number;
  createdAt: string;
}

/**
 * Oldest-due first, capped at MAX_RECALL_SESSION_WORDS — a review visit is
 * always a short queue, never the learner's entire backlog at once. `mode`
 * scopes the queue to one section, same reasoning as
 * fetchDueVocabularyRecallCount.
 */
export async function fetchDueVocabularyRecallRows(
  userId: string,
  mode?: RecallMode,
): Promise<DueVocabularyRecallRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("vocabulary_encounters")
    .select("word, ar, lesson_title, sentence_id, sentence_en, word_index, created_at")
    .eq("user_id", userId)
    .not("next_review_at", "is", null)
    .lte("next_review_at", new Date().toISOString());
  if (mode) query = query.eq("mode", mode);
  const { data, error } = await query
    .order("next_review_at", { ascending: true })
    .limit(MAX_RECALL_SESSION_WORDS);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    word: row.word,
    ar: row.ar,
    lessonTitle: row.lesson_title,
    sentenceId: row.sentence_id,
    sentenceEn: row.sentence_en,
    wordIndex: row.word_index,
    createdAt: row.created_at,
  }));
}

export interface VocabularyEncounterInput {
  word: string;
  ar: string;
  mode: RecallMode;
  lessonId: string;
  lessonTitle: string;
  sentenceId: string;
  sentenceEn: string;
  wordIndex: number;
}

/**
 * Atomic upsert via record_vocabulary_encounter() (see its migration doc
 * comment for why "first encounter wins" needs a real ON CONFLICT DO NOTHING
 * rather than a client read-then-write). Silently a no-op for a word this
 * learner already has a row for — that's the intended behavior, not an
 * error, so callers never need to check for it.
 *
 * `sentenceId` is kept alongside the `sentenceEn` snapshot specifically so
 * the review screen can resolve real, synthesized pronunciation for this
 * word through the same "sentence_word" isolated-word pipeline Fix Your
 * Mistakes already relies on (see resolvePronunciationAudioAction) — that
 * pipeline re-derives the word from the real `sentences` row server-side
 * rather than trusting arbitrary client text, so a live sentence id is
 * required, not just the word/sentence text.
 */
export async function recordVocabularyEncounter(input: VocabularyEncounterInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_vocabulary_encounter", {
    p_word: input.word,
    p_ar: input.ar,
    p_mode: input.mode,
    p_lesson_id: input.lessonId,
    p_lesson_title: input.lessonTitle,
    p_sentence_id: input.sentenceId,
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
