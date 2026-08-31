import { test } from "node:test";
import assert from "node:assert/strict";

import { isTrackableWord, normalizeMistakeWord } from "./normalize";

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
