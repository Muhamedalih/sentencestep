import { createClient } from "@/lib/supabase/server";

/** Signed-in-only reads/writes for word_progress — always the session-aware server client, since RLS scopes every row to auth.uid() = user_id. */

export async function fetchWordProgress(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("word_progress")
    .select("word_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.word_id);
}

export async function upsertWordCompletion(userId: string, wordId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("word_progress").upsert(
    {
      user_id: userId,
      word_id: wordId,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,word_id" },
  );
  if (error) throw error;
}

/**
 * Every completed word with the moment it was FIRST completed. `created_at`,
 * not `completed_at`: the upsert above moves completed_at on every re-typing,
 * so only created_at says "this word was new on that day" (Home's plan).
 */
export async function fetchWordProgressDated(
  userId: string,
): Promise<{ wordId: string; firstAt: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("word_progress")
    .select("word_id, created_at")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => ({ wordId: row.word_id, firstAt: row.created_at }));
}
