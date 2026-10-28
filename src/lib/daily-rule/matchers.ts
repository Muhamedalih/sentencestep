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

/** The "be" forms before an -ing verb in the present (I'm, he's, we're…), and in the past. */
const PRESENT_BE = set("am", "is", "are", "i'm", "he's", "she's", "it's", "we're", "they're", "you're");
const PAST_BE = set("was", "were");
/** The "be" forms before a passive participle. */
const PASSIVE_BE = set("am", "is", "are", "was", "were", "be", "been", "being");
/** The auxiliaries of the perfect tenses: have, has and their short forms ('s is left out: it can also mean "is"). */
const HAVE_AUX = set("have", "has", "i've", "you've", "we've", "they've");
/** Adverbs that can stand between the auxiliary and the participle: I have never been, it had already started. */
const ADVERB_BEFORE_PARTICIPLE = set(
  "never", "ever", "just", "already", "not", "always", "also", "recently", "yet", "still", "often",
);
/** -ing words that are nouns, adjectives or prepositions: never a verb after "is" or "was". */
const ING_NOT_VERB = set(
  "morning", "evening", "nothing", "something", "everything", "anything", "thing", "things", "king",
  "ring", "wing", "clothing", "string", "bring", "spring", "during", "interesting", "amazing", "boring",
  "exciting", "surprising", "tiring", "confusing", "disappointing", "frightening", "annoying",
  "depressing", "pleasing", "shocking", "worrying", "amusing", "following", "including", "training",
  "wedding", "pudding",
);
/** Irregular past participles; the regular ones end in -ed. */
const IRREGULAR_PARTICIPLE = set(
  "been", "had", "done", "gone", "seen", "made", "taken", "given", "written", "eaten", "drunk", "known",
  "met", "bought", "brought", "found", "felt", "kept", "lost", "read", "run", "spoken", "told", "won",
  "sold", "sent", "paid", "shown", "chosen", "forgotten", "broken", "begun", "driven", "fallen", "flown",
  "grown", "hidden", "ridden", "risen", "sung", "stood", "taught", "thought", "understood", "woken",
  "worn", "become", "come", "beaten", "bitten", "blown", "caught", "dealt", "fed", "fought", "frozen",
  "held", "hurt", "laid", "led", "meant", "put", "cut", "hit", "set", "let", "quit", "shut", "slept",
  "spent", "split", "spread", "stolen", "stuck", "thrown", "torn", "woven",
);
/** Participles of the verbs a passive is usually made from (not the adjectives such as tired or bored). */
const PASSIVE_PARTICIPLE = set(
  "made", "built", "written", "taken", "given", "sold", "found", "held", "sent", "bought", "brought",
  "caught", "taught", "chosen", "known", "shown", "seen", "cooked", "painted", "washed", "closed",
  "opened", "paid", "fixed", "done", "used", "invented", "discovered", "produced", "printed", "cleaned",
  "stolen", "damaged", "destroyed", "collected", "recorded", "served", "offered", "invited", "signed",
  "published", "planted", "designed", "owned", "lost", "broken", "delivered", "spoken", "elected",
  "formed", "covered", "filled", "wrapped", "locked", "hired", "trained", "treated",
);
/** The verbs a "going to" sentence can use: the base verbs above and a few more. */
const GOING_VERBS = new Set([
  ...BASE_VERBS, "rain", "snow", "be", "do", "get", "leave", "arrive", "move", "change", "learn", "open",
  "travel", "fly", "build", "buy", "send", "show", "win", "lose",
]);
/** Verbs that take an -ing form, not "to", right after them. */
const GERUND_VERBS = set(
  "enjoy", "avoid", "finish", "mind", "suggest", "consider", "keep", "stop", "practise", "practice", "risk",
  "admit", "deny", "miss", "delay", "imagine", "recommend", "quit", "postpone", "discuss", "mention",
);
/** The subject pronouns that come between "wish" and the past form: I wish I had… */
const WISH_SUBJECT = set("i", "he", "she", "it", "we", "they", "you");
const BETTER_WORSE = set("better", "worse");
const MORE_LESS = set("more", "less");
/** Short past forms that are not in the irregular list. */
const PAST_EXTRA = set("was", "were", "had", "could", "did");
/** Words that end in -er but are not a comparative. */
const NOT_ER = set(
  "never", "ever", "other", "over", "under", "after", "water", "number", "paper", "sister", "brother",
  "mother", "father", "daughter", "letter", "summer", "winter", "dinner", "answer", "computer", "teacher",
  "player", "river", "power", "order", "offer", "flower", "tower", "cover", "rather", "whether", "either",
  "neither", "together", "clever", "super", "proper", "wonder", "finger", "corner", "monster", "danger",
  "anger", "hunger", "butter", "lover", "poster",
);
/** Uncountable nouns: they take "much", never "many". */
const UNCOUNTABLE = set(
  "water", "money", "time", "information", "advice", "work", "news", "furniture", "traffic", "homework",
  "weather", "luggage", "rice", "sugar", "milk", "bread", "coffee", "tea", "music", "knowledge",
  "equipment", "progress", "evidence", "sand", "salt", "air", "food", "butter", "cheese", "software",
  "hair", "fun",
);
const IRREGULAR_PLURAL = set("people", "children", "men", "women", "feet", "teeth", "mice", "geese");

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

