/**
 * The syllabus of the German rule of the day (permission germanTrack): 150 rules in the same three levels and
 * the same order of opening as the English course (../syllabus.ts), with ids that start with "de-" so a learner's
 * German progress never mixes with their English one ("de-a1-01" ... "de-b2-45"; the learner_rules column allows
 * 4 to 12 characters). Only what the engine needs to place a rule is here; what a rule teaches is in the teach-*
 * files of this folder. Ids never change and are never reused.
 */

import type { RuleFamily, RuleLevel } from "../ladder";
import type { SyllabusEntry } from "../syllabus";

import type { DeMatchKind } from "./matchers";

type Match = DeMatchKind | "none";

const rule =
  (level: RuleLevel, prefix: string) =>
  (n: number, unit: string, title: string, family: RuleFamily, match: Match): SyllabusEntry => ({
    id: `de-${prefix}-${String(n).padStart(2, "0")}`,
    level,
    unit,
    title,
    family,
    match,
  });

const a1 = rule("A1", "a1");
const a2 = rule("A2-B1", "a2");
const b2 = rule("B2", "b2");

const A1: readonly SyllabusEntry[] = [
  // 1 · basics
  a1(1, "de-a1-basics", "ich / du / er / sie / es", "pronoun", "de-subject-sg"),
  a1(2, "de-a1-basics", "wir / ihr / sie (they) / Sie", "pronoun", "de-subject-pl"),
  a1(3, "de-a1-basics", "sein: bin / bist / ist", "be", "de-sein-sg"),
  a1(4, "de-a1-basics", "sein: sind / seid", "be", "de-sein-pl"),
  a1(5, "de-a1-basics", "haben", "present", "de-haben"),
  a1(6, "de-a1-basics", "regular verbs: -e / -st / -t / -en", "present", "none"),
  a1(7, "de-a1-basics", "the verb in second place", "word-order", "none"),
  a1(8, "de-a1-basics", "nouns have a capital letter", "structure", "none"),
  // 2 · nouns and articles
  a1(9, "de-a1-nouns", "der / die / das", "determiner", "de-article-def"),
  a1(10, "de-a1-nouns", "ein / eine", "determiner", "de-article-indef"),
  a1(11, "de-a1-nouns", "plural of nouns", "quantity", "none"),
  a1(12, "de-a1-nouns", "kein / keine", "negative", "de-kein"),
  a1(13, "de-a1-nouns", "mein / dein / sein / ihr", "determiner", "de-possessive"),
  a1(14, "de-a1-nouns", "unser / euer", "determiner", "de-possessive-pl"),
  a1(15, "de-a1-nouns", "compound nouns", "structure", "none"),
  a1(16, "de-a1-nouns", "the -in ending for women", "structure", "none"),
  a1(17, "de-a1-nouns", "adjectives after sein", "adjective", "none"),
  // 3 · questions and negation
  a1(18, "de-a1-questions", "was / wo / wer / wie", "question", "de-w-question"),
  a1(19, "de-a1-questions", "woher / wohin / warum / wann", "question", "de-w-question-more"),
  a1(20, "de-a1-questions", "yes/no questions: verb first", "question", "de-yes-no-question"),
  a1(21, "de-a1-questions", "ja / nein / doch", "question", "de-ja-nein-doch"),
  a1(22, "de-a1-questions", "nicht", "negative", "de-nicht"),
  a1(23, "de-a1-questions", "nicht or kein", "negative", "de-nicht-kein"),
  a1(24, "de-a1-questions", "es gibt", "present", "de-es-gibt"),
  // 4 · verbs
  a1(25, "de-a1-verbs", "vowel change e → i", "present", "de-vowel-i"),
  a1(26, "de-a1-verbs", "vowel change e → ie", "present", "de-vowel-ie"),
  a1(27, "de-a1-verbs", "vowel change a → ä", "present", "de-vowel-ae"),
  a1(28, "de-a1-verbs", "wissen / werden", "present", "de-wissen-werden"),
  a1(29, "de-a1-verbs", "separable verbs", "verb-pattern", "de-separable-end"),
  a1(30, "de-a1-verbs", "können", "modal", "de-koennen"),
  a1(31, "de-a1-verbs", "müssen / wollen", "modal", "de-muessen-wollen"),
  a1(32, "de-a1-verbs", "möchten / dürfen / sollen", "modal", "de-moechten-duerfen-sollen"),
  a1(33, "de-a1-verbs", "the imperative", "present", "none"),
  a1(34, "de-a1-verbs", "gern", "adverb", "de-gern"),
  a1(35, "de-a1-verbs", "stems that end in -t / -d", "present", "none"),
  // 5 · accusative and prepositions
  a1(36, "de-a1-cases", "the accusative: den / einen", "case", "de-akk-article"),
  a1(37, "de-a1-cases", "mich / dich / ihn", "pronoun", "de-akk-pronoun"),
  a1(38, "de-a1-cases", "für / ohne / durch / gegen", "preposition", "de-prep-akk"),
  a1(39, "de-a1-cases", "mit / bei / zu / aus / von / nach", "preposition", "de-prep-dat"),
  a1(40, "de-a1-cases", "in / an / auf: where?", "preposition", "de-two-way-wo"),
  a1(41, "de-a1-cases", "in / an / auf: where to?", "preposition", "de-two-way-wohin"),
  // 6 · time and daily life
  a1(42, "de-a1-time", "um / am / im", "preposition", "de-time-prep"),
  a1(43, "de-a1-time", "days, months and seasons", "structure", "none"),
  a1(44, "de-a1-time", "time, manner, place", "word-order", "none"),
  a1(45, "de-a1-time", "und / aber / oder / denn", "linking", "de-conjunction"),
];

