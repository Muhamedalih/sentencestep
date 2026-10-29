/**
 * Where a rule's sentence pattern sits in a sentence: the candidate word indexes, in reading order.
 * The first candidate becomes the blank. Each matcher is a small, explicit rule with its exclusions
 * written out, so a false friend (red, bed, tired, nothing, news) is never blanked as a grammar form.
 * The lists are deliberately short: a sentence that does not match cleanly is simply not asked.
 */

import type { BaseMatchKind, MatchKind } from "./ladder";
import { extraMatcher } from "./matchers-more";
import type { Token } from "./tokens";

import {
  BASE_VERBS,
  IMPERATIVE_VERBS,
  IRREGULAR_PAST,
  OBJECT_PRONOUNS,
  OBJECT_AFTER,
  PLURAL_TRIGGER,
  SUBJECT,
  TIME_IN,
  TIME_AT,
  WEEKDAYS,
  FREQUENCY,
  NOT_NOUN_AFTER_THIS,
  HAVE,
  PRESENT_BE,
  PAST_BE,
  PASSIVE_BE,
  HAVE_AUX,
  ADVERB_BEFORE_PARTICIPLE,
  PASSIVE_PARTICIPLE,
  GOING_VERBS,
  GERUND_VERBS,
  WISH_SUBJECT,
  BETTER_WORSE,
  MORE_LESS,
  UNCOUNTABLE,
  IRREGULAR_PLURAL,
  isVerbS,
  isRegularPast,
  isPluralNoun,
  isPossessiveS,
  isIng,
  isParticiple,
  isPastForm,
  isComparativeEr,
  ifClauseIsPast,
} from "./matcher-words";

/**
 * The candidate indexes for one rule in one sentence. `text` is the whole sentence (a question is
 * recognised by its question mark); `tokens` are its words, from tokenize().
 */
