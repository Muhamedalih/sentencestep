import assert from "node:assert/strict";
import test from "node:test";

import { MAX_ROUND_WORDS } from "@/lib/word-drop/engine";
import { MAX_POINTS_PER_WORD, MAX_WORDS, parseDailyScore } from "@/lib/word-drop/scores";

const NOON = new Date("2026-11-23T12:00:00Z");
const good = { day: "2026-11-23", level: 2, score: 340, accuracy: 94, wpm: 28, words: 21 };

test("a score that fits its words and speed is accepted", () => {
  assert.deepEqual(parseDailyScore(good, NOON), good);
});

test("the most words come from the round's own pace, not from a guess", () => {
  assert.equal(MAX_WORDS, MAX_ROUND_WORDS);
  assert.equal(
    parseDailyScore({ ...good, words: MAX_WORDS + 1, score: (MAX_WORDS + 1) * 20 }, NOON),
    null,
  );
});

test("every word earns at least ten points and at most thirty", () => {
  assert.equal(parseDailyScore({ ...good, score: 21 * 10 - 1 }, NOON), null);
  assert.deepEqual(parseDailyScore({ ...good, score: 21 * 10 }, NOON), { ...good, score: 210 });
  assert.equal(parseDailyScore({ ...good, score: 21 * MAX_POINTS_PER_WORD + 1 }, NOON), null);
});

test("the speed must fit the words: neither faster than ten-letter words allow, nor slower than three-letter ones", () => {
  // 21 words of at most 10 letters in at least 15 seconds: at most 168 a minute.
  assert.equal(parseDailyScore({ ...good, wpm: 200 }, NOON), null);
  assert.notEqual(parseDailyScore({ ...good, wpm: 120 }, NOON), null);
  // 40 words typed cannot read as 1 word a minute.
  assert.equal(parseDailyScore({ ...good, words: 40, score: 600, wpm: 1 }, NOON), null);
  assert.notEqual(parseDailyScore({ ...good, words: 40, score: 600, wpm: 12 }, NOON), null);
});

test("a round with no words is a zero, never a score or a speed", () => {
  const zero = { day: "2026-11-23", level: 1, score: 0, accuracy: 100, wpm: 0, words: 0 };
  assert.deepEqual(parseDailyScore(zero, NOON), zero);
  assert.equal(parseDailyScore({ ...zero, score: 10 }, NOON), null);
  assert.equal(parseDailyScore({ ...zero, wpm: 50 }, NOON), null);
});
