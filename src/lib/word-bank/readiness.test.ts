import assert from "node:assert/strict";
import test from "node:test";

import {
  READINESS_MIN_LESSONS,
  distinctWords,
  readinessByLesson,
  readinessOf,
} from "@/lib/word-bank/readiness";

test("a text's words are counted once, whatever their case or the punctuation around them", () => {
  assert.deepEqual(distinctWords(["The rain, the RAIN!", "It's raining — again."]), [
    "the",
    "rain",
    "it's",
    "raining",
    "again",
  ]);
});

test("the percent is whole and reaches 100 only when every word is known", () => {
  const words = Array.from({ length: 200 }, (_, i) => `w${i}`);
  const known = new Set(words.slice(0, 199));
  assert.deepEqual(readinessOf(words, known), { percent: 99, fresh: 1 });
  assert.deepEqual(readinessOf(words, new Set(words)), { percent: 100, fresh: 0 });
  assert.deepEqual(readinessOf(["a", "b", "c"], new Set(["a"])), { percent: 33, fresh: 2 });
  assert.equal(readinessOf([], known), null);
});

const index: Record<string, string[]> = {
  s1: ["the", "rain", "is", "cold"],
  s2: ["the", "bus", "is", "late"],
  s3: ["i", "am", "late", "again"],
  s4: ["we", "wait", "in", "the", "rain"],
  s5: ["my", "phone", "is", "cold"],
  s6: ["the", "phone", "is", "late", "today"],
  s7: ["a", "quiet", "neighbor"],
};

test("no line is shown until five lessons are finished", () => {
  assert.equal(READINESS_MIN_LESSONS, 5);
  assert.deepEqual(readinessByLesson(index, ["s1", "s2", "s3", "s4"]), {});
});

test("a finished lesson that is not in the index does not count towards the five", () => {
  assert.deepEqual(readinessByLesson(index, ["s1", "s2", "s3", "s4", "passage-9"]), {});
});

test("each unfinished lesson gets its line from the words of the finished ones; a finished lesson gets none", () => {
  const lines = readinessByLesson(index, ["s1", "s2", "s3", "s4", "s5"]);
  assert.deepEqual(Object.keys(lines).sort(), ["s6", "s7"]);
  // "the", "phone", "is", "late" are known; "today" is new.
  assert.deepEqual(lines.s6, { percent: 80, fresh: 1 });
  assert.deepEqual(lines.s7, { percent: 0, fresh: 3 });
});
