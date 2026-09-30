import { createClient } from "@/lib/supabase/server";
import type { QuestType } from "@/lib/features/catalog";
import { isQuestType } from "@/lib/features/quests";
import type { DailyQuest } from "@/lib/features/quests";

/**
 * Persistence for daily quests (see 20250317000000_daily_quests.sql). Every
 * function throws on a database error; the callers on hot paths
 * (quest-progress.ts, the lesson-completion action) wrap them best-effort.
 */

export interface DealtQuestRow {
  slot: number;
  type: QuestType;
  target: number;
  xp: number;
}

export async function fetchDailyQuests(userId: string, dateISO: string): Promise<DailyQuest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_quests")
    .select("slot, quest_type, target, xp, progress, completed_at")
    .eq("user_id", userId)
    .eq("quest_date", dateISO)
    .order("slot", { ascending: true });
  if (error) throw error;
  const quests: DailyQuest[] = [];
  for (const row of data ?? []) {
    if (!isQuestType(row.quest_type)) continue;
    quests.push({
      slot: row.slot,
      type: row.quest_type,
      target: row.target,
      progress: row.progress,
      xp: row.xp,
      completed: row.completed_at !== null,
    });
  }
  return quests;
}

/** Inserts the dealt quests; a concurrent deal for the same learner and day is a harmless no-op (primary key conflict ignored). */
export async function insertDailyQuests(
  userId: string,
  dateISO: string,
  rows: DealtQuestRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("daily_quests").upsert(
    rows.map((row) => ({
      user_id: userId,
      quest_date: dateISO,
      slot: row.slot,
      quest_type: row.type,
      target: row.target,
      xp: row.xp,
    })),
    { onConflict: "user_id,quest_date,slot", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export interface QuestProgressResult {
  slot: number;
  type: QuestType;
  xp: number;
  progress: number;
  target: number;
  completedNow: boolean;
}

export async function addQuestProgress(
  type: QuestType,
  amount: number,
  dateISO?: string,
): Promise<QuestProgressResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_quest_progress", {
    p_type: type,
    p_amount: amount,
    p_date: dateISO ?? null,
  });
  if (error) throw error;
  const results: QuestProgressResult[] = [];
  for (const row of data ?? []) {
    if (!isQuestType(row.out_type)) continue;
    results.push({
      slot: row.out_slot,
      type: row.out_type,
      xp: row.out_xp,
      progress: row.out_progress,
      target: row.out_target,
      completedNow: row.out_completed_now,
    });
  }
  return results;
}

/**
 * The learner's most recent quest day within a day of UTC "today" (every real
 * timezone falls inside that window), for checks that — like the quest
 * function itself — don't know the learner's local date.
 */
export async function fetchLatestQuestDay(userId: string): Promise<DailyQuest[]> {
  const supabase = await createClient();
  const now = Date.now();
  const from = new Date(now - 36 * 3600 * 1000).toISOString().slice(0, 10);
  const to = new Date(now + 36 * 3600 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_quests")
    .select("quest_date, slot, quest_type, target, xp, progress, completed_at")
    .eq("user_id", userId)
    .gte("quest_date", from)
    .lte("quest_date", to)
    .order("quest_date", { ascending: false })
    .order("slot", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const latest = rows[0]?.quest_date;
  const quests: DailyQuest[] = [];
  for (const row of rows) {
    if (row.quest_date !== latest || !isQuestType(row.quest_type)) continue;
    quests.push({
      slot: row.slot,
      type: row.quest_type,
      target: row.target,
      progress: row.progress,
      xp: row.xp,
      completed: row.completed_at !== null,
    });
  }
  return quests;
}
