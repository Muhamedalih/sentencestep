import assert from "node:assert/strict";
import test from "node:test";

import { buildLadderWords, fillSentence } from "@/lib/word-ladder/build";
import {
  definitionOf,
  meaningChoices,
  spellingCandidates,
  spellingChoices,
  termOf,
} from "@/lib/word-ladder/options";
import { seededShuffle } from "@/lib/word-ladder/random";
import type { VocabularyWord } from "@/types/word-lists";

test("the term is the hint's first part without its closing full stop", () => {
  assert.equal(termOf("العمة أو الخالة: أخت والدك أو والدتك."), "العمة أو الخالة");
  assert.equal(termOf("الزوجة."), "الزوجة");
  assert.equal(termOf("الفساد"), "الفساد");
  assert.equal(definitionOf("العمة أو الخالة: أخت والدك أو والدتك."), "أخت والدك أو والدتك.");
  assert.equal(definitionOf("الزوجة."), undefined);
});

test("a seeded shuffle is repeatable and keeps every item", () => {
  const items = [1, 2, 3, 4, 5, 6];
  assert.deepEqual(seededShuffle(items, "x"), seededShuffle(items, "x"));
  assert.deepEqual([...seededShuffle(items, "x")].sort(), items);
  assert.deepEqual(items, [1, 2, 3, 4, 5, 6]);
});

const pool = [
  { id: "1", term: "العمة", pos: "noun" },
  { id: "2", term: "العم", pos: "noun" },
  { id: "3", term: "الجدة", pos: "noun" },
  { id: "4", term: "ابن العم", pos: "noun" },
  { id: "5", term: "يزور", pos: "verb" },
  { id: "6", term: "قريب", pos: "adjective" },
];

test("the meaning choices hold the right term and three others of the same type first", () => {
  const choices = meaningChoices({ id: "1", term: "العمة" }, pool, "noun", "seed");
  assert.equal(choices.length, 4);
  assert.ok(choices.includes("العمة"));
  assert.equal(new Set(choices).size, 4);
  assert.ok(!choices.includes("يزور") && !choices.includes("قريب"));
});

test("with too few nouns the choices fill up from the other types, and never repeat a term", () => {
  const two = pool.filter((item) => ["1", "2", "5", "6"].includes(item.id));
  const choices = meaningChoices({ id: "1", term: "العمة" }, two, "noun", "seed");
  assert.deepEqual([...choices].sort(), ["العمة", "العم", "قريب", "يزور"].sort());
  const dup = [
    { id: "1", term: "العمة" },
    { id: "2", term: "العمة" },
    { id: "3", term: "العم" },
  ];
  assert.deepEqual(
    meaningChoices({ id: "1", term: "العمة" }, dup, null, "s").sort(),
    ["العم", "العمة"].sort(),
  );
});

test("the choices are the same every time for the same word", () => {
  assert.deepEqual(
    meaningChoices({ id: "1", term: "العمة" }, pool, "noun", "m:1"),
    meaningChoices({ id: "1", term: "العمة" }, pool, "noun", "m:1"),
  );
});

test("spelling slips are generated for vowels, digraphs, doubled letters, a final e and swaps", () => {
  const kinds = spellingCandidates("aunt");
  assert.ok(kinds.vowel!.includes("eunt") || kinds.vowel!.includes("aent"));
  assert.ok(kinds.silentE!.includes("aunte"));
  assert.ok(kinds.swap!.includes("uant"));
  assert.ok(kinds.double!.includes("auntt"));
  assert.ok(spellingCandidates("meet").digraph!.includes("meat"));
  assert.ok(spellingCandidates("meet").double!.includes("met"));
});

test("a spelling choice is never a real word, never sounds like the answer, never one of the topic's words", () => {
  const known = new Set(["ant", "aunt", "unt", "awnt", "uncle"]);
  const ipa: Record<string, string> = { aunt: "ænt", ant: "ænt", ount: "aʊnt" };
  for (let n = 0; n < 40; n++) {
    const choices = spellingChoices("aunt", { known, ipaOf: (w) => ipa[w], seed: `s${n}` });
    assert.ok(choices.includes("aunt"));
    assert.equal(choices.length, 4);
    assert.equal(new Set(choices).size, 4);
    for (const choice of choices.filter((c) => c !== "aunt")) {
      assert.ok(!known.has(choice), choice);
      assert.notEqual(ipa[choice], "ænt", choice);
      assert.match(choice, /^[a-z]+$/);
    }
  }
});

test("a homophone is thrown away even when it is not in the known words", () => {
  const ipa = { aunt: "ænt", ant: "ænt" } as Record<string, string>;
  for (let n = 0; n < 40; n++) {
    const choices = spellingChoices("aunt", {
      known: new Set(),
      ipaOf: (w) => ipa[w],
      seed: `h${n}`,
    });
    assert.ok(!choices.includes("ant"));
  }
});

test("a word nothing can be made from gets fewer choices, never an empty list or the answer alone twice", () => {
  const everything = new Set(Object.values(spellingCandidates("it")).flat());
  const choices = spellingChoices("it", { known: everything, seed: "s" });
  assert.deepEqual(choices, ["it"]);
});

const vocab = (
  id: string,
  targetWord: string,
  hintAr: string,
  sentence: string,
  order: number,
  pos?: "noun" | "verb",
): VocabularyWord => ({
  id,
  groupId: "family",
  order,
  targetWord,
  sentence,
  hintAr,
  pos,
});

test("the blank is filled with the word, capitalised when it opens the sentence", () => {
  assert.equal(fillSentence("My ___ gives me cookies.", "aunt"), "My aunt gives me cookies.");
  assert.equal(fillSentence("___ is my favourite.", "aunt"), "Aunt is my favourite.");
  assert.equal(fillSentence("No blank here.", "aunt"), "No blank here.");
});

test("a topic's words come out ready for the five steps", () => {
  const words = [
    vocab(
      "a",
      "aunt",
      "العمة أو الخالة: أخت والدك أو والدتك.",
      "My ___ gives me cookies.",
      1,
      "noun",
    ),
    vocab("b", "uncle", "العم أو الخال: أخو والدك أو والدتك.", "My ___ lives abroad.", 2, "noun"),
    vocab("c", "cousin", "ابن العم.", "My ___ is my age.", 3, "noun"),
    vocab("d", "niece", "ابنة الأخ أو الأخت.", "My ___ is five.", 4, "noun"),
    vocab("e", "visit", "يزور.", "I ___ her often.", 5, "verb"),
  ];
  const built = buildLadderWords(words, { known: new Set(["ant", "men"]) });
  assert.equal(built.length, 5);
  const aunt = built[0]!;
  assert.equal(aunt.word, "aunt");
  assert.equal(aunt.term, "العمة أو الخالة");
  assert.equal(aunt.definition, "أخت والدك أو والدتك.");
  assert.equal(aunt.sentence, "My aunt gives me cookies.");
  assert.ok(aunt.meaningOptions.includes("العمة أو الخالة"));
  assert.equal(aunt.meaningOptions.length, 4);
  assert.ok(aunt.spellingOptions.includes("aunt"));
  assert.ok(!aunt.spellingOptions.includes("ant"));
  assert.equal(built[2]!.definition, undefined);
  assert.deepEqual(
    buildLadderWords(words, { known: new Set(["ant", "men"]) }),
    built,
    "building twice gives the same words",
  );
});
