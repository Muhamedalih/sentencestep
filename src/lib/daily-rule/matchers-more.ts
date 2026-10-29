/**
 * The matchers of the rules added to the syllabus after the first 39 (see syllabus.ts): the same kind of
 * small, explicit rule as matchers.ts, each with its exclusions written out, so a false friend is never
 * blanked as a grammar form. A matcher gives the indexes of the words that show its rule in a sentence,
 * in reading order; the first becomes the blank. A rule with no matcher at all ("none") is one no single
 * word shows (every sentence needs a verb, present simple against present continuous): it is taught from
 * its prepared sentences (teach.ts), never from a story.
 *
 * Each rule's right sentence (teach.ts) must be found by its own matcher: teach.test.ts checks it.
 */

import {
  ADVERB_BEFORE_PARTICIPLE,
  BASE_VERBS,
  HAVE_AUX,
  IRREGULAR_PARTICIPLE,
  PASSIVE_BE,
  PASSIVE_PARTICIPLE,
  PAST_BE,
  PRESENT_BE,
  SUBJECT,
  WISH_SUBJECT,
  isComparativeEr,
  isIng,
  isParticiple,
  isRegularPast,
  set,
} from "./matcher-words";
import type { Token } from "./tokens";

/** What a matcher sees of one sentence. */
export interface MatchContext {
  tokens: readonly Token[];
  /** The whole sentence as written. */
  text: string;
  /** The words, lower case. */
  w: readonly string[];
  /** The sentence is a question (it ends with a question mark). */
  question: boolean;
  /** The word at an index, "" outside the sentence. */
  at: (index: number) => string;
  /** Every index whose word passes the test. */
  all: (test: (index: number) => boolean) => number[];
}

type Matcher = (c: MatchContext) => number[];

