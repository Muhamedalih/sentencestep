/**
 * The rule of the day per level. A learner's level (1 = A1, 2 = A2–B1, 3 = B2: the levels of Looma's
 * stories and of the learner's starting level) gives the ladder they are taught, the label the card shows
 * and the longest sentence a rule may be asked from (a higher level reads longer sentences). A level with
 * no ladder has no rule of the day yet.
 */

import { DE_A1_LADDER, DE_A2_LADDER, DE_B2_LADDER } from "./de/ladders";
import { A1_LADDER, type RuleLevel, type RuleSpec } from "./ladder";
import { A2_LADDER, B2_LADDER } from "./ladder-higher";

import { GERMAN_ID_PREFIX, type TargetLanguage } from "@/lib/learn-language";

const LADDERS: Record<TargetLanguage, Partial<Record<number, readonly RuleSpec[]>>> = {
  en: { 1: A1_LADDER, 2: A2_LADDER, 3: B2_LADDER },
  de: { 1: DE_A1_LADDER, 2: DE_A2_LADDER, 3: DE_B2_LADDER },
};

/** The short level name on the card and on Home's row. */
export const LEVEL_LABEL: Partial<Record<number, string>> = { 1: "A1", 2: "A2–B1", 3: "B2" };

export const MAX_WORDS_BY_LEVEL: Partial<Record<number, number>> = { 1: 14, 2: 18, 3: 22 };

/** The learner's level (1 = A1, 2 = A2–B1, 3 = B2) that a rule's own level belongs to. */
export const LEVEL_NUMBER: Record<RuleLevel, number> = { A1: 1, "A2-B1": 2, B2: 3 };

/** The language a rule id belongs to: German ids start with "de-". */
export function languageOfRuleId(id: string): TargetLanguage {
  return id.startsWith(GERMAN_ID_PREFIX) ? "de" : "en";
}

export function ladderForLevel(
  level: number,
  language: TargetLanguage = "en",
): readonly RuleSpec[] | null {
  return LADDERS[language][level] ?? null;
}

export function hasRuleLadder(level: number, language: TargetLanguage = "en"): boolean {
  return ladderForLevel(level, language) !== null;
}

/**
 * The level whose rules a learner is taught now: their own, or the next one once they have met every rule of it
 * (the course goes on to A2–B1 after A1, and to B2 after A2–B1; B2 is the last). `met` holds the ids of the
 * rules the learner has met.
 */
export function teachingLevel(
  level: number,
  met: ReadonlySet<string>,
  language: TargetLanguage = "en",
): number {
  let current = level;
  while (current < 3) {
    const ladder = ladderForLevel(current, language);
    if (!ladder || ladder.some((rule) => !met.has(rule.id))) break;
    current += 1;
  }
  return current;
}

/** Whether a learner at this level still has a rule to be taught (some rule of their teaching level is not met). */
export function hasRuleToTeach(
  level: number,
  met: ReadonlySet<string>,
  language: TargetLanguage = "en",
): boolean {
  const ladder = ladderForLevel(teachingLevel(level, met, language), language);
  return ladder !== null && ladder.some((rule) => !met.has(rule.id));
}

/** Every English rule of every level: a stored answer is checked against this list. */
export const ALL_RULES: readonly RuleSpec[] = [...A1_LADDER, ...A2_LADDER, ...B2_LADDER];

/** Every German rule of every level. */
export const ALL_DE_RULES: readonly RuleSpec[] = [
  ...DE_A1_LADDER,
  ...DE_A2_LADDER,
  ...DE_B2_LADDER,
];

/** Every rule of one language's course, in the order the course opens them. */
export function rulesOf(language: TargetLanguage): readonly RuleSpec[] {
  return language === "de" ? ALL_DE_RULES : ALL_RULES;
}

const BY_ID = new Map([...ALL_RULES, ...ALL_DE_RULES].map((rule) => [rule.id, rule] as const));

/** The rule with that id, in either course. */
export function ruleById(id: string): RuleSpec | undefined {
  return BY_ID.get(id);
}

/** The rule before and the rule after one in the order of its own course (A1, then A2–B1, then B2): the admin preview's arrows. */
export function neighbourRules(id: string): { previous?: RuleSpec; next?: RuleSpec } {
  const list = rulesOf(languageOfRuleId(id));
  const index = list.findIndex((rule) => rule.id === id);
  if (index < 0) return {};
  const previous = list[index - 1];
  const next = list[index + 1];
  return { ...(previous ? { previous } : {}), ...(next ? { next } : {}) };
}