export function candidatesFor(kind: MatchKind, tokens: readonly Token[], text: string): number[] {
  const w = tokens.map((token) => token.lower);
  const at = (i: number): string => w[i] ?? "";
  const question = text.trim().endsWith("?");
  const all = (pred: (i: number) => boolean): number[] => {
    const out: number[] = [];
    for (let i = 0; i < w.length; i++) if (pred(i)) out.push(i);
    return out;
  };
  /** "in the morning" / "in evening": the time of day follows the preposition, with or without "the". */
  const timePhraseAfter = (i: number): boolean =>
    TIME_IN.has(at(i + 1)) || (at(i + 1) === "the" && TIME_IN.has(at(i + 2)));

  // A rule no word shows has no matcher; the rules added after the first 39 have theirs in matchers-more.ts.
  if (kind === "none") return [];
  const extra = extraMatcher(kind);
  if (extra) return extra({ tokens, text, w, question, at, all });

  switch (kind as BaseMatchKind) {
    case "be":
      return all((i) => ["am", "is", "are"].includes(at(i)) && at(i - 1) !== "there");
    case "article":
      return all((i) => at(i) === "a" || at(i) === "an" || at(i) === "the");
    case "possessive":
      return all((i) => ["my", "your", "his", "her"].includes(at(i)) && i + 1 < w.length);
    case "he-she-it-s":
      return all((i) => ["he", "she", "it"].includes(at(i - 1)) && isVerbS(at(i)));
    case "present-base":
      return all((i) => ["i", "you", "we", "they"].includes(at(i - 1)) && BASE_VERBS.has(at(i)));
    case "regular-past":
      return all((i) => isRegularPast(at(i)));
    case "irregular-past":
      return all((i) => IRREGULAR_PAST.has(at(i)) && !(at(i) === "got" && HAVE.has(at(i - 1))));
    case "place":
      return all(
        (i) =>
          ["in", "on", "under"].includes(at(i)) && !timePhraseAfter(i) && !WEEKDAYS.has(at(i + 1)),
      );
    case "wh-start":
      return question && ["what", "where", "who"].includes(at(0)) ? [0] : [];
    case "plural":
      return all((i) => PLURAL_TRIGGER.has(at(i - 1)) && isPluralNoun(at(i)));
    case "this-that":
      return all(
        (i) =>
          ["this", "that", "these", "those"].includes(at(i)) &&
          i + 1 < w.length &&
          !NOT_NOUN_AFTER_THIS.has(at(i + 1)),
      );
    case "possessive-s":
      return all((i) => isPossessiveS(tokens[i]));
    case "imperative": {
      if (question) return [];
      if (at(0) === "please") return IMPERATIVE_VERBS.has(at(1)) ? [1] : [];
      return IMPERATIVE_VERBS.has(at(0)) ? [0] : [];
    }
    case "object-pronoun":
      return all((i) => OBJECT_PRONOUNS.has(at(i)) && OBJECT_AFTER.has(at(i - 1)));
    case "was-were":
      return all((i) => at(i) === "was" || at(i) === "were");
    case "did-question":
      return all((i) => at(i) === "did" && SUBJECT.has(at(i + 1)) && question);
    case "didnt":
      return all((i) => at(i) === "didn't");
    case "dont-doesnt":
      return all((i) => at(i) === "don't" || at(i) === "doesn't");
    case "do-does-question":
      return question && (at(0) === "do" || at(0) === "does") ? [0] : [];
    case "can":
      return all((i) => at(i) === "can");
    case "there-is":
      return all((i) => (at(i) === "is" || at(i) === "are") && at(i - 1) === "there");
    case "time-prep":
      return all(
        (i) =>
          (at(i) === "in" && timePhraseAfter(i)) ||
          (at(i) === "on" && WEEKDAYS.has(at(i + 1))) ||
          (at(i) === "at" && (TIME_AT.has(at(i + 1)) || /^\d/.test(tokens[i + 1]?.text ?? ""))),
      );
    case "frequency":
      return all((i) => FREQUENCY.has(at(i)));
    case "some-any":
      return all((i) => at(i) === "some" || at(i) === "any");
    case "present-continuous":
      return all((j) => isIng(at(j)) && PRESENT_BE.has(at(j - 1)) && at(j - 2) !== "there");
    case "past-continuous":
      return all((j) => isIng(at(j)) && PAST_BE.has(at(j - 1)));
    case "present-perfect":
      return all(
        (j) =>
          isParticiple(at(j)) &&
          !isIng(at(j + 1)) &&
          (HAVE_AUX.has(at(j - 1)) ||
            (ADVERB_BEFORE_PARTICIPLE.has(at(j - 1)) && HAVE_AUX.has(at(j - 2)))),
      );
    case "going-to":
      return all(
        (j) =>
          GOING_VERBS.has(at(j)) &&
          at(j - 1) === "to" &&
          at(j - 2) === "going" &&
          (PRESENT_BE.has(at(j - 3)) || PAST_BE.has(at(j - 3))),
      );
    case "comparative":
      return all(
        (j) =>
          ((isComparativeEr(at(j)) || BETTER_WORSE.has(at(j))) && at(j + 1) === "than") ||
          (MORE_LESS.has(at(j)) && at(j + 2) === "than"),
      );
    case "must":
      return all((j) => at(j) === "must");
    case "first-conditional":
      return all((j) => at(j) === "will" && w.slice(0, j).includes("if"));
    case "much-many":
      return all(
        (j) =>
          (at(j) === "much" && UNCOUNTABLE.has(at(j + 1))) ||
          (at(j) === "many" && (isPluralNoun(at(j + 1)) || IRREGULAR_PLURAL.has(at(j + 1)))),
      );
    case "second-conditional":
      return all((j) => at(j) === "would" && ifClauseIsPast(w, j));
    case "perfect-continuous":
      return all((j) => isIng(at(j)) && at(j - 1) === "been" && HAVE_AUX.has(at(j - 2)));
    case "past-perfect":
      return all(
        (b) =>
          isParticiple(at(b)) &&
          (at(b - 1) === "had" ||
            (ADVERB_BEFORE_PARTICIPLE.has(at(b - 1)) && at(b - 2) === "had")) &&
          !isIng(at(b + 1)) &&
          at(b) !== "to",
      );
    case "passive":
      return all(
        (b) => PASSIVE_PARTICIPLE.has(at(b)) && PASSIVE_BE.has(at(b - 1)) && at(b + 1) !== "to",
      );
    case "wish-past":
      return all((b) => isPastForm(at(b)) && WISH_SUBJECT.has(at(b - 1)) && at(b - 2) === "wish");
    case "should-have":
      return all((b) => isParticiple(at(b)) && at(b - 1) === "have" && at(b - 2) === "should");
    case "gerund-after":
      return all((b) => isIng(at(b)) && GERUND_VERBS.has(at(b - 1)));
  }
}
