"use server";

import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isMissingRulesSchema, recordLearnerRuleReview } from "@/lib/supabase/queries/learner-rules";

import { ALL_RULES } from "./levels";
import { isRuleOutcome } from "./schedule";

/** The learner's "today" arrives from the page; anything further than this from the server's own clock is not a day they could be in. */
const MAX_DAY_SKEW_MS = 2 * 24 * 60 * 60 * 1000;

/** Where the rule stands after an answer; `ok` is false when nothing was recorded. */
export interface RecordedRuleAnswer {
  ok: boolean;
  strength?: number;
  dueOn?: string;
}

/**
 * Records the outcome of one rule's card (or one earlier-rule question) through the atomic
 * record_learner_rule_review function. Everything arrives as client input, so it is re-validated, and
 * the "dailyRule" permission must be open for the caller (a Server Action is reachable as a direct POST).
 * Best-effort: the card carries on either way; on a project that has not applied the migration it
 * answers `ok: false`.
 */
export async function recordDailyRuleAction(input: unknown): Promise<RecordedRuleAnswer> {
  try {
    const parsed = parseRuleAnswer(input);
    if (!parsed || Math.abs(Date.parse(`${parsed.todayISO}T12:00:00Z`) - Date.now()) > MAX_DAY_SKEW_MS) {
      return { ok: false };
    }
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.dailyRule || !user) return { ok: false };
    const recorded = await recordLearnerRuleReview(parsed);
    return recorded ? { ok: true, strength: recorded.strength, dueOn: recorded.dueOn } : { ok: false };
  } catch (error) {
    if (isMissingRulesSchema(error)) {
      console.warn("[daily-rule] the learner_rules migration is not applied yet");
    } else {
      console.error("[daily-rule] recordDailyRuleAction failed", error);
    }
    return { ok: false };
  }
}

function parseRuleAnswer(
  input: unknown,
): { ruleId: string; outcome: "clean" | "assisted" | "missed"; todayISO: string } | null {
  if (typeof input !== "object" || input === null) return null;
  const { ruleId, outcome, todayISO } = input as Record<string, unknown>;
  if (typeof ruleId !== "string" || !ALL_RULES.some((rule) => rule.id === ruleId)) return null;
  if (!isRuleOutcome(outcome)) return null;
  if (typeof todayISO !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(todayISO)) return null;
  return { ruleId, outcome, todayISO };
}
