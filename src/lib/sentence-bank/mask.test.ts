import assert from "node:assert/strict";
import test from "node:test";

import { compareDictation } from "@/lib/features/dictation";
import {
  PARTIAL_MAX_BLANKS,
  gradeMasked,
  maskedTokenIndexes,
  sentenceTokens,
} from "@/lib/sentence-bank/mask";

test("a sentence is cut into the pieces the learner sees, punctuation kept around each word", () => {
  assert.deepEqual(sentenceTokens("  (Tom)   bought tea, then — left! "), [
    { text: "(Tom)", before: "(", core: "Tom", after: ")" },
    { text: "bought", before: "", core: "bought", after: "" },
    { text: "tea,", before: "", core: "tea", after: "," },
    { text: "then", before: "", core: "then", after: "" },
    { text: "—", before: "—", core: "", after: "" },
    { text: "left!", before: "", core: "left", after: "!" },
  ]);
  assert.deepEqual(sentenceTokens("don't well-known"), [
    { text: "don't", before: "", core: "don't", after: "" },
    { text: "well-known", before: "", core: "well-known", after: "" },
  ]);
  assert.deepEqual(sentenceTokens("   "), []);
});

test("one word is hidden at strength 0, two in a longer sentence once it has gone up a step", () => {
  assert.equal(PARTIAL_MAX_BLANKS, 2);
  const long = "Every morning my neighbour walks her tiny dog";
  assert.equal(maskedTokenIndexes(long, { strength: 0 }).length, 1);
  assert.equal(maskedTokenIndexes(long, { strength: 1 }).length, 2);
  // A short sentence keeps a single blank at any strength.
  assert.equal(maskedTokenIndexes("She drinks green tea", { strength: 1 }).length, 1);
  const picked = maskedTokenIndexes(long, { strength: 1 });
  assert.deepEqual(
    picked,
    [...picked].sort((a, b) => a - b),
  );
});

test("content words are hidden, never a function word, when the sentence has a content word", () => {
  const sentence = "She went to the market with her friend";
  const tokens = sentenceTokens(sentence);
  for (let strength = 0; strength < 2; strength++) {
    for (const seed of ["a", "b", "c", "d", "e", "f"]) {
      for (const index of maskedTokenIndexes(sentence, { strength, seed })) {
        assert.ok(
          ["went", "market", "friend"].includes(tokens[index]!.core),
          `${tokens[index]!.core} is not a content word`,
        );
      }
    }
  }
});

test("a weak word is the one hidden when the sentence holds one", () => {
  const sentence = "She went to the market with her friend";
  const tokens = sentenceTokens(sentence);
  for (const seed of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
    const [index] = maskedTokenIndexes(sentence, { weakWords: new Set(["friend"]), seed });
    assert.equal(tokens[index!]!.core, "friend");
  }
  // At strength 1 it takes both of the weak ones.
  const both = maskedTokenIndexes(sentence, {
    strength: 1,
    weakWords: new Set(["market", "friend"]),
  });
  assert.deepEqual(
    both.map((index) => tokens[index]!.core),
    ["market", "friend"],
  );
});

test("the same review always hides the same words, the next review may hide others", () => {
  const sentence = "Every morning my neighbour walks her tiny dog";
  assert.deepEqual(
    maskedTokenIndexes(sentence, { seed: "s1:0" }),
    maskedTokenIndexes(sentence, { seed: "s1:0" }),
  );
  const seen = new Set(
    ["s1:0", "s1:1", "s1:2", "s1:3", "s1:4", "s1:5", "s1:6", "s1:7"].map((seed) =>
      maskedTokenIndexes(sentence, { seed }).join(","),
    ),
  );
  assert.ok(seen.size > 1, "the choice varies with the seed");
});

test("without a content word the hidden one is the best of the rest; without any word, the longest", () => {
  const tokens = sentenceTokens("You can not do it now");
  const [index] = maskedTokenIndexes("You can not do it now");
  assert.ok(["You", "can", "not", "now"].includes(tokens[index!]!.core));

  assert.deepEqual(maskedTokenIndexes("I am at it"), [1]);
  assert.deepEqual(maskedTokenIndexes("— — —"), []);
  assert.deepEqual(maskedTokenIndexes(""), []);
});

test("a hyphenated word is never split into a blank", () => {
  const sentence = "A well-known actor lives here";
  const tokens = sentenceTokens(sentence);
  for (const seed of ["a", "b", "c", "d", "e", "f"]) {
    for (const index of maskedTokenIndexes(sentence, { seed })) {
      assert.ok(!tokens[index]!.core.includes("-"));
    }
  }
});

test("typed words are checked without regard to case or punctuation", () => {
  const sentence = "I bought tea, then left.";
  const masked = [2];
  for (const typed of ["tea", "Tea", " TEA ", "tea,"]) {
    const answer = gradeMasked(sentence, masked, [typed]);
    assert.equal(answer.exact, true, typed);
    assert.deepEqual(answer.correct, [true]);
  }
  const wrong = gradeMasked(sentence, masked, ["coffee"]);
  assert.equal(wrong.exact, false);
  assert.deepEqual(wrong.correct, [false]);
  // The sentence as completed keeps the punctuation around the blank.
  assert.equal(wrong.sentence, "I bought coffee, then left.");
  assert.equal(gradeMasked(sentence, masked, [""]).exact, false);
  assert.equal(gradeMasked(sentence, masked, []).exact, false);
});

test("with two blanks every one must be right, and each is flagged on its own", () => {
  const sentence = "Every morning my neighbour walks her tiny dog";
  const masked = [1, 3];
  assert.deepEqual(gradeMasked(sentence, masked, ["morning", "neighbour"]).correct, [true, true]);
  assert.equal(gradeMasked(sentence, masked, ["morning", "neighbour"]).exact, true);
  const half = gradeMasked(sentence, masked, ["morning", "neighbor"]);
  assert.deepEqual(half.correct, [true, false]);
  assert.equal(half.exact, false);
  // Nothing hidden is never "exact": there was nothing to remember.
  assert.equal(gradeMasked(sentence, [], []).exact, false);
});

test("grading the blanks agrees with grading the whole completed sentence", () => {
  const sentence = "Every morning my neighbour walks her tiny dog";
  const cases: [number[], string[]][] = [
    [
      [1, 3],
      ["morning", "neighbour"],
    ],
    [
      [1, 3],
      ["morning", "neighbor"],
    ],
    [[6], ["tiny"]],
    [[6], ["small"]],
    [[3], [""]],
    [[1], ["Morning"]],
  ];
  for (const [masked, typed] of cases) {
    const answer = gradeMasked(sentence, masked, typed);
    assert.equal(compareDictation(sentence, answer.sentence).exact, answer.exact, typed.join("|"));
  }
});

test("a second chance hides other words than the first go did, when the sentence has others", () => {
  const sentence = "She went to the market with her friend";
  const first = maskedTokenIndexes(sentence, { seed: "first" });
  for (const seed of ["r1", "r2", "r3", "r4", "r5"]) {
    const retry = maskedTokenIndexes(sentence, { seed, avoid: first });
    assert.equal(retry.length, 1);
    assert.ok(!retry.some((index) => first.includes(index)), "the same word again");
  }
  // A content word still beats a function word: with one content word only, it is asked again.
  const only = "She is very tall";
  const tokens = sentenceTokens(only);
  const [again] = maskedTokenIndexes(only, { avoid: [3] });
  assert.equal(tokens[again!]!.core, "tall");
});