const WH = set("what", "where", "who", "when", "why", "how", "which", "whose");
const DETERMINERS = set(
  "the",
  "a",
  "an",
  "my",
  "your",
  "his",
  "her",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
  "some",
  "any",
);
const FEELINGS = set(
  "hungry",
  "thirsty",
  "cold",
  "hot",
  "tired",
  "sleepy",
  "afraid",
  "scared",
  "angry",
  "happy",
  "sad",
  "sorry",
  "ready",
  "busy",
  "ill",
  "sick",
  "bored",
  "worried",
  "nervous",
);
const HAVE_GOT_BEFORE = set(
  "have",
  "has",
  "i've",
  "you've",
  "we've",
  "they've",
  "he's",
  "she's",
  "it's",
  "haven't",
  "hasn't",
);
const POSSESSIVE_PRONOUN = set("mine", "yours", "ours", "theirs", "hers");
const MANNER = set(
  "slowly",
  "quickly",
  "carefully",
  "quietly",
  "loudly",
  "happily",
  "easily",
  "badly",
  "softly",
  "angrily",
  "politely",
  "gently",
  "clearly",
  "well",
  "bravely",
  "safely",
  "patiently",
  "neatly",
  "kindly",
  "nicely",
);
const LIKE_VERBS = set(
  "like",
  "likes",
  "liked",
  "love",
  "loves",
  "loved",
  "hate",
  "hates",
  "hated",
);
const WANT_VERBS = set("want", "wants", "wanted", "need", "needs", "needed");
const OBJ = set("me", "you", "him", "her", "us", "them", "it");
const MODALS = set(
  "can",
  "could",
  "must",
  "should",
  "will",
  "would",
  "may",
  "might",
  "shall",
  "can't",
  "couldn't",
  "mustn't",
  "shouldn't",
  "won't",
  "wouldn't",
);
const INDIRECT_PREV = set(
  "know",
  "knew",
  "wonder",
  "wondered",
  "ask",
  "asked",
  "tell",
  "told",
  "see",
  "understand",
  "remember",
  "show",
);
const SAID = set(
  "said",
  "explained",
  "thought",
  "knew",
  "believed",
  "hoped",
  "promised",
  "replied",
  "answered",
  "added",
  "felt",
);
const VERB_TO = set(
  "hope",
  "hoped",
  "hopes",
  "plan",
  "planned",
  "plans",
  "decide",
  "decided",
  "decides",
  "promise",
  "promised",
  "agree",
  "agreed",
  "refuse",
  "refused",
  "learn",
  "learned",
  "manage",
  "managed",
  "offer",
  "offered",
  "expect",
  "expected",
  "afford",
);
const VERB_OBJ_TO = set(
  "told",
  "tell",
  "asked",
  "ask",
  "wanted",
  "want",
  "wants",
  "advised",
  "allowed",
  "invited",
  "taught",
  "expected",
  "ordered",
  "needed",
);
const LIKE_OR_PREFER = set(
  "like",
  "likes",
  "love",
  "loves",
  "hate",
  "hates",
  "prefer",
  "prefers",
  "preferred",
);
const NOT_EST = set(
  "interest",
  "forest",
  "west",
  "east",
  "honest",
  "modest",
  "nest",
  "rest",
  "test",
  "guest",
  "chest",
  "pest",
  "quest",
  "request",
  "suggest",
  "invest",
  "protest",
  "contest",
  "harvest",
  "arrest",
  "unrest",
  "digest",
  "vest",
  "zest",
  "crest",
  "manifest",
  "earnest",
);
const ED_ING_ADJECTIVE = set(
  "bored",
  "boring",
  "tired",
  "tiring",
  "excited",
  "exciting",
  "interested",
  "interesting",
  "surprised",
  "surprising",
  "confused",
  "confusing",
  "amazed",
  "amazing",
  "worried",
  "worrying",
  "frightened",
  "frightening",
  "annoyed",
  "annoying",
  "disappointed",
  "disappointing",
  "shocked",
  "shocking",
  "embarrassed",
  "embarrassing",
  "relaxed",
  "relaxing",
  "depressed",
  "depressing",
  "exhausted",
  "exhausting",
);
const SOME_COMPOUND = set(
  "something",
  "anything",
  "nothing",
  "someone",
  "anyone",
  "somebody",
  "anybody",
  "nobody",
  "somewhere",
  "anywhere",
  "nowhere",
);
const REFLEXIVE = set(
  "myself",
  "yourself",
  "himself",
  "herself",
  "itself",
  "ourselves",
  "yourselves",
  "themselves",
);
const ONE_BEFORE = set(
  "this",
  "that",
  "which",
  "another",
  "new",
  "old",
  "big",
  "small",
  "red",
  "blue",
  "green",
  "black",
  "white",
);
const TAG =
  /,\s*(?:isn't|aren't|wasn't|weren't|don't|doesn't|didn't|can't|couldn't|won't|wouldn't|shouldn't|haven't|hasn't|hadn't|am|is|are|was|were|do|does|did|can|could|will|would|should|have|has|had)\s+(?:i|you|he|she|it|we|they)\s*\?\s*$/i;
const SO_AUX = set(
  "do",
  "does",
  "did",
  "am",
  "is",
  "are",
  "was",
  "were",
  "can",
  "will",
  "have",
  "has",
);
const CAUSE = set("have", "has", "had", "get", "got", "having", "getting");
const REPORT_PARTICIPLE = set(
  "said",
  "believed",
  "thought",
  "known",
  "reported",
  "expected",
  "considered",
  "understood",
  "claimed",
  "alleged",
);
const ASKED = set("asked", "wondered", "wanted");
const REPORTING_VERBS = set(
  "suggested",
  "admitted",
  "denied",
  "promised",
  "warned",
  "advised",
  "insisted",
  "complained",
  "threatened",
  "refused",
  "offered",
  "agreed",
  "explained",
  "announced",
  "claimed",
);
const PREPS = set(
  "in",
  "on",
  "at",
  "to",
  "with",
  "by",
  "from",
  "for",
  "about",
  "of",
  "under",
  "behind",
);
const STOP_VERBS = set(
  "stop",
  "stopped",
  "stops",
  "remember",
  "remembered",
  "forget",
  "forgot",
  "try",
  "tried",
  "tries",
  "regret",
);
const PERCEPTION = set(
  "saw",
  "see",
  "sees",
  "heard",
  "hear",
  "watched",
  "watch",
  "noticed",
  "notice",
  "felt",
  "feel",
);
const FORMAL_LINKERS = set(
  "moreover",
  "whereas",
  "therefore",
  "furthermore",
  "nevertheless",
  "consequently",
  "meanwhile",
  "besides",
);
const NEGATIVE_FIRST = set("never", "rarely", "seldom", "hardly", "scarcely", "little");
const INVERSION_AUX = set(
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "will",
  "would",
  "should",
  "is",
  "are",
  "was",
  "were",
);
const DEPENDENT = new Map<string, string>([
  ["afraid", "of"],
  ["good", "at"],
  ["bad", "at"],
  ["interested", "in"],
  ["depend", "on"],
  ["depends", "on"],
  ["worried", "about"],
  ["proud", "of"],
  ["tired", "of"],
  ["responsible", "for"],
  ["famous", "for"],
  ["angry", "with"],
  ["different", "from"],
  ["listen", "to"],
  ["wait", "for"],
  ["look", "at"],
  ["think", "about"],
  ["believe", "in"],
  ["fond", "of"],
  ["keen", "on"],
  ["capable", "of"],
  ["suitable", "for"],
  ["jealous", "of"],
  ["similar", "to"],
  ["kind", "to"],
  ["rude", "to"],
  ["excited", "about"],
  ["surprised", "at"],
  ["married", "to"],
]);

const futureWill = (word: string): boolean => word === "will" || word.endsWith("'ll");
const haveOrHad = (word: string): boolean => HAVE_AUX.has(word) || word === "had";

export const EXTRA_MATCHERS = {
  // ------------------------------------------------------------------ A1
  "subject-pronoun": (c) => (SUBJECT.has(c.at(0)) ? [0] : []),
  "be-negative": (c) =>
    c.all(
      (i) =>
        c.at(i) === "isn't" ||
        c.at(i) === "aren't" ||
        (c.at(i) === "not" && PRESENT_BE.has(c.at(i - 1))),
    ),
  "be-question": (c) => (c.question && ["am", "is", "are"].includes(c.at(0)) ? [0] : []),
  "be-feeling": (c) =>
    c.all(
      (i) =>
        PRESENT_BE.has(c.at(i)) &&
        (FEELINGS.has(c.at(i + 1)) || (/^\d+$/.test(c.at(i + 1)) && c.at(i + 2) === "years")),
    ),
  "have-got": (c) => c.all((i) => c.at(i) === "got" && HAVE_GOT_BEFORE.has(c.at(i - 1))),
  "possessive-pronoun": (c) => c.all((i) => POSSESSIVE_PRONOUN.has(c.at(i))),
  "adverb-manner": (c) => c.all((i) => MANNER.has(c.at(i))),
  "wh-start-more": (c) =>
    c.question &&
    ["when", "why", "how"].includes(c.at(0)) &&
    !(c.at(0) === "how" && (c.at(1) === "much" || c.at(1) === "many"))
      ? [0]
      : [],
  "wh-do": (c) =>
    c.question && WH.has(c.at(0)) && (c.at(1) === "do" || c.at(1) === "does") ? [1] : [],
  "how-much-many": (c) =>
    c.question && c.at(0) === "how" && (c.at(1) === "much" || c.at(1) === "many") ? [1] : [],
  request: (c) =>
    c.question &&
    ["can", "could", "would", "shall"].includes(c.at(0)) &&
    ["i", "you", "we"].includes(c.at(1))
      ? [0]
      : [],
  lets: (c) => c.all((i) => c.at(i) === "let's"),
  "like-ing": (c) => c.all((i) => isIng(c.at(i)) && LIKE_VERBS.has(c.at(i - 1))),
  "want-to": (c) =>
    c.all(
      (i) =>
        c.at(i) === "to" &&
        WANT_VERBS.has(c.at(i - 1)) &&
        i + 1 < c.w.length &&
        !DETERMINERS.has(c.at(i + 1)),
    ),
  "place-more": (c) => c.all((i) => ["between", "behind", "near", "opposite"].includes(c.at(i))),
  "linker-basic": (c) => c.all((i) => i > 0 && (c.at(i) === "because" || c.at(i) === "but")),
  "there-was": (c) =>
    c.all((i) => (c.at(i) === "was" || c.at(i) === "were") && c.at(i - 1) === "there"),

  // --------------------------------------------------------------- A2–B1
  "when-while": (c) =>
    c.all(
      (i) => (c.at(i) === "while" || c.at(i) === "when") && SUBJECT.has(c.at(i + 1)) && !c.question,
    ),
  "used-to": (c) =>
    c.all(
      (i) =>
        c.at(i) === "used" &&
        c.at(i + 1) === "to" &&
        !PRESENT_BE.has(c.at(i - 1)) &&
        !PAST_BE.has(c.at(i - 1)) &&
        !["get", "got", "getting", "become", "became"].includes(c.at(i - 1)),
    ),
  "irregular-participle": (c) =>
    c.all(
      (i) =>
        IRREGULAR_PARTICIPLE.has(c.at(i)) &&
        !isIng(c.at(i + 1)) &&
        (haveOrHad(c.at(i - 1)) ||
          (ADVERB_BEFORE_PARTICIPLE.has(c.at(i - 1)) && haveOrHad(c.at(i - 2)))),
    ),
  "time-clause": (c) =>
    c.all(
      (i) =>
        ["when", "while", "before", "after", "until"].includes(c.at(i)) &&
        SUBJECT.has(c.at(i + 1)) &&
        !c.question,
    ),
  "for-since": (c) =>
    c.all(
      (i) =>
        i > 0 &&
        c.w.slice(0, i).some(haveOrHad) &&
        (c.at(i) === "since" ||
          (c.at(i) === "for" &&
            /^(?:\d+|a|an|two|three|four|five|six|seven|eight|nine|ten|several|many|ages|hours|years|months|weeks|days)$/.test(
              c.at(i + 1),
            ))),
    ),
  "just-already-yet": (c) =>
    c.all(
      (i) => ["just", "already", "yet"].includes(c.at(i)) && c.w.slice(0, i + 1).some(haveOrHad),
    ),
  "been-gone": (c) =>
    c.all(
      (i) =>
        (c.at(i) === "been" || c.at(i) === "gone") &&
        !isIng(c.at(i + 1)) &&
        (HAVE_AUX.has(c.at(i - 1)) ||
          (ADVERB_BEFORE_PARTICIPLE.has(c.at(i - 1)) && HAVE_AUX.has(c.at(i - 2)))),
    ),
  "ever-question": (c) =>
    c.question && ["have", "has"].includes(c.at(0)) && c.w.includes("ever")
      ? [c.w.indexOf("ever")]
      : [],
  "continuous-future": (c) =>
    c.all(
      (j) =>
        isIng(c.at(j)) &&
        PRESENT_BE.has(c.at(j - 1)) &&
        c.at(j - 2) !== "there" &&
        c.w.some((x) => ["tomorrow", "tonight", "next"].includes(x)),
    ),
  will: (c) =>
    c.all(
      (i) =>
        (c.at(i) === "will" || /^(?:i|you|he|she|it|we|they)'ll$/.test(c.at(i))) &&
        !c.w.includes("if"),
    ),
  "future-clause": (c) =>
    c.all(
      (i) =>
        ["when", "before", "after", "until"].includes(c.at(i)) &&
        SUBJECT.has(c.at(i + 1)) &&
        c.w.some(futureWill),
    ),
  should: (c) =>
    c.all((i) => (c.at(i) === "should" || c.at(i) === "shouldn't") && c.at(i + 1) !== "have"),
  "have-to": (c) => c.all((i) => ["have", "has", "had"].includes(c.at(i)) && c.at(i + 1) === "to"),
  "may-might": (c) =>
    c.all((i) => (c.at(i) === "may" || c.at(i) === "might") && c.at(i + 1) !== "have"),
  could: (c) =>
    c.all((i) => (c.at(i) === "could" || c.at(i) === "couldn't") && c.at(i + 1) !== "have"),
  "able-to": (c) => c.all((i) => c.at(i) === "able" && c.at(i + 1) === "to"),
  "need-to": (c) =>
    c.all(
      (i) =>
        c.at(i) === "needn't" ||
        (["need", "needs", "needed"].includes(c.at(i)) && c.at(i + 1) === "to"),
    ),
  superlative: (c) =>
    c.all(
      (i) =>
        c.at(i - 1) === "the" &&
        ((/^[a-z]{3,}est$/.test(c.at(i)) && !NOT_EST.has(c.at(i))) ||
          c.at(i) === "best" ||
          c.at(i) === "worst" ||
          (c.at(i) === "most" &&
            /^[a-z]+(?:ive|ful|ous|ing|ed|able|ible|ant|ent|al|ic|ish|less)$/.test(c.at(i + 1)))),
    ),
  "as-as": (c) => c.all((i) => c.at(i) === "as" && c.at(i + 2) === "as" && c.at(i + 1) !== "soon"),
  "too-enough": (c) =>
    c.all((i) => c.at(i) === "enough" || (c.at(i) === "too" && i + 1 < c.w.length)),
  such: (c) => c.all((i) => c.at(i) === "such"),
  "ed-ing-adjective": (c) => c.all((i) => ED_ING_ADJECTIVE.has(c.at(i))),
  "few-little": (c) =>
    c.all((i) => (c.at(i) === "few" || c.at(i) === "little") && c.at(i - 1) === "a"),
  "some-compound": (c) => c.all((i) => SOME_COMPOUND.has(c.at(i))),
  "all-both": (c) =>
    c.all(
      (i) =>
        (["both", "every", "most"].includes(c.at(i)) ||
          (c.at(i) === "each" && c.at(i + 1) !== "other") ||
          (c.at(i) === "all" &&
            ["the", "my", "your", "his", "her", "our", "their", "of", "these", "those"].includes(
              c.at(i + 1),
            ))) &&
        i + 1 < c.w.length,
    ),
  "the-unique": (c) =>
    c.all(
      (i) =>
        c.at(i) === "the" &&
        ["sun", "moon", "sky", "world", "earth", "internet", "weather", "ocean", "sea"].includes(
          c.at(i + 1),
        ),
    ),
  reflexive: (c) =>
    c.all((i) => REFLEXIVE.has(c.at(i)) || (c.at(i) === "each" && c.at(i + 1) === "other")),
  "one-ones": (c) =>
    c.all((i) => c.at(i) === "ones" || (c.at(i) === "one" && ONE_BEFORE.has(c.at(i - 1)))),
  "question-tag": (c) =>
    c.question && c.tokens.length >= 4 && TAG.test(c.text) ? [c.tokens.length - 2] : [],
  "indirect-question": (c) =>
    c.all(
      (i) =>
        (WH.has(c.at(i)) || c.at(i) === "if") &&
        (INDIRECT_PREV.has(c.at(i - 1)) ||
          (OBJ.has(c.at(i - 1)) && ["tell", "told", "ask", "asked"].includes(c.at(i - 2)))),
    ),
  "so-neither": (c) =>
    c.all(
      (i) =>
        (c.at(i) === "so" || c.at(i) === "neither") &&
        SO_AUX.has(c.at(i + 1)) &&
        SUBJECT.has(c.at(i + 2)),
    ),
  suggestion: (c) =>
    (c.at(0) === "how" && c.at(1) === "about") ||
    (c.at(0) === "what" && c.at(1) === "about") ||
    (c.at(0) === "why" && c.at(1) === "don't")
      ? [1]
      : [],
  unless: (c) => c.all((i) => c.at(i) === "unless"),
  "relative-who": (c) =>
    c.all(
      (i) =>
        (c.at(i) === "who" || c.at(i) === "which") &&
        i > 0 &&
        !c.question &&
        !INDIRECT_PREV.has(c.at(i - 1)),
    ),
  "relative-where": (c) =>
    c.all(
      (i) =>
        i > 0 &&
        !c.question &&
        ((c.at(i) === "where" && !INDIRECT_PREV.has(c.at(i - 1))) || c.at(i) === "whose"),
    ),
  "reported-that": (c) =>
    c.all(
      (i) =>
        c.at(i) === "that" &&
        (SAID.has(c.at(i - 1)) || (["told", "tell"].includes(c.at(i - 2)) && OBJ.has(c.at(i - 1)))),
    ),
  although: (c) => c.all((i) => ["although", "though", "however"].includes(c.at(i))),
  purpose: (c) =>
    c.all(
      (i) =>
        (c.at(i) === "so" && c.at(i + 1) === "that") ||
        (c.at(i) === "order" && c.at(i - 1) === "in" && c.at(i + 1) === "to"),
    ),
  "verb-to": (c) => c.all((i) => c.at(i) === "to" && VERB_TO.has(c.at(i - 1))),
  "verb-obj-to": (c) =>
    c.all((i) => c.at(i) === "to" && OBJ.has(c.at(i - 1)) && VERB_OBJ_TO.has(c.at(i - 2))),
  "like-to": (c) =>
    c.all(
      (i) =>
        (c.at(i) === "to" && LIKE_OR_PREFER.has(c.at(i - 1))) ||
        (isIng(c.at(i)) && ["prefer", "prefers", "preferred"].includes(c.at(i - 1))),
    ),

  // ------------------------------------------------------------------ B2
  "past-perfect-continuous": (c) =>
    c.all((j) => isIng(c.at(j)) && c.at(j - 1) === "been" && c.at(j - 2) === "had"),
  "future-continuous": (c) =>
    c.all((j) => isIng(c.at(j)) && c.at(j - 1) === "be" && futureWill(c.at(j - 2))),
  "future-perfect": (c) =>
    c.all((j) => isParticiple(c.at(j)) && c.at(j - 1) === "have" && futureWill(c.at(j - 2))),
  "be-used-to": (c) =>
    c.all(
      (i) =>
        c.at(i) === "used" &&
        c.at(i + 1) === "to" &&
        (PRESENT_BE.has(c.at(i - 1)) ||
          PAST_BE.has(c.at(i - 1)) ||
          ["get", "got", "getting", "become", "became", "be"].includes(c.at(i - 1))),
    ),
  "third-conditional": (c) =>
    c.w.includes("if") && c.w.includes("had")
      ? c.all((j) => c.at(j) === "would've" || (c.at(j) === "would" && c.at(j + 1) === "have"))
      : [],
  "wish-past-perfect": (c) =>
    c.all(
      (b) =>
        c.at(b) === "had" &&
        isParticiple(c.at(b + 1)) &&
        ((c.at(b - 2) === "wish" && WISH_SUBJECT.has(c.at(b - 1))) ||
          (c.at(b - 3) === "if" && c.at(b - 2) === "only")),
    ),
  "wish-would": (c) =>
    c.all(
      (i) =>
        c.at(i) === "would" &&
        c.at(i - 2) === "wish" &&
        ["you", "they", "he", "she", "it", "people", "someone"].includes(c.at(i - 1)),
    ),
  "conditional-linker": (c) =>
    c.all(
      (i) =>
        ["provided", "providing", "otherwise"].includes(c.at(i)) ||
        (c.at(i) === "case" && c.at(i - 1) === "in") ||
        (c.at(i) === "long" && c.at(i - 1) === "as" && c.at(i + 1) === "as"),
    ),
  "would-rather": (c) =>
    c.all(
      (i) =>
        c.at(i) === "rather" &&
        (c.at(i - 1) === "would" || /^(?:i|you|he|she|it|we|they)'d$/.test(c.at(i - 1))),
    ),
  "passive-modal": (c) =>
    c.all(
      (b) => PASSIVE_PARTICIPLE.has(c.at(b)) && c.at(b - 1) === "be" && MODALS.has(c.at(b - 2)),
    ),
  "passive-perfect": (c) =>
    c.all(
      (b) =>
        PASSIVE_PARTICIPLE.has(c.at(b)) &&
        ((c.at(b - 1) === "been" && haveOrHad(c.at(b - 2))) || c.at(b - 1) === "being"),
    ),
  "passive-reporting": (c) =>
    c.all(
      (i) =>
        REPORT_PARTICIPLE.has(c.at(i)) &&
        PASSIVE_BE.has(c.at(i - 1)) &&
        (c.at(i + 1) === "to" || c.at(i + 1) === "that"),
    ),
  causative: (c) =>
    c.all((i) => isParticiple(c.at(i)) && CAUSE.has(c.at(i - 3)) && DETERMINERS.has(c.at(i - 2))),
  "reported-question": (c) =>
    c.all(
      (i) =>
        ((c.at(i) === "if" || c.at(i) === "whether") &&
          [c.at(i - 1), c.at(i - 2), c.at(i - 3)].some((x) => ASKED.has(x))) ||
        (WH.has(c.at(i)) &&
          (ASKED.has(c.at(i - 1)) || (ASKED.has(c.at(i - 2)) && OBJ.has(c.at(i - 1))))),
    ),
  "reported-command": (c) =>
    c.all(
      (i) =>
        c.at(i) === "to" &&
        OBJ.has(c.at(i - 1)) &&
        ["told", "asked", "ordered", "warned", "advised", "begged", "reminded"].includes(
          c.at(i - 2),
        ),
    ),
  "reporting-verb": (c) => c.all((i) => REPORTING_VERBS.has(c.at(i))),
  deduction: (c) =>
    c.all(
      (i) =>
        ["must", "can't", "couldn't", "might", "may", "could"].includes(c.at(i)) &&
        c.at(i + 1) === "be" &&
        !PASSIVE_PARTICIPLE.has(c.at(i + 2)),
    ),
  "deduction-past": (c) =>
    c.all(
      (i) =>
        ["must", "can't", "couldn't", "might", "may"].includes(c.at(i)) &&
        c.at(i + 1) === "have" &&
        isParticiple(c.at(i + 2)),
    ),
  "had-better": (c) =>
    c.all(
      (i) =>
        (c.at(i) === "better" &&
          (c.at(i - 1) === "had" || /^(?:i|you|he|she|it|we|they)'d$/.test(c.at(i - 1)))) ||
        (c.at(i) === "ought" && c.at(i + 1) === "to"),
    ),
  "supposed-to": (c) =>
    c.all(
      (i) =>
        (c.at(i) === "supposed" || c.at(i) === "allowed") &&
        c.at(i + 1) === "to" &&
        (PRESENT_BE.has(c.at(i - 1)) || PAST_BE.has(c.at(i - 1)) || c.at(i - 1) === "be"),
    ),
  "non-defining": (c) =>
    c.all(
      (i) =>
        i > 0 &&
        ["who", "which", "whose", "where"].includes(c.at(i)) &&
        c.text.slice(0, c.tokens[i]!.start).trimEnd().endsWith(","),
    ),
  "relative-prep": (c) =>
    c.all((i) => (c.at(i) === "whom" || c.at(i) === "which") && PREPS.has(c.at(i - 1))),
  "participle-clause": (c) => {
    const comma = c.text.indexOf(",");
    if (comma < 0) return [];
    const before = c.tokens.filter((token) => token.end <= comma).length;
    return (isIng(c.at(0)) || c.at(0) === "having") && before >= 2 && before <= 6 ? [0] : [];
  },
  "stop-remember": (c) =>
    c.all((i) => STOP_VERBS.has(c.at(i - 1)) && (isIng(c.at(i)) || c.at(i) === "to")),
  "perception-ing": (c) =>
    c.all((i) => isIng(c.at(i)) && OBJ.has(c.at(i - 1)) && PERCEPTION.has(c.at(i - 2))),
  "make-let": (c) =>
    c.all(
      (i) =>
        BASE_VERBS.has(c.at(i)) &&
        !isRegularPast(c.at(i)) &&
        OBJ.has(c.at(i - 1)) &&
        ["make", "made", "makes", "let", "lets"].includes(c.at(i - 2)),
    ),
  despite: (c) =>
    c.all((i) => c.at(i) === "despite" || (c.at(i) === "spite" && c.at(i - 1) === "in")),
  "formal-linker": (c) => c.all((i) => FORMAL_LINKERS.has(c.at(i))),
  cleft: (c) => {
    if (c.at(0) === "it" && (c.at(1) === "was" || c.at(1) === "is")) {
      const k = c.w.findIndex(
        (word, index) => index > 1 && index <= 8 && (word === "who" || word === "that"),
      );
      return k > 0 ? [k] : [];
    }
    return c.at(0) === "what" && SUBJECT.has(c.at(1)) ? [0] : [];
  },
  inversion: (c) => {
    if (NEGATIVE_FIRST.has(c.at(0)) && INVERSION_AUX.has(c.at(1))) return [0];
    return c.at(0) === "not" && c.at(1) === "only" ? [1] : [];
  },
  "less-fewer": (c) =>
    c.all(
      (i) =>
        c.at(i) === "fewer" ||
        (c.at(i) === "number" && c.at(i + 1) === "of" && ["a", "the"].includes(c.at(i - 1))),
    ),
  "the-more": (c) =>
    c.all(
      (i) =>
        c.at(i) === "the" &&
        (c.at(i + 1) === "more" || c.at(i + 1) === "less" || isComparativeEr(c.at(i + 1))) &&
        c.w.indexOf("the", i + 1) > i,
    ),
  "dependent-prep": (c) => c.all((i) => DEPENDENT.get(c.at(i - 1)) === c.at(i)),
} satisfies Record<string, Matcher>;

export type ExtraMatchKind = keyof typeof EXTRA_MATCHERS;

/** The extra matcher of a kind, if it has one. */
export function extraMatcher(kind: string): Matcher | undefined {
  return (EXTRA_MATCHERS as Record<string, Matcher>)[kind];
}
