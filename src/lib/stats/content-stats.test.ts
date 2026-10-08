// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MIN_LESSONS_TO_QUOTE,
  MIN_WORDS_TO_QUOTE,
  MIN_WORD_LISTS_TO_QUOTE,
  NO_CONTENT_STATS,
  NO_GATE_FIGURES,
  buildContentStats,
  toGateFigures,
} from "./content-stats";

test("buildContentStats: figures at or above their minimum are quoted, rounded down", () => {
  assert.deepEqual(buildContentStats({ lessons: 437, words: 5_237, wordLists: 18 }), {
    lessons: 430,
    words: 5_200,
    wordLists: 18,
  });
});

test("buildContentStats: a figure below its minimum is left out, one at it is kept", () => {
  assert.deepEqual(
    buildContentStats({
      lessons: MIN_LESSONS_TO_QUOTE - 1,
      words: MIN_WORDS_TO_QUOTE,
      wordLists: MIN_WORD_LISTS_TO_QUOTE - 1,
    }),
    { lessons: null, words: MIN_WORDS_TO_QUOTE, wordLists: null },
  );
});

test("buildContentStats: an empty library quotes nothing", () => {
  assert.deepEqual(buildContentStats({ lessons: 0, words: 0, wordLists: 0 }), NO_CONTENT_STATS);
});

test("buildContentStats: a quoted figure never exceeds the real one", () => {
  for (const value of [20, 99, 100, 101, 999, 1_000, 1_234, 98_765]) {
    const quoted = buildContentStats({ lessons: value, words: value, wordLists: value }).lessons;
    assert.ok(quoted !== null && quoted <= value, String(value));
  }
});

test("toGateFigures: each figure that can be quoted becomes N+ in the reader's digits, the rest stay null", () => {
  const stats = buildContentStats({ lessons: 195, words: 480, wordLists: 24 });
  const figures = toGateFigures(stats, (value) => `<${value}>`);
  assert.equal(figures.lessons, `<${stats.lessons}>+`);
  assert.equal(figures.words, `<${stats.words}>+`);
  assert.equal(figures.wordLists, `<${stats.wordLists}>+`);

  const small = toGateFigures(buildContentStats({ lessons: 5, words: 10, wordLists: 1 }), String);
  assert.deepEqual(small, { lessons: null, words: null, wordLists: null });
  assert.deepEqual(toGateFigures(NO_CONTENT_STATS, String), NO_GATE_FIGURES);
});
