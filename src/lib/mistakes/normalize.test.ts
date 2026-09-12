import { test } from "node:test";
import assert from "node:assert/strict";

import { isMistakeWorthTracking, isTrackableWord, normalizeMistakeWord } from "./normalize";

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
