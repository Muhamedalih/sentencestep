import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isMistakeWorthTracking,
  isTrackableWord,
  isWordWorthSaving,
  normalizeMistakeWord,
  savableWordIndices,
} from "./normalize";

test("normalizeMistakeWord: lowercases", () => {
  assert.equal(normalizeMistakeWord("Went"), "went");
});

test("normalizeMistakeWord: strips leading and trailing punctuation", () => {
  assert.equal(normalizeMistakeWord("yesterday."), "yesterday");
  assert.equal(normalizeMistakeWord("“Hello”"), "hello");
});

test("normalizeMistakeWord: preserves an internal apostrophe", () => {
  assert.equal(normalizeMistakeWord("don't"), "don't");
});

test("normalizeMistakeWord: preserves an internal hyphen", () => {
  assert.equal(normalizeMistakeWord("well-known"), "well-known");
});

test("normalizeMistakeWord: same word in different sentence positions normalizes identically", () => {
  assert.equal(normalizeMistakeWord("Went"), normalizeMistakeWord("went."));
});

test("isTrackableWord: a real word is trackable", () => {
  assert.equal(isTrackableWord("went"), true);
});

test("isTrackableWord: a punctuation-only token is not trackable", () => {
  assert.equal(isTrackableWord("—"), false);
  assert.equal(isTrackableWord("..."), false);
});

test("isMistakeWorthTracking: excludes one- and two-letter words", () => {
  assert.equal(isMistakeWorthTracking("I"), false);
  assert.equal(isMistakeWorthTracking("he"), false);
  assert.equal(isMistakeWorthTracking("a"), false);
});

test("isMistakeWorthTracking: includes real words of three letters or more", () => {
  assert.equal(isMistakeWorthTracking("went"), true);
});

test("isMistakeWorthTracking: still excludes punctuation-only tokens", () => {
  assert.equal(isMistakeWorthTracking("—"), false);
});

test("isMistakeWorthTracking: excludes pronouns of every kind, case-insensitively", () => {
  assert.equal(isMistakeWorthTracking("She"), false);
  assert.equal(isMistakeWorthTracking("her"), false);
  assert.equal(isMistakeWorthTracking("him"), false);
  assert.equal(isMistakeWorthTracking("their"), false);
  assert.equal(isMistakeWorthTracking("myself"), false);
  assert.equal(isMistakeWorthTracking("this"), false);
  assert.equal(isMistakeWorthTracking("something"), false);
});

test("isMistakeWorthTracking: excludes 'the'", () => {
  assert.equal(isMistakeWorthTracking("The"), false);
});

test("isMistakeWorthTracking: excludes number words", () => {
  assert.equal(isMistakeWorthTracking("one"), false);
  assert.equal(isMistakeWorthTracking("Two"), false);
  assert.equal(isMistakeWorthTracking("twenty"), false);
});

test("isMistakeWorthTracking: excludes known character names", () => {
  assert.equal(isMistakeWorthTracking("Layla"), false);
  assert.equal(isMistakeWorthTracking("Ali"), false);
});

test("isMistakeWorthTracking: still includes ordinary content words", () => {
  assert.equal(isMistakeWorthTracking("yesterday"), true);
  assert.equal(isMistakeWorthTracking("neighbor"), true);
});

test("isWordWorthSaving: pronouns, demonstratives and articles are never offered", () => {
  for (const word of ["I", "you", "they", "this", "those", "the", "everything", "some"]) {
    assert.equal(isWordWorthSaving(word), false, word);
  }
});

test("isWordWorthSaving: be/have/do, modals, prepositions, conjunctions and function adverbs are never offered", () => {
  for (const word of [
    "was",
    "were",
    "had",
    "does",
    "would",
    "should",
    "from",
    "during",
    "because",
    "although",
    "not",
    "very",
    "than",
  ]) {
    assert.equal(isWordWorthSaving(word), false, word);
  }
});

test("isWordWorthSaving: contractions and possessives are never offered, even of a content word", () => {
  for (const word of ["don't", "it's", "didn’t", "friend's"]) {
    assert.equal(isWordWorthSaving(word), false, word);
  }
});

test("isWordWorthSaving: numbers, names and one/two-letter words are never offered", () => {
  for (const word of ["three", "hundred", "Layla", "go", "up", "a"]) {
    assert.equal(isWordWorthSaving(word), false, word);
  }
});

test("isWordWorthSaving: real content words are offered, with punctuation and case ignored", () => {
  for (const word of ["reply", "Immediately.", "meetings,", "felt", "phone", "checking"]) {
    assert.equal(isWordWorthSaving(word), true, word);
  }
});

test("savableWordIndices: indexes words the same way wordTranslations does", () => {
  const sentence = "I felt like I had to reply to everything immediately.";
  // words: I(0) felt(1) like(2) I(3) had(4) to(5) reply(6) to(7) everything(8) immediately.(9)
  assert.deepEqual(
    [...savableWordIndices(sentence)].sort((a, b) => a - b),
    [1, 2, 6, 9],
  );
});
