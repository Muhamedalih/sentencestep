import { createClient } from "@/lib/supabase/server";
import type { LastCheck } from "@/lib/sentence-bank/weekly";

/**
 * Reads and writes of `sentence_checks` (see 20250348000000_sentence_checks.sql) — one row per weekly
 * check the learner took. Session-aware client throughout: RLS limits every call to the learner's
 * own rows. Every caller treats a failure as "no check yet" (the table does not exist on a project
 * that has not applied the migration): a missing optional feature must never take a page down.
 */

/** The learner's most recent weekly check, or null when they never took one. Throws on a database error. */
export async function fetchLastSentenceCheck(userId: string): Promise<LastCheck | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sentence_checks")
    .select("checked_on, asked, remembered, written")
    .eq("user_id", userId)
    .order("checked_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    checkedOn: data.checked_on,
    asked: data.asked,
    remembered: data.remembered,
    written: data.written,
  };
}

/** Saves one weekly check. A second one for the same day is ignored: the first result stands. Throws on a database error. */
export async function saveSentenceCheck(userId: string, check: LastCheck): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sentence_checks").upsert(
    {
      user_id: userId,
      checked_on: check.checkedOn,
      asked: check.asked,
      remembered: check.remembered,
      written: check.written,
    },
    { onConflict: "user_id,checked_on", ignoreDuplicates: true },
  );
  if (error) throw error;
}
