import { createClient } from "@/lib/supabase/server";
import { isBankSource } from "@/lib/word-bank/types";
import type { BankSource, BankWordInput } from "@/lib/word-bank/types";
import type { BankWordState } from "@/lib/word-bank/select";

/**
 * Reads and writes of `learner_words` (see 20250350000000_learner_words.sql) — the words bank: every
 * word a learner has met, its strength and due day, and where it was first met. Session-aware client
 * throughout: RLS is what limits every call to the learner's own rows, so none of these takes a user
 * id it would have to be trusted with (the id passed to a read is only a filter, RLS is the boundary).
 *
 * Every caller treats a failure as "the bank is empty" (the table does not exist on a project that has
 * not applied the migration): a missing optional feature must never take a learner page down.
 */

/** True when the error says the table or the function is not there (the migration has not been applied yet). */
export function isMissingBankSchema(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return (
    code === "42P01" ||
    code === "PGRST202" ||
    code === "PGRST205" ||
    (typeof message === "string" && /learner_words/.test(message))
  );
}

export interface RecordedBankReview {
  strength: number;
  dueOn: string;
  /** The word moved up a step with this answer. */
  advanced: boolean;
}

/**
 * Records one answer through the atomic record_learner_word_review() function (see its migration
 * comment for the rules): never a client read-then-write, so two tabs can never compute from the same
 * stale strength. The first answer to a word creates its row with the context given; returns where
 * the word stands afterwards, or null when the function answered with nothing.
 */
export async function recordLearnerWordReview(
  input: BankWordInput,
): Promise<RecordedBankReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_learner_word_review", {
    p_word: input.word,
    p_outcome: input.outcome,
    p_today: input.todayISO,
    p_source: input.source,
    p_ar: input.ar ?? "",
    p_lesson_id: input.lessonId ?? null,
    p_lesson_title: input.lessonTitle ?? null,
    p_home_sentence: input.homeSentence ?? null,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return { strength: row.out_strength, dueOn: row.out_due_on, advanced: row.out_advanced };
}

const PAGE = 1000;
/** A learner would need years of daily use to reach this many rows; the cap only keeps a bug from looping. */
const MAX_PAGES = 10;

/**
 * Every word the learner has in the bank. A small read (a handful of rows a day), paged anyway: a
 * plain select stops silently at 1000 rows, and a word that fell off the end would look missing.
 */
export async function fetchBankStates(userId: string): Promise<BankWordState[]> {
  const supabase = await createClient();
  const states: BankWordState[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from("learner_words")
      .select(
        "word, strength, due_on, last_reviewed_on, source, lesson_id, lesson_title, ar, home_sentence, first_seen_on",
      )
      .eq("user_id", userId)
      .order("word", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      states.push({
        word: row.word,
        strength: row.strength,
        dueOn: row.due_on,
        lastReviewedOn: row.last_reviewed_on,
        source: isBankSource(row.source) ? row.source : "lesson",
        lessonId: row.lesson_id,
        lessonTitle: row.lesson_title,
        ar: row.ar,
        homeSentence: row.home_sentence,
        firstSeenOn: row.first_seen_on,
      });
    }
    if ((data?.length ?? 0) < PAGE) break;
  }
  return states;
}

/** Where one word of the learner's bank was first met, enough to find its home sentence's translation. */
export interface BankHomeRow {
  source: BankSource;
  lessonId: string | null;
  homeSentence: string | null;
}

/** The learner's own row for one word (by the primary key), or null when the word is not in their bank. */
export async function fetchBankHome(userId: string, word: string): Promise<BankHomeRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learner_words")
    .select("source, lesson_id, home_sentence")
    .eq("user_id", userId)
    .eq("word", word)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    source: isBankSource(data.source) ? data.source : "lesson",
    lessonId: data.lesson_id,
    homeSentence: data.home_sentence,
  };
}

/** How many of the learner's words are due on `todayISO` or before: one indexed count, for the Home button. */
export async function countDueBankWords(userId: string, todayISO: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("learner_words")
    .select("word", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("due_on", todayISO);
  if (error) throw error;
  return count ?? 0;
}
