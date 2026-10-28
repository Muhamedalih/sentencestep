import { createClient } from "@/lib/supabase/server";
import type { RuleOutcome } from "@/lib/daily-rule/schedule";
import type { RuleStateRow } from "@/lib/daily-rule/visit";

/**
 * Reads and writes of `learner_rules` (see 20250351000000_learner_rules.sql): the rule of the day, one
 * row per (learner, rule). RLS limits every call to the learner's own rows.
 *
 * Every caller treats a missing table (the migration not applied yet) as "nothing recorded yet": the
 * card still teaches and nothing is asked back, and Today keeps its tasks.
 */

/** True when the error says the table or the function is not there (the migration has not been applied yet). */
export function isMissingRulesSchema(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return (
    code === "42P01" ||
    code === "PGRST202" ||
    code === "PGRST205" ||
    (typeof message === "string" && /learner_rules|record_learner_rule_review/.test(message))
  );
}

/** Every rule the learner has answered, with its strength and due day (at most 21 rows). */
export async function fetchLearnerRuleStates(userId: string): Promise<RuleStateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learner_rules")
    .select("rule_id, strength, due_on, last_reviewed_on")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ruleId: row.rule_id,
    strength: row.strength,
    dueOn: row.due_on,
    lastReviewedOn: row.last_reviewed_on,
  }));
}

/**
 * Records one answer through record_learner_rule_review() (atomic, RLS-scoped, idempotent per learner-
 * local day). Returns where the rule stands afterwards, or null when the function answered nothing.
 */
export async function recordLearnerRuleReview(input: {
  ruleId: string;
  outcome: RuleOutcome;
  todayISO: string;
}): Promise<{ strength: number; dueOn: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_learner_rule_review", {
    p_rule: input.ruleId,
    p_outcome: input.outcome,
    p_today: input.todayISO,
  });
  if (error) throw error;
  const row = data?.[0];
  return row ? { strength: row.out_strength, dueOn: row.out_due_on } : null;
}

export interface LevelSentence {
  id: string;
  lessonId: string;
  en: string;
}

const CHUNK = 100;

/**
 * The English sentences of the lessons and stories of one level (1 = A1, 2 = A2–B1, 3 = B2) among the
 * given lesson ids: the learner's own finished texts, read through RLS (a lesson the learner cannot open
 * is not returned).
 */
export async function fetchLevelSentences(lessonIds: readonly string[], level: number): Promise<LevelSentence[]> {
  if (lessonIds.length === 0) return [];
  const supabase = await createClient();
  const levelIds: string[] = [];
  for (let from = 0; from < lessonIds.length; from += CHUNK) {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, mode, levels(index)")
      .in("id", lessonIds.slice(from, from + CHUNK))
      .in("mode", ["normal", "stories"]);
    if (error) throw error;
    for (const row of data ?? []) {
      const found = row.levels as unknown as { index: number } | null;
      if (found?.index === level) levelIds.push(row.id);
    }
  }

  const sentences: LevelSentence[] = [];
  for (let from = 0; from < levelIds.length; from += CHUNK) {
    const { data, error } = await supabase
      .from("sentences")
      .select("id, lesson_id, en")
      .in("lesson_id", levelIds.slice(from, from + CHUNK))
      .order("order_index", { ascending: true });
    if (error) throw error;
    for (const row of data ?? []) sentences.push({ id: row.id, lessonId: row.lesson_id, en: row.en });
  }
  return sentences;
}
