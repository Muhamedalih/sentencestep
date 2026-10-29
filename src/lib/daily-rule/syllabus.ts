/**
 * The syllabus of the rule of the day: every rule, in the order it is opened, level by level (A1, then
 * A2–B1, then B2). One rule opens a day for a learner, the next one in this order that they have not met
 * (a rule their story of the day shows may come a little earlier: see planRuleVisit), so the order is the
 * course. The units group the rules for the library's map (units.ts). Only what the engine needs to place a
 * rule is here; what a rule teaches is in teach.ts. Ids never change and are never reused: the first 39
 * (a1-01 ... a1-24, a2-01 ... a2-08, b2-01 ... b2-07) were written before the syllabus and keep theirs.
 */

import type { MarkStyle, MatchKind, RuleFamily, RuleLevel, RuleSpec } from "./ladder";

export type SyllabusEntry = Omit<RuleSpec, "order">;

type Extra = { mark?: MarkStyle; words?: readonly string[] };

function entry(
  level: RuleLevel,
  id: string,
  unit: string,
  title: string,
  family: RuleFamily,
  match: MatchKind,
  extra: Extra = {},
): SyllabusEntry {
  return { id, level, unit, title, family, match, ...extra };
}

const a1 = (
  id: string,
  unit: string,
  title: string,
  family: RuleFamily,
  match: MatchKind,
  extra?: Extra,
) => entry("A1", id, unit, title, family, match, extra);

const A1: readonly SyllabusEntry[] = [
  // 1 · basics
  a1("a1-25", "a1-basics", "subject pronouns", "pronoun", "subject-pronoun"),
  a1("a1-01", "a1-basics", "am / is / are", "be", "be"),
  a1("a1-26", "a1-basics", "be: negatives", "be", "be-negative"),
  a1("a1-27", "a1-basics", "be: questions and short answers", "be", "be-question"),
  a1("a1-28", "a1-basics", "every sentence needs a verb", "be", "none"),
  a1("a1-29", "a1-basics", "age and feelings with be", "be", "be-feeling"),
  a1("a1-30", "a1-basics", "it for things and animals", "pronoun", "none"),
  a1("a1-02", "a1-basics", "a / an / the", "determiner", "article"),
  a1("a1-03", "a1-basics", "my / your / his / her", "determiner", "possessive"),
  // 2 · nouns and adjectives
  a1("a1-06", "a1-nouns", "this / that / these / those", "determiner", "this-that"),
  a1("a1-10", "a1-nouns", "plural nouns", "quantity", "plural"),
  a1("a1-31", "a1-nouns", "countable and uncountable nouns", "quantity", "none"),
  a1("a1-24", "a1-nouns", "some / any", "quantity", "some-any"),
  a1("a1-09", "a1-nouns", "possessive 's", "determiner", "possessive-s"),
  a1("a1-32", "a1-nouns", "possessive pronouns", "pronoun", "possessive-pronoun"),
  a1("a1-33", "a1-nouns", "adjectives come before nouns", "adjective", "none"),
  a1("a1-34", "a1-nouns", "adverbs of manner", "adverb", "adverb-manner", { mark: "ly" }),
  // 3 · present simple
  a1("a1-05", "a1-present", "I / you / we / they", "present", "present-base"),
  a1("a1-04", "a1-present", "he / she / it + -s", "present", "he-she-it-s"),
  a1("a1-18", "a1-present", "don't / doesn't", "negative", "dont-doesnt"),
  a1("a1-19", "a1-present", "do / does (questions)", "question", "do-does-question"),
  a1("a1-23", "a1-present", "always / usually / never", "frequency", "frequency"),
  a1("a1-35", "a1-present", "have got / has got", "present", "have-got"),
  // 4 · questions
  a1("a1-07", "a1-questions", "what / where / who", "question", "wh-start"),
  a1("a1-36", "a1-questions", "when / why / how", "question", "wh-start-more"),
  a1("a1-37", "a1-questions", "wh- questions with do / does", "question", "wh-do"),
  a1("a1-38", "a1-questions", "how much / how many", "question", "how-much-many"),
  a1("a1-21", "a1-questions", "there is / there are", "present", "there-is"),
  // 5 · modals, orders, patterns
  a1("a1-20", "a1-modals", "can", "modal", "can"),
  a1("a1-39", "a1-modals", "requests and offers", "modal", "request"),
  a1("a1-11", "a1-modals", "imperatives", "present", "imperative"),
  a1("a1-40", "a1-modals", "let's + verb", "verb-pattern", "lets"),
  a1("a1-41", "a1-modals", "like / love / hate + -ing", "verb-pattern", "like-ing", {
    mark: "ing",
  }),
  a1("a1-42", "a1-modals", "want / need + to + verb", "verb-pattern", "want-to"),
  // 6 · prepositions and linking
  a1("a1-08", "a1-linking", "in / on / under", "preposition", "place"),
  a1("a1-43", "a1-linking", "more prepositions of place", "preposition", "place-more"),
  a1("a1-22", "a1-linking", "in / on / at (time)", "preposition", "time-prep"),
  a1("a1-12", "a1-linking", "object pronouns", "pronoun", "object-pronoun"),
  a1("a1-44", "a1-linking", "linking words: and, but, or, because, so", "linking", "linker-basic"),
  // 7 · past
  a1("a1-13", "a1-past", "regular past (-ed)", "past", "regular-past"),
  a1("a1-14", "a1-past", "irregular past", "past", "irregular-past"),
  a1("a1-15", "a1-past", "was / were", "past", "was-were"),
  a1("a1-16", "a1-past", "did (questions)", "question", "did-question"),
  a1("a1-17", "a1-past", "didn't", "negative", "didnt"),
  a1("a1-45", "a1-past", "there was / there were", "past", "there-was"),
];

