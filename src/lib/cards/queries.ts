import { createClient } from "@/lib/supabase/server";

/**
 * Persistence for personal word cards (see 20250319000000_saved_words.sql).
 * Session-aware client throughout: RLS scopes every row to its owner, and each
 * caller has already derived the user id from the session.
 */

export interface SavedCard {
  word: string;
  meaning: string;
  mode: "normal" | "stories";
  lessonId: string;
  lessonTitle: string;
  sentenceId: string | null;
  sentenceEn: string;
  wordIndex: number;
  reviewStage: number;
  nextReviewAt: string | null;
  createdAt: string;
}

const COLUMNS =
  "word, meaning, mode, lesson_id, lesson_title, sentence_id, sentence_en, word_index, review_stage, next_review_at, created_at";

interface CardRow {
  word: string;
  meaning: string;
  mode: "normal" | "stories";
  lesson_id: string;
  lesson_title: string;
  sentence_id: string | null;
  sentence_en: string;
  word_index: number;
  review_stage: number;
  next_review_at: string | null;
  created_at: string;
}

function toCard(row: CardRow): SavedCard {
  return {
    word: row.word,
    meaning: row.meaning,
    mode: row.mode,
    lessonId: row.lesson_id,
    lessonTitle: row.lesson_title,
    sentenceId: row.sentence_id,
    sentenceEn: row.sentence_en,
    wordIndex: row.word_index,
    reviewStage: row.review_stage,
    nextReviewAt: row.next_review_at,
    createdAt: row.created_at,
  };
}

/** Every card the learner has saved, newest first. */
export async function fetchSavedCards(userId: string): Promise<SavedCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_words")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toCard);
}

/** Just the saved words (normalized) — what the lesson screen needs to draw filled/unfilled stars. */
export async function fetchSavedWordSet(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("saved_words").select("word").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.word);
}

export async function fetchDueCardCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("saved_words")
    .select("word", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("next_review_at", "is", null)
    .lte("next_review_at", new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}

/** Cards to review: the due ones, oldest-due first, or (`scope: "all"`) every card, due ones first. Capped so a session stays a session. */
export async function fetchCardsForReview(
  userId: string,
  scope: "due" | "all",
  limit: number,
): Promise<SavedCard[]> {
  const supabase = await createClient();
  let query = supabase.from("saved_words").select(COLUMNS).eq("user_id", userId);
  if (scope === "due") {
    query = query.not("next_review_at", "is", null).lte("next_review_at", new Date().toISOString());
  }
  const { data, error } = await query
    .order("next_review_at", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(toCard);
}

export interface NewSavedCard {
  word: string;
  meaning: string;
  mode: "normal" | "stories";
  lessonId: string;
  lessonTitle: string;
  sentenceId: string | null;
  sentenceEn: string;
  wordIndex: number;
}

/** Saves a card; saving the same word again is a harmless no-op (the first card, and its schedule, wins). */
export async function insertSavedCard(userId: string, card: NewSavedCard): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_words").upsert(
    {
      user_id: userId,
      word: card.word,
      meaning: card.meaning,
      mode: card.mode,
      lesson_id: card.lessonId,
      lesson_title: card.lessonTitle,
      sentence_id: card.sentenceId,
      sentence_en: card.sentenceEn,
      word_index: card.wordIndex,
    },
    { onConflict: "user_id,word", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function deleteSavedCard(userId: string, word: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_words")
    .delete()
    .eq("user_id", userId)
    .eq("word", word);
  if (error) throw error;
}

export async function recordCardReview(word: string, hadErrors: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_card_review", {
    p_word: word,
    p_had_errors: hadErrors,
  });
  if (error) throw error;
}
