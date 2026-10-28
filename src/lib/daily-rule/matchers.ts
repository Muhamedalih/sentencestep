/**
 * Where a rule's sentence pattern sits in a sentence: the candidate word indexes, in reading order.
 * The first candidate becomes the blank. Each matcher is a small, explicit rule with its exclusions
 * written out, so a false friend (red, bed, tired, nothing, news) is never blanked as a grammar form.
 * The lists are deliberately short: a sentence that does not match cleanly is simply not asked.
 */

import type { MatchKind } from "./ladder";
import type { Token } from "./tokens";

const set = (...words: string[]) => new Set(words);

const BASE_VERBS = set(
  "work", "live", "like", "want", "need", "go", "play", "eat", "drink", "know", "think", "have",
  "see", "make", "take", "come", "speak", "read", "write", "love", "use", "feel", "try", "start",
  "help", "visit", "study", "walk", "watch", "call", "meet", "buy", "cook", "listen", "open",
  "close", "look", "say", "get", "give", "put", "keep", "sleep", "travel", "return", "finish",
  "stay", "wait", "sit", "run", "drive", "tell", "ask", "carry",
);

const IMPERATIVE_VERBS = set(
  "open", "close", "come", "go", "take", "look", "listen", "wait", "sit", "stand", "try", "tell",
  "give", "bring", "put", "read", "write", "stop", "help", "call", "send", "wake", "turn", "wash",
  "clean", "eat", "drink", "follow", "use", "check", "choose", "pick", "remember", "hold", "be",
  "stay", "keep", "visit", "watch", "make", "get",
);

const IRREGULAR_PAST = set(
  "went", "came", "saw", "took", "made", "got", "bought", "brought", "thought", "told", "said",
  "felt", "found", "knew", "kept", "gave", "wrote", "ran", "sat", "stood", "met", "paid", "sold",
  "heard", "understood", "began", "broke", "spoke", "chose", "drove", "ate", "drank", "forgot",
  "flew", "grew", "hid", "rang", "rose", "sent", "shook", "slept", "spent", "stole", "swam",
  "threw", "woke", "wore", "won",
);

/** Adjectives and nouns that end in -ed or are not verbs at all: never a regular past. */
const NOT_PAST_ED = set(
  "need", "feed", "bed", "red", "shed", "speed", "hundred", "indeed", "proceed", "succeed",
  "exceed", "seed", "weed", "bleed", "breed", "greed", "agreed", "freed", "steed", "tired",
  "excited", "bored", "scared", "worried", "married", "interested", "confused", "surprised",
  "amazed", "pleased", "relaxed", "embarrassed", "delighted", "wicked", "naked", "sacred",
);

/** Words ending in s that are not a verb or a plural noun. */
const NOT_S_WORD = set(
  "this", "his", "is", "has", "was", "yes", "its", "news", "bus", "always", "perhaps", "across",
  "unless", "less", "dress", "glass", "class", "kiss", "miss", "grass", "process", "boss",
  "sometimes", "as", "us", "lots", "ours", "hers", "yours", "gas", "chess", "physics", "maths",
);

const OBJECT_PRONOUNS = set("me", "him", "her", "them", "us");
const OBJECT_AFTER = set(
  "see", "call", "help", "tell", "give", "love", "like", "meet", "know", "ask", "find", "take",
  "bring", "hug", "miss", "thank", "with", "for", "to", "at", "from", "about", "after", "before",
  "without", "saw", "called", "helped", "told", "gave", "met", "asked", "found", "invited",
);

const PLURAL_TRIGGER = set(
  "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "many", "some", "few",
  "several", "these", "those", "lots", "both",
);

const SUBJECT = set("i", "you", "he", "she", "it", "we", "they");
const TIME_IN = set("morning", "afternoon", "evening", "night");
const TIME_AT = set("night", "noon", "midnight");
const WEEKDAYS = set(
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "weekends",
  "weekend",
);
const FREQUENCY = set("always", "usually", "often", "sometimes", "never");
const POSSESSIVE_S_NOT = set("it", "he", "she", "that", "there", "what", "let", "who", "where", "how", "here", "this");
/** Words that cannot be the noun after "this" / "that" when they are a pronoun, a verb or a conjunction. */
const NOT_NOUN_AFTER_THIS = set(
  "is", "was", "are", "were", "has", "have", "had", "will", "would", "can", "could", "should",
  "must", "and", "or", "but", "i", "you", "he", "she", "it", "we", "they", "the", "a", "an", "to",
  "of", "in", "on", "at", "with", "for", "from", "by", "about", "not", "don't", "doesn't", "didn't",
);
const HAVE = set("have", "has", "i've", "you've", "we've", "they've");

function isVerbS(word: string): boolean {
  return word.length >= 3 && word.endsWith("s") && !NOT_S_WORD.has(word) && /^[a-z]+$/.test(word);
}

function isRegularPast(word: string): boolean {
  return word.length >= 4 && word.endsWith("ed") && !NOT_PAST_ED.has(word) && /^[a-z]+$/.test(word);
}

function isPluralNoun(word: string): boolean {
  return word.length >= 3 && word.endsWith("s") && !word.endsWith("ss") && !NOT_S_WORD.has(word) && /^[a-z]+$/.test(word);
}

function isPossessiveS(token: Token | undefined): boolean {
  if (!token || !token.lower.endsWith("'s")) return false;
  const stem = token.lower.slice(0, -2);
  return stem.length >= 3 && /^[a-z]+$/.test(stem) && !POSSESSIVE_S_NOT.has(stem);
}

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

  switch (kind) {
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
        (i) => ["in", "on", "under"].includes(at(i)) && !timePhraseAfter(i) && !WEEKDAYS.has(at(i + 1)),
      );
    case "wh-start":
      return question && ["what", "where", "who"].includes(at(0)) ? [0] : [];
    case "plural":
      return all((i) => PLURAL_TRIGGER.has(at(i - 1)) && isPluralNoun(at(i)));
    case "this-that":
      return all((i) => ["this", "that", "these", "those"].includes(at(i)) && i + 1 < w.length && !NOT_NOUN_AFTER_THIS.has(at(i + 1)));
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
  }
}