/** An -ing verb form (writing, leaving), not a noun or an adjective from the list above. */
function isIng(word: string): boolean {
  return word.length >= 5 && word.endsWith("ing") && /^[a-z]+$/.test(word) && !ING_NOT_VERB.has(word);
}

/** A past participle: an irregular one from the list, or a regular one ending in -ed. */
function isParticiple(word: string): boolean {
  if (IRREGULAR_PARTICIPLE.has(word)) return true;
  return word.length >= 4 && word.endsWith("ed") && !NOT_PAST_ED.has(word) && /^[a-z]+$/.test(word);
}

/** A past form: after "wish", or in an if-clause (I had, it was, she knew). */
function isPastForm(word: string): boolean {
  return IRREGULAR_PAST.has(word) || isRegularPast(word) || PAST_EXTRA.has(word);
}

/** A comparative with -er (taller, bigger), not a word that only ends in -er (never, other). */
function isComparativeEr(word: string): boolean {
  return word.length >= 4 && /^[a-z]+er$/.test(word) && !NOT_ER.has(word);
}

/** True when an if-clause before position j holds a past form: "if I had…, I would…" (the second conditional). */
function ifClauseIsPast(words: readonly string[], j: number): boolean {
  if (j <= 0) return false;
  const k = words.lastIndexOf("if", j - 1);
  return k >= 0 && words.slice(k + 1, j).some((word) => isPastForm(word));
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
    case "present-continuous":
      return all((j) => isIng(at(j)) && PRESENT_BE.has(at(j - 1)) && at(j - 2) !== "there");
    case "past-continuous":
      return all((j) => isIng(at(j)) && PAST_BE.has(at(j - 1)));
    case "present-perfect":
      return all(
        (j) =>
          isParticiple(at(j)) &&
          !isIng(at(j + 1)) &&
          (HAVE_AUX.has(at(j - 1)) || (ADVERB_BEFORE_PARTICIPLE.has(at(j - 1)) && HAVE_AUX.has(at(j - 2)))),
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
          (at(b - 1) === "had" || (ADVERB_BEFORE_PARTICIPLE.has(at(b - 1)) && at(b - 2) === "had")) &&
          !isIng(at(b + 1)) &&
          at(b) !== "to",
      );
    case "passive":
      return all((b) => PASSIVE_PARTICIPLE.has(at(b)) && PASSIVE_BE.has(at(b - 1)) && at(b + 1) !== "to");
    case "wish-past":
      return all((b) => isPastForm(at(b)) && WISH_SUBJECT.has(at(b - 1)) && at(b - 2) === "wish");
    case "should-have":
      return all((b) => isParticiple(at(b)) && at(b - 1) === "have" && at(b - 2) === "should");
    case "gerund-after":
      return all((b) => isIng(at(b)) && GERUND_VERBS.has(at(b - 1)));
  }
}
