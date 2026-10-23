import assert from "node:assert/strict";
import test from "node:test";

import { compareDictation } from "@/lib/features/dictation";
import { CLOSE_LETTERS_MAX, answerFeedback } from "@/lib/sentence-bank/feedback";

const TARGET = "She bought a red car yesterday";

function feedbackFor(typed: string, gaveUp = false) {
  return answerFeedback(compareDictation(TARGET, typed), gaveUp);
}

test("a sentence typed right is exact — case and punctuation never count", () => {
  assert.deepEqual(feedbackFor("She bought a red car yesterday"), { kind: "exact" });
  assert.deepEqual(feedbackFor("she bought a red car yesterday."), { kind: "exact" });
});

test("one wrong letter is one letter away", () => {
  assert.deepEqual(feedbackFor("She bought a red cat yesterday"), { kind: "close", letters: 1 });
  // A letter missing counts the same as a letter changed.
  assert.deepEqual(feedbackFor("She bought a red car yestrday"), { kind: "close", letters: 1 });
});

test("two and three wrong letters are told the same way, with their number", () => {
  assert.deepEqual(feedbackFor("She bougt a red cat yesterday"), { kind: "close", letters: 2 });
  assert.deepEqual(feedbackFor("She bougt a rad cat yesterday"), { kind: "close", letters: 3 });
});

test("more than three letters away is simply off", () => {
  assert.equal(CLOSE_LETTERS_MAX, 3);
  assert.deepEqual(feedbackFor("She bougt a rad cat yestrday"), { kind: "off" });
  assert.deepEqual(feedbackFor("Something else entirely"), { kind: "off" });
  assert.deepEqual(feedbackFor(""), { kind: "off" });
});

test("a missing word counts by its letters, an extra one too", () => {
  // "red" (3 letters) never typed.
  assert.deepEqual(feedbackFor("She bought a car yesterday"), { kind: "close", letters: 3 });
  // "so" (2 letters) typed beyond the sentence.
  assert.deepEqual(feedbackFor("She bought a red car yesterday so"), {
    kind: "close",
    letters: 2,
  });
});

test("giving up is its own answer, whatever was typed", () => {
  assert.deepEqual(feedbackFor("She bought a red car yesterday", true), { kind: "gaveUp" });
  assert.deepEqual(feedbackFor("", true), { kind: "gaveUp" });
});
