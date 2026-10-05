import { createClient } from "@/lib/supabase/server";
import type { StreakBridgeDay } from "@/lib/features/streak-freeze";

/**
 * Persistence for the per-day activity log and the monthly streak-freeze
 * balance (see 20250316000000_activity_and_streak_freeze.sql). Every function
 * here throws on a database error — callers on the critical lesson-completion
 * path (recordCompletionAction) wrap them so a missing migration or a hiccup
 * degrades to "no calendar / no freezes", never a failed completion.
 */

export interface ActivityDay {
  day: string;
  kind: "active" | "grace" | "frozen";
  sentences: number;
}

export async function recordActivityDay(day: string, sentences: number, xp: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_activity_day", {
    p_day: day,
    p_sentences: sentences,
    p_xp: xp,
  });
  if (error) throw error;
}

export async function recordStreakBridgeDays(bridges: StreakBridgeDay[]): Promise<void> {
  if (bridges.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_streak_bridge_days", {
    p_days: bridges.map((bridge) => bridge.day),
    p_kinds: bridges.map((bridge) => bridge.kind),
  });
  if (error) throw error;
}

export async function fetchFreezeUsage(
  userId: string,
): Promise<{ period: string; used: number } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("streak_freeze_usage")
    .select("period, used")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Atomically spends `count` freezes; returns how many were spent (0 when the balance couldn't cover it). */
export async function consumeStreakFreezes(
  period: string,
  count: number,
  monthlyAllowance: number,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_streak_freezes", {
    p_period: period,
    p_count: count,
    p_monthly: monthlyAllowance,
  });
  if (error) throw error;
  return data ?? 0;
}

export async function fetchActivityRange(
  userId: string,
  fromISO: string,
  toISO: string,
): Promise<ActivityDay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_days")
    .select("day, kind, sentences")
    .eq("user_id", userId)
    .gte("day", fromISO)
    .lte("day", toISO)
    .order("day", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ day: row.day, kind: row.kind, sentences: row.sentences }));
}