const a2 = (
  id: string,
  unit: string,
  title: string,
  family: RuleFamily,
  match: MatchKind,
  extra?: Extra,
) => entry("A2-B1", id, unit, title, family, match, extra);

const A2: readonly SyllabusEntry[] = [
  // 1 · present and past
  a2("a2-01", "a2-tenses", "am / is / are + -ing", "present", "present-continuous"),
  a2("a2-09", "a2-tenses", "present simple or present continuous", "present", "none"),
  a2("a2-10", "a2-tenses", "stative verbs (know, like, want)", "present", "none"),
  a2("a2-11", "a2-tenses", "spelling of -ing and -ed forms", "present", "none", { mark: "ed-ing" }),
  a2("a2-02", "a2-tenses", "was / were + -ing", "past", "past-continuous"),
  a2("a2-12", "a2-tenses", "past simple or past continuous (when / while)", "past", "when-while"),
  a2("a2-13", "a2-tenses", "used to + verb", "past", "used-to"),
  a2("a2-14", "a2-tenses", "irregular past participles", "perfect", "irregular-participle"),
  a2(
    "a2-15",
    "a2-tenses",
    "time clauses: when, while, before, after, until",
    "linking",
    "time-clause",
  ),
  // 2 · present perfect
  a2("a2-03", "a2-perfect", "have / has + past participle", "perfect", "present-perfect"),
  a2("a2-16", "a2-perfect", "for / since", "perfect", "for-since"),
  a2("a2-17", "a2-perfect", "just / already / yet", "perfect", "just-already-yet"),
  a2("a2-18", "a2-perfect", "present perfect or past simple", "perfect", "none"),
  a2("a2-19", "a2-perfect", "how long…? been or gone", "perfect", "been-gone"),
  a2("a2-20", "a2-perfect", "questions with ever", "perfect", "ever-question"),
  // 3 · future
  a2("a2-04", "a2-future", "am / is / are going to", "future", "going-to"),
  a2("a2-21", "a2-future", "present continuous for plans", "future", "continuous-future", {
    mark: "ing",
  }),
  a2("a2-22", "a2-future", "will: predictions, offers, promises", "future", "will"),
  a2("a2-23", "a2-future", "will or going to", "future", "none"),
  a2("a2-24", "a2-future", "present simple for timetables", "future", "none"),
  a2("a2-25", "a2-future", "time clauses for the future", "future", "future-clause"),
  // 4 · modal verbs
  a2("a2-06", "a2-modals", "must / mustn't", "modal", "must"),
  a2("a2-26", "a2-modals", "should / shouldn't", "modal", "should"),
  a2("a2-27", "a2-modals", "have to / don't have to", "modal", "have-to"),
  a2("a2-28", "a2-modals", "may / might", "modal", "may-might"),
  a2("a2-29", "a2-modals", "could / couldn't", "modal", "could"),
  a2("a2-30", "a2-modals", "be able to", "modal", "able-to"),
  a2("a2-31", "a2-modals", "need to / needn't", "modal", "need-to"),
  // 5 · comparison and degree
  a2("a2-05", "a2-comparison", "-er / more + than", "comparison", "comparative"),
  a2("a2-32", "a2-comparison", "superlatives", "comparison", "superlative", { mark: "est" }),
  a2("a2-33", "a2-comparison", "as … as", "comparison", "as-as"),
  a2("a2-34", "a2-comparison", "too / enough", "comparison", "too-enough"),
  a2("a2-35", "a2-comparison", "so / such", "comparison", "such"),
  a2("a2-36", "a2-comparison", "-ed and -ing adjectives", "adjective", "ed-ing-adjective", {
    mark: "ed-ing",
  }),
  a2("a2-37", "a2-comparison", "comparing adverbs", "comparison", "none"),
  // 6 · quantity, nouns and pronouns
  a2("a2-08", "a2-nouns", "many / much", "quantity", "much-many"),
  a2("a2-38", "a2-nouns", "a few / a little", "quantity", "few-little"),
  a2("a2-39", "a2-nouns", "something, anyone, nobody", "quantity", "some-compound"),
  a2("a2-40", "a2-nouns", "all / both / every / each / most", "quantity", "all-both"),
  a2("a2-41", "a2-nouns", "no article (I like music)", "determiner", "none"),
  a2("a2-42", "a2-nouns", "the: unique things and places", "determiner", "the-unique"),
  a2("a2-43", "a2-nouns", "reflexive pronouns and each other", "pronoun", "reflexive"),
  a2("a2-44", "a2-nouns", "one / ones", "pronoun", "one-ones"),
  // 7 · questions and replies
  a2("a2-45", "a2-replies", "question tags", "question", "question-tag"),
  a2("a2-46", "a2-replies", "indirect questions", "question", "indirect-question"),
  a2("a2-47", "a2-replies", "subject and object questions", "question", "none"),
  a2("a2-48", "a2-replies", "So do I / Neither do I", "question", "so-neither"),
  a2("a2-49", "a2-replies", "suggestions: Why don't we…? How about…?", "question", "suggestion"),
  // 8 · clauses and linking
  a2("a2-07", "a2-clauses", "if + present, will", "conditional", "first-conditional"),
  a2("a2-50", "a2-clauses", "zero conditional", "conditional", "none"),
  a2("a2-51", "a2-clauses", "unless", "conditional", "unless"),
  a2("a2-52", "a2-clauses", "relative clauses: who, which, that", "relative", "relative-who"),
  a2("a2-53", "a2-clauses", "relative clauses: where, whose", "relative", "relative-where"),
  a2("a2-54", "a2-clauses", "reported speech: statements", "reported", "reported-that"),
  a2("a2-55", "a2-clauses", "although / however", "linking", "although"),
  a2("a2-56", "a2-clauses", "purpose: to, for, so that", "linking", "purpose"),
  // 9 · verb patterns
  a2("a2-57", "a2-patterns", "verb + to + verb (want, hope, plan)", "verb-pattern", "verb-to"),
  a2("a2-58", "a2-patterns", "verb + person + to + verb", "verb-pattern", "verb-obj-to"),
  a2("a2-59", "a2-patterns", "like / prefer: -ing or to", "verb-pattern", "like-to"),
  a2("a2-60", "a2-patterns", "phrasal verbs", "verb-pattern", "none"),
];