const A2: readonly SyllabusEntry[] = [
  // 1 · Perfekt
  a2(1, "de-a2-perfekt", "Perfekt with haben", "perfect", "de-perfekt-haben"),
  a2(2, "de-a2-perfekt", "participles: ge- … -t", "perfect", "de-participle-t"),
  a2(3, "de-a2-perfekt", "participles: ge- … -en", "perfect", "de-participle-en"),
  a2(4, "de-a2-perfekt", "Perfekt with sein", "perfect", "de-perfekt-sein"),
  a2(5, "de-a2-perfekt", "participles without ge-", "perfect", "de-participle-no-ge"),
  a2(6, "de-a2-perfekt", "separable verbs in the Perfekt", "perfect", "de-participle-separable"),
  a2(7, "de-a2-perfekt", "the participle at the end", "word-order", "de-participle-end"),
  a2(8, "de-a2-perfekt", "war / hatte", "past", "de-war-hatte"),
  // 2 · dative
  a2(9, "de-a2-dative", "the dative: dem / einem", "case", "de-dat-article"),
  a2(10, "de-a2-dative", "mir / dir / ihm / ihnen", "pronoun", "de-dat-pronoun"),
  a2(11, "de-a2-dative", "verbs with the dative", "case", "de-dat-verbs"),
  a2(12, "de-a2-dative", "two objects: who gets what", "word-order", "none"),
  a2(13, "de-a2-dative", "prepositions that take the dative", "preposition", "de-prep-dat-article"),
  a2(14, "de-a2-dative", "stehen / stellen, liegen / legen", "preposition", "none"),
  a2(15, "de-a2-dative", "possessives in the dative", "determiner", "de-dat-possessive"),
  // 3 · adjectives
  a2(
    16,
    "de-a2-adjectives",
    "adjective endings after der / die / das",
    "adjective",
    "de-adj-definite",
  ),
  a2(
    17,
    "de-a2-adjectives",
    "adjective endings after ein / eine",
    "adjective",
    "de-adj-indefinite",
  ),
  a2(18, "de-a2-adjectives", "adjective endings with no article", "adjective", "none"),
  a2(19, "de-a2-adjectives", "the comparative: -er … als", "comparison", "de-comparative"),
  a2(20, "de-a2-adjectives", "the superlative: am -sten", "comparison", "de-superlative"),
  a2(21, "de-a2-adjectives", "better, rather, most", "comparison", "de-irregular-comparison"),
  a2(22, "de-a2-adjectives", "so … wie", "comparison", "de-so-wie"),
  // 4 · subordinate clauses
  a2(23, "de-a2-clauses", "weil", "linking", "de-weil"),
  a2(24, "de-a2-clauses", "dass", "linking", "de-dass"),
  a2(25, "de-a2-clauses", "wenn", "linking", "de-wenn"),
  a2(26, "de-a2-clauses", "ob", "linking", "de-ob"),
  a2(27, "de-a2-clauses", "als or wenn", "linking", "de-als-wenn"),
  a2(28, "de-a2-clauses", "deshalb / darum / deswegen", "linking", "de-deshalb"),
  a2(29, "de-a2-clauses", "denn", "linking", "de-denn"),
  a2(30, "de-a2-clauses", "questions inside a sentence", "question", "de-indirect-question"),
  a2(31, "de-a2-clauses", "zu + infinitive", "verb-pattern", "de-zu-infinitive"),
  // 5 · verbs
  a2(32, "de-a2-verbs", "modals in the past", "modal", "de-modal-past"),
  a2(33, "de-a2-verbs", "reflexive verbs", "verb-pattern", "de-reflexive"),
  a2(34, "de-a2-verbs", "reflexive: mich or mir", "verb-pattern", "de-reflexive-dative"),
  a2(35, "de-a2-verbs", "the future with werden", "future", "de-future"),
  a2(36, "de-a2-verbs", "lassen", "verb-pattern", "de-lassen"),
  a2(37, "de-a2-verbs", "the imperative: more forms", "present", "none"),
  a2(38, "de-a2-verbs", "verbs with a preposition", "verb-pattern", "de-verb-prep"),
  a2(39, "de-a2-verbs", "darauf / worauf", "pronoun", "de-da-compound"),
  // 6 · nouns and pronouns
  a2(40, "de-a2-nouns", "the genitive: des / eines", "case", "de-genitive-article"),
  a2(41, "de-a2-nouns", "nouns like der Junge", "case", "de-n-declension"),
  a2(42, "de-a2-nouns", "relative clauses: der / die / das", "relative", "de-relative-nom"),
  a2(43, "de-a2-nouns", "relative clauses: den", "relative", "de-relative-akk"),
  a2(44, "de-a2-nouns", "relative clauses: dem / denen", "relative", "de-relative-dat"),
  a2(45, "de-a2-nouns", "man / jemand / niemand / etwas", "pronoun", "de-indefinite"),
  a2(46, "de-a2-nouns", "dieser / jeder / welcher", "determiner", "de-demonstrative"),
  // 7 · polite and unreal
  a2(47, "de-a2-konjunktiv", "würde + infinitive", "conditional", "de-wuerde"),
  a2(48, "de-a2-konjunktiv", "hätte / wäre", "conditional", "de-haette-waere"),
  a2(49, "de-a2-konjunktiv", "polite requests: könnte / dürfte", "modal", "de-koennte"),
  a2(
    50,
    "de-a2-konjunktiv",
    "unreal conditions: wenn … würde",
    "conditional",
    "de-unreal-condition",
  ),
  a2(51, "de-a2-konjunktiv", "wishes: ich wünschte", "conditional", "de-wish"),
  // 8 · expressions
  a2(52, "de-a2-expressions", "nicht nur … sondern auch", "linking", "de-pair-conjunction"),
  a2(53, "de-a2-expressions", "zwar … aber", "linking", "de-zwar"),
  a2(54, "de-a2-expressions", "wegen / trotz / statt", "preposition", "de-prep-genitive"),
  a2(55, "de-a2-expressions", "ordinal numbers", "quantity", "de-ordinal"),
  a2(56, "de-a2-expressions", "seit / vor / bis / ab", "preposition", "de-time-span"),
  a2(57, "de-a2-expressions", "where nicht goes", "negative", "none"),
  a2(58, "de-a2-expressions", "the Perfekt inside a clause", "word-order", "de-clause-final-aux"),
  a2(59, "de-a2-expressions", "hier / dort / da", "adverb", "de-place-adverb"),
  a2(60, "de-a2-expressions", "wissen or kennen", "present", "de-wissen-kennen"),
];

