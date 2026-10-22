import { createClient } from "@/lib/supabase/server";
import type { SentenceOutcome } from "@/lib/sentence-bank/review";

/**
 * Reads and writes of `sentence_mastery` (see 20250347000000_sentence_mastery.sql) — the strength
 * and due day of every sentence the learner has been asked back. Session-aware client throughout:
 * RLS is what limits every call to the learner's own rows, so none of these takes a user id it
 * would have to be trusted with (the id passed to the read is only a filter, RLS is the boundary).
 *
 * Every caller treats a failure as "nothing has been asked back yet" (the table does not exist on a
 * project that has not applied the migration): a missing optional feature must never take a
 * learner page down.
 */

export interface SentenceStateRow {
  strength: number;
  /** The learner-local day the sentence is next due, "YYYY-MM-DD". */
  dueOn: string;
  /** The learner-local day it was last asked, "YYYY-MM-DD". */
  lastReviewedOn: string;
}

const PAGE = 1000;
/** A learner would need years of daily use to reach this many rows; the cap only keeps a bug from looping. */
const MAX_PAGES = 10;

/**
 * Every row the learner has, by sentence id. One small read — a handful of rows a day, so a year of
 * daily use is a few hundred — paged anyway: a plain select stops silently at 1000 rows, and a
 * sentence that fell off the end would look never-asked and come back as new.
 */
export async function fetchSentenceStates(userId: string): Promise<Map<string, SentenceStateRow>> {
  const supabase = await createClient();
  const states = new Map<string, SentenceStateRow>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from("sentence_mastery")
      .select("sentence_id, strength, due_on, last_reviewed_on")
      .eq("user_id", userId)
      .order("sentence_id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      states.set(row.sentence_id, {
        strength: row.strength,
        dueOn: row.due_on,
        lastReviewedOn: row.last_reviewed_on,
      });
    }
    if ((data?.length ?? 0) < PAGE) break;
  }
  return states;
}

export interface RecordedSentenceReview {
  strength: number;
  dueOn: string;
  /** The sentence moved up a step with this review. */
  advanced: boolean;
}

/**
 * Records one review through the atomic record_sentence_review() function (see its migration
 * comment for the rules): never a client read-then-write, so two tabs can never compute from the
 * same stale strength. Returns where the sentence stands afterwards, or null when the function
 * answered with nothing.
 */
export async function recordSentenceReview(
  sentenceId: string,
  outcome: SentenceOutcome,
  todayISO: string,
): Promise<RecordedSentenceReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_sentence_review", {
    p_sentence_id: sentenceId,
    p_outcome: outcome,
    p_today: todayISO,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return { strength: row.out_strength, dueOn: row.out_due_on, advanced: row.out_advanced };
}