const b2 = (
  id: string,
  unit: string,
  title: string,
  family: RuleFamily,
  match: MatchKind,
  extra?: Extra,
) => entry("B2", id, unit, title, family, match, extra);

const B2: readonly SyllabusEntry[] = [
  // 1 · advanced tenses
  b2("b2-02", "b2-tenses", "have been + -ing", "perfect", "perfect-continuous"),
  b2("b2-08", "b2-tenses", "present perfect simple or continuous", "perfect", "none"),
  b2("b2-03", "b2-tenses", "had + past participle", "perfect", "past-perfect"),
  b2("b2-09", "b2-tenses", "had been + -ing", "perfect", "past-perfect-continuous", {
    mark: "ing",
  }),
  b2("b2-10", "b2-tenses", "narrative tenses", "past", "none"),
  b2("b2-11", "b2-tenses", "will be + -ing", "future", "future-continuous", { mark: "ing" }),
  b2("b2-12", "b2-tenses", "will have + past participle", "future", "future-perfect", {
    mark: "ed",
  }),
  b2("b2-13", "b2-tenses", "used to or would", "past", "none"),
  b2("b2-14", "b2-tenses", "be used to / get used to + -ing", "verb-pattern", "be-used-to", {
    mark: "ing",
  }),
  // 2 · conditionals and wishes
  b2("b2-01", "b2-conditionals", "if + past, would", "conditional", "second-conditional"),
  b2("b2-15", "b2-conditionals", "third conditional", "conditional", "third-conditional"),
  b2("b2-16", "b2-conditionals", "mixed conditionals", "conditional", "none"),
  b2("b2-05", "b2-conditionals", "wish + past", "conditional", "wish-past"),
  b2(
    "b2-17",
    "b2-conditionals",
    "wish + past perfect, if only",
    "conditional",
    "wish-past-perfect",
  ),
  b2("b2-18", "b2-conditionals", "wish + would", "conditional", "wish-would"),
  b2(
    "b2-19",
    "b2-conditionals",
    "provided, as long as, in case, otherwise",
    "conditional",
    "conditional-linker",
  ),
  b2("b2-20", "b2-conditionals", "would rather, it's time + past", "conditional", "would-rather"),
  // 3 · passive and causative
  b2("b2-04", "b2-passive", "be + past participle", "passive", "passive"),
  b2("b2-21", "b2-passive", "passive with modals", "passive", "passive-modal", { mark: "ed" }),
  b2(
    "b2-22",
    "b2-passive",
    "passive: present perfect and continuous",
    "passive",
    "passive-perfect",
    { mark: "ed" },
  ),
  b2(
    "b2-23",
    "b2-passive",
    "passive reporting (It is said that…)",
    "passive",
    "passive-reporting",
    { mark: "ed" },
  ),
  b2("b2-24", "b2-passive", "have / get something done", "passive", "causative", { mark: "ed" }),
  // 4 · reported speech
  b2("b2-25", "b2-reported", "tense changes in reported speech", "reported", "none"),
  b2("b2-26", "b2-reported", "reported questions", "reported", "reported-question"),
  b2("b2-27", "b2-reported", "reported commands and requests", "reported", "reported-command"),
  b2(
    "b2-28",
    "b2-reported",
    "reporting verbs (suggest, admit, promise)",
    "reported",
    "reporting-verb",
  ),
  // 5 · modal verbs
  b2("b2-29", "b2-modals", "modals of deduction: present", "modal", "deduction"),
  b2("b2-30", "b2-modals", "modals of deduction: past", "modal", "deduction-past"),
  b2("b2-06", "b2-modals", "should have + past participle", "perfect", "should-have"),
  b2("b2-31", "b2-modals", "had better / ought to", "modal", "had-better"),
  b2("b2-32", "b2-modals", "be supposed to / be allowed to", "modal", "supposed-to"),
  // 6 · relative and participle clauses
  b2("b2-33", "b2-clauses", "non-defining relative clauses", "relative", "non-defining"),
  b2("b2-34", "b2-clauses", "relative clauses with prepositions", "relative", "relative-prep"),
  b2("b2-35", "b2-clauses", "participle clauses", "structure", "participle-clause", {
    mark: "ing",
  }),
  // 7 · verb patterns
  b2("b2-07", "b2-patterns", "verb + -ing", "verb-pattern", "gerund-after", {
    words: ["enjoy", "avoid", "finish", "mind", "suggest", "consider", "keep", "practice"],
  }),
  b2(
    "b2-36",
    "b2-patterns",
    "stop, remember, forget, try: -ing or to",
    "verb-pattern",
    "stop-remember",
  ),
  b2(
    "b2-37",
    "b2-patterns",
    "verb + person + -ing (I saw him running)",
    "verb-pattern",
    "perception-ing",
    { mark: "ing" },
  ),
  b2("b2-38", "b2-patterns", "make / let / allow", "verb-pattern", "make-let"),
  // 8 · linking, emphasis and structure
  b2("b2-39", "b2-linking", "despite / in spite of", "linking", "despite"),
  b2("b2-40", "b2-linking", "however, moreover, whereas, therefore", "linking", "formal-linker"),
  b2("b2-41", "b2-linking", "cleft sentences", "structure", "cleft"),
  b2("b2-42", "b2-linking", "inversion after negative adverbs", "structure", "inversion"),
  b2("b2-43", "b2-linking", "less / fewer; a number of", "quantity", "less-fewer"),
  b2("b2-44", "b2-linking", "the more …, the more …", "comparison", "the-more"),
  b2("b2-45", "b2-linking", "dependent prepositions", "preposition", "dependent-prep"),
];

/** Every rule of the syllabus, level by level, in the order each level opens them. */
export const SYLLABUS: readonly SyllabusEntry[] = [...A1, ...A2, ...B2];
