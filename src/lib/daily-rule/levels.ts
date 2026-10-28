/**
 * The rule of the day per level. A learner's level (1 = A1, 2 = A2–B1, 3 = B2: the levels of Looma's
 * stories and of the learner's starting level) gives the ladder they are taught, the label the card shows
 * and the longest sentence a rule may be asked from (a higher level reads longer sentences). A level with
 * no ladder has no rule of the day yet.
 */

import { A1_LADDER, type RuleSpec } from "./ladder";
import { A2_LADDER, B2_LADDER } from "./ladder-higher";

const LADDERS: Partial<Record<number, readonly RuleSpec[]>> = { 1: A1_LADDER, 2: A2_LADDER, 3: B2_LADDER };

/** The short level name on the card and on Home's row. */
export const LEVEL_LABEL: Partial<Record<number, string>> = { 1: "A1", 2: "A2–B1", 3: "B2" };

export const MAX_WORDS_BY_LEVEL: Partial<Record<number, number>> = { 1: 14, 2: 18, 3: 22 };

export function ladderForLevel(level: number): readonly RuleSpec[] | null {
  return LADDERS[level] ?? null;
}

export function hasRuleLadder(level: number): boolean {
  return ladderForLevel(level) !== null;
}

/** Every rule of every level: a stored answer is checked against this list. */
export const ALL_RULES: readonly RuleSpec[] = [...A1_LADDER, ...A2_LADDER, ...B2_LADDER];

export function ruleById(id: string): RuleSpec | undefined {
  return ALL_RULES.find((rule) => rule.id === id);
}