const B2: readonly SyllabusEntry[] = [
  // 1 · past tenses
  b2(1, "de-b2-past", "the Präteritum: regular verbs", "past", "de-praet-regular"),
  b2(2, "de-b2-past", "the Präteritum: irregular verbs", "past", "de-praet-irregular"),
  b2(3, "de-b2-past", "the Präteritum: mixed verbs", "past", "de-praet-mixed"),
  b2(4, "de-b2-past", "the Plusquamperfekt", "perfect", "de-plusquam"),
  b2(5, "de-b2-past", "Perfekt or Präteritum", "past", "none"),
  b2(6, "de-b2-past", "werden for a guess", "future", "de-future-guess"),
  b2(7, "de-b2-past", "the Futur II", "future", "de-future-two"),
  // 2 · passive
  b2(8, "de-b2-passive", "the passive: wird gemacht", "passive", "de-passive-present"),
  b2(9, "de-b2-passive", "the passive in the past: wurde", "passive", "de-passive-past"),
  b2(10, "de-b2-passive", "the passive with a modal", "passive", "de-passive-modal"),
  b2(11, "de-b2-passive", "von or durch", "passive", "de-passive-agent"),
  b2(12, "de-b2-passive", "the state: ist geschlossen", "passive", "de-state-passive"),
  b2(13, "de-b2-passive", "ways to avoid the passive", "passive", "de-passive-substitute"),
  b2(14, "de-b2-passive", "sein + zu + infinitive", "passive", "de-sein-zu"),
  b2(15, "de-b2-passive", "es wird getanzt", "passive", "de-impersonal-passive"),
  // 3 · konjunktiv
  b2(16, "de-b2-konjunktiv", "Konjunktiv II in the past", "conditional", "de-konj2-past"),
  b2(17, "de-b2-konjunktiv", "Konjunktiv II with a modal", "conditional", "de-konj2-modal"),
  b2(18, "de-b2-konjunktiv", "als ob", "conditional", "de-als-ob"),
  b2(19, "de-b2-konjunktiv", "Konjunktiv I: sei / könne", "reported", "de-konj1"),
  b2(20, "de-b2-konjunktiv", "reported speech", "reported", "de-reported-speech"),
  b2(21, "de-b2-konjunktiv", "reported speech with Konjunktiv II", "reported", "de-reported-konj2"),
  b2(22, "de-b2-konjunktiv", "conditions with no wenn", "conditional", "de-inverted-condition"),
  b2(23, "de-b2-konjunktiv", "sollte / falls", "conditional", "de-sollte"),
  // 4 · clauses and linking
  b2(24, "de-b2-linking", "obwohl", "linking", "de-obwohl"),
  b2(25, "de-b2-linking", "trotzdem", "linking", "de-trotzdem"),
  b2(26, "de-b2-linking", "damit", "linking", "de-damit"),
  b2(27, "de-b2-linking", "um … zu", "linking", "de-um-zu"),
  b2(28, "de-b2-linking", "indem", "linking", "de-indem"),
  b2(29, "de-b2-linking", "während", "linking", "de-waehrend"),
  b2(30, "de-b2-linking", "nachdem", "linking", "de-nachdem"),
  b2(31, "de-b2-linking", "bevor / ehe", "linking", "de-bevor"),
  b2(32, "de-b2-linking", "sobald / solange / seitdem", "linking", "de-sobald"),
  b2(33, "de-b2-linking", "sodass", "linking", "de-sodass"),
  // 5 · relative and participles
  b2(34, "de-b2-relative", "dessen / deren", "relative", "de-dessen"),
  b2(35, "de-b2-relative", "relative clauses with a preposition", "relative", "de-relative-prep"),
  b2(36, "de-b2-relative", "was / wo in relative clauses", "relative", "de-relative-was-wo"),
  b2(37, "de-b2-relative", "the participle with -end", "adjective", "de-participle-one"),
  b2(
    38,
    "de-b2-relative",
    "the past participle as an adjective",
    "adjective",
    "de-participle-adjective",
  ),
  b2(39, "de-b2-relative", "long phrases before the noun", "adjective", "de-extended-attribute"),
  // 6 · style
  b2(40, "de-b2-style", "prepositions with the genitive", "preposition", "de-prep-genitive-b2"),
  b2(41, "de-b2-style", "nouns from verbs: -ung, -keit", "structure", "de-nominalization"),
  b2(42, "de-b2-style", "darauf, dass …", "linking", "de-da-dass"),
  b2(43, "de-b2-style", "doch / mal / eben / halt", "adverb", "de-particles"),
  b2(44, "de-b2-style", "fixed verb phrases", "structure", "none"),
  b2(45, "de-b2-style", "adjectives with a preposition", "adjective", "de-adjective-prep"),
];

export const DE_SYLLABUS: readonly SyllabusEntry[] = [...A1, ...A2, ...B2];
