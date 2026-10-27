import assert from "node:assert/strict";
import test from "node:test";

import { BANK_LIMITS, BANK_SOURCES, isBankSource, parseBankWordInput } from "@/lib/word-bank/types";

const good = { word: "aunt", outcome: "clean", todayISO: "2026-10-27", source: "story" };

test("the sources are the five places a word can be met", () => {
  assert.deepEqual([...BANK_SOURCES], ["story", "passage", "star", "core", "lesson"]);
  for (const source of BANK_SOURCES) assert.equal(isBankSource(source), true);
  assert.equal(isBankSource("STORY"), false);
  assert.equal(isBankSource("list"), false);
  assert.equal(isBankSource(undefined), false);
  assert.equal(isBankSource(3), false);
});

test("a valid answer is normalized the way every other word ledger writes a word", () => {
  assert.deepEqual(parseBankWordInput({ ...good, word: "  Aunt, " }), {
    word: "aunt",
    outcome: "clean",
    todayISO: "2026-10-27",
    source: "story",
    lessonId: undefined,
    lessonTitle: undefined,
    ar: undefined,
    homeSentence: undefined,
  });
});

test("the context the caller knows is kept, trimmed and on one line", () => {
  const parsed = parseBankWordInput({
    ...good,
    source: "passage",
    lessonId: "the-quiet-hour",
    lessonTitle: "  The   Quiet Hour ",
    ar: "العمة أو الخالة",
    homeSentence: "My aunt called me\nthree times before breakfast.",
  });
  assert.deepEqual(parsed, {
    word: "aunt",
    outcome: "clean",
    todayISO: "2026-10-27",
    source: "passage",
    lessonId: "the-quiet-hour",
    lessonTitle: "The Quiet Hour",
    ar: "العمة أو الخالة",
    homeSentence: "My aunt called me three times before breakfast.",
  });
});

test("context that is missing, blank or not text is simply absent", () => {
  const parsed = parseBankWordInput({
    ...good,
    lessonId: "   ",
    lessonTitle: 7,
    ar: null,
    homeSentence: {},
  });
  assert.equal(parsed?.lessonId, undefined);
  assert.equal(parsed?.lessonTitle, undefined);
  assert.equal(parsed?.ar, undefined);
  assert.equal(parsed?.homeSentence, undefined);
});

test("every text is cut to the table's limit", () => {
  const long = "x".repeat(1000);
  const parsed = parseBankWordInput({
    ...good,
    lessonId: long,
    lessonTitle: long,
    ar: long,
    homeSentence: long,
  });
  assert.equal(parsed?.lessonId?.length, BANK_LIMITS.lessonId);
  assert.equal(parsed?.lessonTitle?.length, BANK_LIMITS.lessonTitle);
  assert.equal(parsed?.ar?.length, BANK_LIMITS.ar);
  assert.equal(parsed?.homeSentence?.length, BANK_LIMITS.homeSentence);
});

test("an answer with anything unknown or unusable is refused", () => {
  assert.equal(parseBankWordInput(null), null);
  assert.equal(parseBankWordInput("aunt"), null);
  assert.equal(parseBankWordInput({}), null);
  assert.equal(parseBankWordInput({ ...good, word: 42 }), null);
  assert.equal(parseBankWordInput({ ...good, word: "" }), null);
  assert.equal(parseBankWordInput({ ...good, word: "a" }), null);
  assert.equal(parseBankWordInput({ ...good, word: "—" }), null);
  assert.equal(parseBankWordInput({ ...good, word: "2026" }), null);
  assert.equal(parseBankWordInput({ ...good, word: "x".repeat(BANK_LIMITS.word + 1) }), null);
  assert.equal(parseBankWordInput({ ...good, outcome: "great" }), null);
  assert.equal(parseBankWordInput({ ...good, outcome: undefined }), null);
  assert.equal(parseBankWordInput({ ...good, todayISO: "27/10/2026" }), null);
  assert.equal(parseBankWordInput({ ...good, todayISO: "2026-02-31" }), null);
  assert.equal(parseBankWordInput({ ...good, source: "list" }), null);
  assert.equal(parseBankWordInput({ ...good, source: undefined }), null);
});

test("the three outcomes and a word of the longest allowed length are accepted", () => {
  for (const outcome of ["clean", "assisted", "missed"]) {
    assert.equal(parseBankWordInput({ ...good, outcome })?.outcome, outcome);
  }
  const longest = "a".repeat(BANK_LIMITS.word);
  assert.equal(parseBankWordInput({ ...good, word: longest })?.word, longest);
});
