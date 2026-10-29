/**
 * "Rule of the day" (قاعدة اليوم): the shape of a rule, and the ladders. A ladder is the rules of one level
 * in the order they are opened (their place in the syllabus, syllabus.ts); what a rule TEACHES (its idea in
 * four languages, its sentences, its notes) lives in teach.ts, so a rule here is only what the engine needs
 * to place it: which level and unit it belongs to, what its card is called, which family it contrasts with,
 * and which words of a sentence show it (the matchers, matchers.ts and matchers-more.ts).
 *
 * Which sentences show a rule is decided by those matchers, from whatever the learner is reading, so the
 * same rule is asked from today's story and from the stories the learner has finished before. A rule no
 * word shows ("none") is taught from its prepared sentences. Ids never change: they are stored per learner.
 */

import type { ExtraMatchKind } from "./matchers-more";
import { SYLLABUS } from "./syllabus";

export type RuleFamily =
  | "be"
  | "determiner"
  | "pronoun"
  | "present"
  | "past"
  | "question"
  | "negative"
  | "preposition"
  | "quantity"
  | "modal"
  | "frequency"
  | "perfect"
  | "future"
  | "comparison"
  | "conditional"
  | "passive"
  | "verb-pattern"
  | "adjective"
  | "adverb"
  | "reported"
  | "relative"
  | "linking"
  | "structure";

/** The first 39 matchers (matchers.ts). */
export type BaseMatchKind =
  | "be"
  | "article"
  | "possessive"
  | "he-she-it-s"
  | "present-base"
  | "regular-past"
  | "irregular-past"
  | "place"
  | "wh-start"
  | "plural"
  | "this-that"
  | "possessive-s"
  | "imperative"
  | "object-pronoun"
  | "was-were"
  | "did-question"
  | "didnt"
  | "dont-doesnt"
  | "do-does-question"
  | "can"
  | "there-is"
  | "time-prep"
  | "frequency"
  | "some-any"
  | "present-continuous"
  | "past-continuous"
  | "present-perfect"
  | "going-to"
  | "comparative"
  | "must"
  | "first-conditional"
  | "much-many"
  | "second-conditional"
  | "perfect-continuous"
  | "past-perfect"
  | "passive"
  | "wish-past"
  | "should-have"
  | "gerund-after";

/** Which sentence pattern a rule looks for (see matchers.ts and matchers-more.ts); "none": no word shows it. */
export type MatchKind = BaseMatchKind | ExtraMatchKind | "none";

/** The level a rule belongs to: A1, A2–B1 (level 2 in Looma) or B2 (level 3). */
export type RuleLevel = "A1" | "A2-B1" | "B2";

/** Which letters of the answer carry the rule (marks.ts); a rule that does not say takes the style of its matcher. */
export type MarkStyle =
  "ing" | "ed" | "s" | "er" | "est" | "ly" | "ed-ing" | "possessive" | "whole";

export interface RuleSpec {
  /** Stable id stored per learner ("a1-01" ... "a1-45"); never reused for another rule. */
  id: string;
  /** Position on the ladder of its level (1 = opened first). */
  order: number;
  level: RuleLevel;
  /** The unit of the syllabus the rule belongs to (units.ts). */
  unit: string;
  /** The title shown on the card, exactly as written here. */
  title: string;
  family: RuleFamily;
  match: MatchKind;
  mark?: MarkStyle;
  /** The words the rule names (the verbs a verb pattern takes), shown in a row of their own; absent when it names none. */
  words?: readonly string[];
}

/** The rules of one level in the order they are opened. */
export function ladderOf(level: RuleLevel): readonly RuleSpec[] {
  return SYLLABUS.filter((entry) => entry.level === level).map((entry, index) => ({
    ...entry,
    order: index + 1,
  }));
}

export const A1_LADDER: readonly RuleSpec[] = ladderOf("A1");

const BY_ID = new Map(A1_LADDER.map((rule) => [rule.id, rule]));

/** The A1 rule with that id, or undefined for an id that is not on the A1 ladder (levels.ts has the lookup for every level). */
export function ruleById(id: string): RuleSpec | undefined {
  return BY_ID.get(id);
}
