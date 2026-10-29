/**
 * The shapes of what a rule teaches (teach.ts and the files of the syllabus' levels), and the two small
 * writers the files use. Kept apart so the content files can import the shapes without importing each other.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

/** One line in simple English and in each language the site supports. */
export type Lines = { en: string } & Record<SupportLocale, string>;

export interface RuleNote {
  /**
   * "exception": the rule does not apply, or changes. "detail": more to know to use the rule.
   * "mistake": a slip that speakers of Arabic often make (the rule differs from Arabic).
   */
  kind: "exception" | "detail" | "mistake";
  say: Lines;
  /** Sentences that show it, with the part to look at in [brackets]. */
  examples: readonly string[];
}

export interface RuleTeach {
  /** Page one: the rule in a line or two. */
  idea: Lines;
  /** The right and the wrong sentence, with the part to look at in [brackets] (in the wrong one: the part that is wrong). */
  right: string;
  wrong: string;
  /** Page two: none means the card has one page. */
  notes: readonly RuleNote[];
  /**
   * Prepared sentences (items.ts): what a rule is taught and practised with when the learner's story does not
   * show it, and the only source of a rule no word shows. Each has one blank in [brackets] (the typed answer;
   * "|" separates other answers that are right) and may end with a {hint} that makes the blank answerable
   * without the sound (the base verb, a pronoun).
   */
  items?: readonly string[];
}

export const lines = (en: string, ar: string, es: string, tr: string): Lines => ({
  en,
  ar,
  es,
  tr,
});

export const note = (
  kind: RuleNote["kind"],
  say: Lines,
  examples: readonly string[],
): RuleNote => ({
  kind,
  say,
  examples,
});

/** A line in the learner's language (Arabic while the language is not chosen yet). */
export function inLocale(lines: Lines, locale: SupportLocale | null): string {
  return lines[locale ?? "ar"];
}
