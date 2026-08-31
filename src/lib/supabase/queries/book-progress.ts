import { createClient } from "@/lib/supabase/server";

/**
 * Signed-in-only reads/writes for book_progress — always the session-aware
 * server client, since RLS scopes every row to auth.uid() = user_id (same
 * convention as word-progress.ts). completeBookSentence is the one write
 * path, a thin wrapper around the complete_book_sentence Postgres function —
 * see that function's own doc comment in
 * supabase/migrations/20250128000000_book_learning_engine.sql for why the
 * atomic advance-and-guard logic lives there rather than here: a client-side
 * read-then-upsert can't make the +1 increment and the duplicate-completion
 * guard atomic under a real race, a single SQL statement can.
 */

export interface BookProgressRow {
  completedSentenceCount: number;
  currentSectionId: string | null;
  currentSentenceId: string | null;
  lastReadAt: string;
}

/** This learner's raw progress on one book, or null if they've never completed a sentence in it. */
export async function fetchBookProgressRow(
  userId: string,
  bookId: string,
): Promise<BookProgressRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_progress")
    .select("completed_sentence_count, current_section_id, current_sentence_id, last_read_at")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    completedSentenceCount: data.completed_sentence_count,
    currentSectionId: data.current_section_id,
    currentSentenceId: data.current_sentence_id,
    lastReadAt: data.last_read_at,
  };
}

export interface InProgressBook {
  bookId: string;
  completedSentenceCount: number;
}

/**
 * Every book this learner has started but not finished, most-recently-read
 * first — the Library's Continue Reading source (see fetchContinueReadingBooks
 * in queries/library.ts, which joins this against real book/sentence-count
 * data to compute a genuine percentage). `current_sentence_id is not null`
 * is exactly "not finished": complete_book_sentence sets it null only once
 * the book's last sentence is completed, so a fully-read book naturally
 * drops out of Continue Reading — nothing left to continue.
 */
export async function fetchInProgressBooks(userId: string): Promise<InProgressBook[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_progress")
    .select("book_id, completed_sentence_count")
    .eq("user_id", userId)
    .not("current_sentence_id", "is", null)
    .order("last_read_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    bookId: row.book_id,
    completedSentenceCount: row.completed_sentence_count,
  }));
}

export interface CompleteBookSentenceResult {
  completedSentenceCount: number;
  currentSectionId: string | null;
  currentSentenceId: string | null;
  /** False when this call was a no-op — the reader had already advanced past this sentence (a duplicate/replayed request). See the RPC's own doc comment. */
  advanced: boolean;
}

/** Atomically advances the signed-in learner past one sentence. Throws if sentenceId isn't actually part of bookId — see the RPC's own validation. */
export async function completeBookSentence(
  bookId: string,
  sentenceId: string,
): Promise<CompleteBookSentenceResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_book_sentence", {
    p_book_id: bookId,
    p_sentence_id: sentenceId,
  });
  if (error) throw error;

  const row = data?.[0];
  if (!row) throw new Error("complete_book_sentence returned no row");

  return {
    completedSentenceCount: row.out_completed_sentence_count,
    currentSectionId: row.out_current_section_id,
    currentSentenceId: row.out_current_sentence_id,
    advanced: row.out_advanced,
  };
}
