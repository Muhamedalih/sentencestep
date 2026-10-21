import { createClient } from "@/lib/supabase/server";

/**
 * The learner's own days with a finished Today session (daily_sessions, see
 * 20250320000000_daily_sessions.sql), from `fromISO` on — what lights a day's dot on Today next to
 * their finished lessons. RLS limits the rows to the signed-in learner. Throws on a database error.
 */
export async function fetchSessionDatesSince(userId: string, fromISO: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .gte("session_date", fromISO);
  if (error) throw error;
  return (data ?? []).map((row) => row.session_date);
}
