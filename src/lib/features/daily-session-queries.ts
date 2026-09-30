import { createClient } from "@/lib/supabase/server";

/** Persistence for the daily session's once-a-day completion (see 20250320000000_daily_sessions.sql). Throws on a database error. */

export async function fetchDailySessionDone(userId: string, dateISO: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .eq("session_date", dateISO)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Records today's completion and grants the XP atomically; true only for the first completion of the day. */
export async function completeDailySession(dateISO: string, xp: number): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_daily_session", {
    p_date: dateISO,
    p_xp: xp,
  });
  if (error) throw error;
  return data === true;
}
