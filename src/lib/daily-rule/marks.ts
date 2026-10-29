/**
 * The grammar part of a word: the letters a rule is about, shown apart from the rest of the word so
 * the learner sees WHAT the rule changes ("read" + "ing", "work" + "ed", or the whole word when the
 * rule is about the word itself: is, are, the, can). Two ways in:
 *
 * - splitMark: for a word a matcher picked (the blank of a question, a word of a story sentence). The
 *   rule's match kind says which ending it is about, so the same word is split differently by
 *   different rules.
 * - parseMarked: for the rule's own sentences, written by hand with the part in square brackets
 *   ("She read[s] it."), because there the part to show is a teaching choice, not a computation.
 *
 * Only the learner's eyes use this: a typed answer is still compared whole (tokens.ts).
 */

import type { MatchKind } from "./ladder";

/** A word split into the letters that stay and the grammar letters (the whole word when the rule is about the word). */
export interface MarkedWord {
  stem: string;
  mark: string;
}

/** One run of a sentence: plain text, or the part that is marked. */
export interface MarkedSegment {
  text: string;
  marked: boolean;
}

/** Rules about an -ing form after be, been or a verb: read + ing. */
const ING_KINDS: ReadonlySet<MatchKind> = new Set([
  "present-continuous",
  "past-continuous",
  "perfect-continuous",
  "gerund-after",
]);

/** Rules about a noun or verb that takes -s / -es / -ies. */
const S_KINDS: ReadonlySet<MatchKind> = new Set(["he-she-it-s", "plural"]);

/** Rules about a past form or a participle: regular ones end in -ed / -ied, irregular ones are a word of their own. */
const ED_KINDS: ReadonlySet<MatchKind> = new Set([
  "regular-past",
  "present-perfect",
  "past-perfect",
  "passive",
  "should-have",
  "wish-past",
]);

/** The verbs that take -es after -o (the others that end in -oes, like shoes and toes, take only -s). */
const O_ES = new Set(["goes", "does", "potatoes", "tomatoes", "heroes", "echoes"]);

function whole(word: string): MarkedWord {
  return { stem: "", mark: word };
}

function endsWith(word: string, ending: string): MarkedWord {
  const cut = word.length - ending.length;
  return { stem: word.slice(0, cut), mark: word.slice(cut) };
}

/**
 * The word split for the rule that picked it. A word that does not carry the rule's ending (an
 * irregular past, a plural like "children", better and worse) is all mark: the whole word is the form.
 */
export function splitMark(kind: MatchKind, word: string): MarkedWord {
  const lower = word.toLowerCase();

  if (ING_KINDS.has(kind)) {
    return lower.length > 4 && lower.endsWith("ing") ? endsWith(word, "ing") : whole(word);
  }

  if (S_KINDS.has(kind)) {
    if (lower.length > 4 && lower.endsWith("ies")) return endsWith(word, "ies");
    if (/(?:ss|x|zz|ch|sh)es$/.test(lower) || O_ES.has(lower)) return endsWith(word, "es");
    if (lower.length > 2 && lower.endsWith("s") && !lower.endsWith("ss"))
      return endsWith(word, "s");
    return whole(word);
  }

  if (ED_KINDS.has(kind)) {
    if (lower.length > 4 && lower.endsWith("ied")) return endsWith(word, "ied");
    if (lower.length > 3 && lower.endsWith("ed")) return endsWith(word, "ed");
    return whole(word);
  }

  if (kind === "comparative") {
    if (lower === "better" || lower === "worse") return whole(word);
    return lower.length > 3 && lower.endsWith("er") ? endsWith(word, "er") : whole(word);
  }

  if (kind === "possessive-s") {
    const found = /^(.+?)(['’]s)$/i.exec(word);
    if (found) return { stem: found[1]!, mark: found[2]! };
  }

  return whole(word);
}

/** A sentence written with its marked parts in square brackets, as runs: "She read[s] it." -> She read | s | it. */
export function parseMarked(text: string): MarkedSegment[] {
  const segments: MarkedSegment[] = [];
  for (const part of text.split(/(\[[^\]]+\])/)) {
    if (part === "") continue;
    if (part.startsWith("[") && part.endsWith("]")) {
      segments.push({ text: part.slice(1, -1), marked: true });
    } else {
      segments.push({ text: part, marked: false });
    }
  }
  return segments;
}

/** The sentence as it is written, without the brackets. */
export function stripMarks(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, "$1");
}

/** U+2060 WORD JOINER, built at run time: an invisible character that forbids a line break on both sides. */
const WORD_JOINER = String.fromCharCode(0x2060);

/**
 * The text with an ending kept whole at the end of a line: "-s", "-ing" and "-ed" are written with their
 * hyphen, and a line may otherwise break right after it ("add -" / "s to the verb"). The joiner is
 * invisible, and only the display uses this: a comparison never sees it.
 */
export function glueEndings(text: string): string {
  return text.replace(/(^|\s)-(?=[A-Za-z])/g, "$1-" + WORD_JOINER);
}
