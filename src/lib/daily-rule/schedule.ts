/**
 * The rule ladder's schedule: a rule is held after three clean answers on three different days, and
 * a miss brings it back tomorrow. Dates are "YYYY-MM-DD" in the learner's own calendar.
 *
 * This is the word schedule (src/lib/word-mastery/schedule.ts) on purpose, so a rule and a word move
 * the same way. applyRuleOutcome mirrors record_learner_rule_review (20250351000000_learner_rules.sql)
 * statement for statement, and schedule.test.ts keeps the two in step by reading the SQL file.
 */

import { addDaysISO } from "../word-mastery/schedule";

export const RULE_OUTCOMES = ["clean", "assisted", "missed"] as const;
export type RuleOutcome = (typeof RULE_OUTCOMES)[number];

export function isRuleOutcome(value: unknown): value is RuleOutcome {
  return typeof value === "string" && (RULE_OUTCOMES as readonly string[]).includes(value);
}

/** Days until the next review once a rule stands at strength 1 .. 5 (the word ladder). */
export const RULE_INTERVAL_DAYS = [1, 3, 7, 16, 30] as const;
export const RULE_MAX_STRENGTH = 5;
/** Three clean answers on three different days: the rule is held ("تمسكها"). */
export const RULE_HELD_STRENGTH = 3;
/** Once this many rules are held, a rule of the same family is asked again as a contrast question. */
export const RULE_INTERLEAVE_AFTER = 5;
/**
 * This many rules due at once: catch up on them before a new rule is taught (the Anki rule). A visit asks up to
 * four earlier rules (RECALL_LIMIT in visit.ts), so a backlog of this size is cleared in a day or two and the
 * new rule is only ever one day late; with one new rule a day the reviews due reach about five by day 60.
 */
export const RULE_CATCH_UP_DUE = 5;

export interface RuleSchedule {
  strength: number;
  /** The learner-local day this rule is next due. */
  dueOn: string;
}

/** The interval after reaching `strength` (strength 0 uses the first interval, like the word ladder). */
export function ruleIntervalDays(strength: number): number {
  const clamped = Math.min(RULE_MAX_STRENGTH, Math.max(1, Math.trunc(strength)));
  return RULE_INTERVAL_DAYS[clamped - 1] ?? 1;
}

export function isRuleHeld(strength: number): boolean {
  return strength >= RULE_HELD_STRENGTH;
}

export function isRuleDue(state: RuleSchedule | undefined, today: string): boolean {
  return state !== undefined && state.dueOn <= today;
}

/**
 * Where one answer leaves a rule:
 * - missed: strength 0, due tomorrow, whatever the day.
 * - an answer before the rule is due changes nothing (repeating it in one afternoon cannot climb).
 * - clean: one step up, due after that step's interval.
 * - assisted: keeps its strength, due after the interval of that strength.
 */
export function applyRuleOutcome(
  prev: RuleSchedule | null,
  outcome: RuleOutcome,
  today: string,
): RuleSchedule {
  if (outcome === "missed") return { strength: 0, dueOn: addDaysISO(today, 1) };
  if (prev && prev.dueOn > today) return { strength: prev.strength, dueOn: prev.dueOn };
  const before = prev?.strength ?? 0;
  if (outcome === "clean") {
    const strength = Math.min(before + 1, RULE_MAX_STRENGTH);
    return { strength, dueOn: addDaysISO(today, ruleIntervalDays(strength)) };
  }
  return { strength: before, dueOn: addDaysISO(today, ruleIntervalDays(Math.max(before, 1))) };
}
