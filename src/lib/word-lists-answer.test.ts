import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_ALTERNATES,
  acceptedAnswers,
  longestAnswerLength,
  matchAnswer,
  mayStillBeTypingLonger,
  normalizeAnswer,
  parseAlternates,
} from "@/lib/word-lists-answer";

test("normalizeAnswer: case, accents and surrounding space never decide right from wrong", () => {
  assert.equal(normalizeAnswer("  Grey "), "grey");
  assert.equal(normalizeAnswer("fiancé"), "fiance");
  assert.equal(normalizeAnswer("Résumé"), "resume");
  assert.equal(normalizeAnswer("heat   wave"), "heat wave");
  assert.equal(normalizeAnswer(""), "");
});

test("acceptedAnswers: the stored word first, normalized, no repeats, no blanks", () => {
  assert.deepEqual(acceptedAnswers("gray", ["Grey", "grey", " ", "gray"]), ["gray", "grey"]);
  assert.deepEqual(acceptedAnswers("aunt", undefined), ["aunt"]);
  assert.deepEqual(acceptedAnswers("aunt", null), ["aunt"]);
  assert.deepEqual(acceptedAnswers("aunt", []), ["aunt"]);
});

test("matchAnswer: the stored word is exact, a listed spelling or synonym is an alternate", () => {
  assert.deepEqual(matchAnswer("gray", "gray", ["grey"]), { kind: "exact" });
  assert.deepEqual(matchAnswer("GRAY", "gray", ["grey"]), { kind: "exact" });
  assert.deepEqual(matchAnswer("grey", "gray", ["grey"]), { kind: "alternate" });
  assert.deepEqual(matchAnswer("Grey", "gray", ["grey"]), { kind: "alternate" });
  assert.deepEqual(matchAnswer("flat", "apartment", ["flat"]), { kind: "alternate" });
  assert.deepEqual(matchAnswer("heat wave", "heatwave", ["heat wave"]), { kind: "alternate" });
});

test("matchAnswer: anything else, and anything empty, is not a match", () => {
  assert.equal(matchAnswer("grays", "gray", ["grey"]), null);
  assert.equal(matchAnswer("gre", "gray", ["grey"]), null);
  assert.equal(matchAnswer("", "gray", ["grey"]), null);
  assert.equal(matchAnswer("   ", "gray", ["grey"]), null);
  assert.equal(matchAnswer("grey", "gray"), null);
  assert.equal(matchAnswer("grey", "gray", null), null);
});

test("matchAnswer: an accented spelling is the same word, not an alternate", () => {
  assert.deepEqual(matchAnswer("fiancé", "fiance"), { kind: "exact" });
  assert.deepEqual(matchAnswer("résumé", "resume", ["cv"]), { kind: "exact" });
  assert.deepEqual(matchAnswer("CV", "resume", ["cv"]), { kind: "alternate" });
});

test("mayStillBeTypingLonger: waits only while a longer accepted answer starts with what is typed", () => {
  // "color" is the stored word, "colors" is also accepted: at "color" the learner may still be typing the s.
  assert.equal(mayStillBeTypingLonger("color", "color", ["colors"]), true);
  assert.equal(mayStillBeTypingLonger("colors", "color", ["colors"]), false);
  assert.equal(mayStillBeTypingLonger("colo", "colour", []), true);
  // A word with no alternates never waits.
  assert.equal(mayStillBeTypingLonger("aunt", "aunt"), false);
  assert.equal(mayStillBeTypingLonger("", "aunt", ["auntie"]), false);
  assert.equal(mayStillBeTypingLonger("grey", "gray", ["grey"]), false);
});

test("longestAnswerLength is measured over every accepted answer", () => {
  assert.equal(longestAnswerLength("aunt"), 4);
  assert.equal(longestAnswerLength("neighbor", ["neighbour"]), 9);
  assert.equal(longestAnswerLength("subway", ["underground", "tube"]), 11);
});

test("parseAlternates: trims, lower-cases, drops repeats, the word itself and anything that is not a word", () => {
  assert.deepEqual(parseAlternates(" Grey , grey;GREY\n", "gray"), ["grey"]);
  assert.deepEqual(parseAlternates("gray, grey", "gray"), ["grey"]);
  assert.deepEqual(parseAlternates("heat wave, back-end, o'clock", "x"), [
    "heat wave",
    "back-end",
    "o'clock",
  ]);
  assert.deepEqual(parseAlternates("12, <script>, , a b c", "x"), ["a b c"]);
  assert.deepEqual(parseAlternates("", "x"), []);
  // The accent-stripped form of the word itself is not an alternate either.
  assert.deepEqual(parseAlternates("fiancé", "fiance"), []);
});

test("parseAlternates: bounded in count and in length", () => {
  const many = Array.from({ length: 20 }, (_, index) => `word${String.fromCharCode(97 + index)}`);
  assert.equal(parseAlternates(many.join(","), "x").length, MAX_ALTERNATES);
  assert.deepEqual(parseAlternates("a".repeat(41), "x"), []);
  assert.equal(parseAlternates("a".repeat(40), "x").length, 1);
});
