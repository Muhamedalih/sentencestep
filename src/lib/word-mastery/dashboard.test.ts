import assert from "node:assert/strict";
import test from "node:test";

import {
  RANK_THRESHOLDS,
  bandOf,
  bandsFromCompleted,
  bandsFromGroupMastery,
  chunk,
  isWeak,
  masteredPercent,
  nextRank,
  rankFor,
  ringFractions,
  selectWeakWords,
  strengthPips,
  sumBands,
  summarizeBands,
} from "@/lib/word-mastery/dashboard";
import { STRONG_STRENGTH, summarizeGroupMastery } from "@/lib/word-mastery/schedule";
import type { MasteryState } from "@/lib/word-mastery/schedule";

const TODAY = "2025-03-10";
const at = (strength: number, dueOn = "2025-03-11"): MasteryState => ({ strength, dueOn });

test("a word is new until it has a schedule row, learning until it is strong, then mastered", () => {
  assert.equal(bandOf(undefined), "new");
  assert.equal(bandOf(null), "new");
  assert.equal(bandOf(at(0)), "learning");
  assert.equal(bandOf(at(STRONG_STRENGTH - 1)), "learning");
  assert.equal(bandOf(at(STRONG_STRENGTH)), "mastered");
  assert.equal(bandOf(at(5)), "mastered");
});

test("summarizeBands counts every word in exactly one band", () => {
  const states = new Map([
    ["a", at(0)],
    ["b", at(2)],
    ["c", at(4)],
    ["d", at(5)],
  ]);
  const bands = summarizeBands(["a", "b", "c", "d", "e", "f"], states);
  assert.deepEqual(bands, { total: 6, new: 2, learning: 2, mastered: 2 });
  assert.equal(bands.new + bands.learning + bands.mastered, bands.total);
});

test("the bands of an already-summarized group agree with counting the words directly", () => {
  const ids = ["a", "b", "c", "d", "e"];
  const states = new Map([
    ["a", at(1)],
    ["b", at(4)],
    ["c", at(5)],
  ]);
  assert.deepEqual(
    bandsFromGroupMastery(summarizeGroupMastery(ids, states, TODAY)),
    summarizeBands(ids, states),
  );
  assert.deepEqual(
    bandsFromGroupMastery(summarizeGroupMastery([], new Map(), TODAY)),
    summarizeBands([], new Map()),
  );
});

test("with no schedule, finished words are learning and nothing is claimed as mastered", () => {
  assert.deepEqual(bandsFromCompleted(20, 0), { total: 20, new: 20, learning: 0, mastered: 0 });
  assert.deepEqual(bandsFromCompleted(20, 7), { total: 20, new: 13, learning: 7, mastered: 0 });
  // Local progress can name words the group no longer has: never more than the total, never negative.
  assert.deepEqual(bandsFromCompleted(20, 99), { total: 20, new: 0, learning: 20, mastered: 0 });
  assert.deepEqual(bandsFromCompleted(20, -3), { total: 20, new: 20, learning: 0, mastered: 0 });
});

test("sumBands adds the groups up, and an empty list is all zeros", () => {
  assert.deepEqual(sumBands([]), { total: 0, new: 0, learning: 0, mastered: 0 });
  assert.deepEqual(
    sumBands([
      { total: 20, new: 10, learning: 6, mastered: 4 },
      { total: 25, new: 25, learning: 0, mastered: 0 },
    ]),
    { total: 45, new: 35, learning: 6, mastered: 4 },
  );
});

test("ring fractions add up to a whole circle, or to nothing for an empty topic", () => {
  const fractions = ringFractions({ total: 20, new: 10, learning: 6, mastered: 4 });
  assert.equal(fractions.mastered, 0.2);
  assert.equal(fractions.learning, 0.3);
  assert.equal(fractions.new, 0.5);
  assert.ok(Math.abs(fractions.mastered + fractions.learning + fractions.new - 1) < 1e-9);
  assert.deepEqual(ringFractions({ total: 0, new: 0, learning: 0, mastered: 0 }), {
    mastered: 0,
    learning: 0,
    new: 0,
  });
});

test("mastered percent rounds the share of mastered words", () => {
  assert.equal(masteredPercent({ total: 0, new: 0, learning: 0, mastered: 0 }), 0);
  assert.equal(masteredPercent({ total: 3, new: 1, learning: 1, mastered: 1 }), 33);
  assert.equal(masteredPercent({ total: 20, new: 0, learning: 0, mastered: 20 }), 100);
});

test("ranks are earned by the share of mastered words, with no rank below bronze", () => {
  const of = (mastered: number, total = 20) => ({
    total,
    new: total - mastered,
    learning: 0,
    mastered,
  });
  assert.equal(rankFor(of(0, 0)), "none");
  assert.equal(rankFor(of(0)), "none");
  assert.equal(rankFor(of(4)), "none"); // 20%
  assert.equal(rankFor(of(5)), "bronze"); // 25%
  assert.equal(rankFor(of(11)), "bronze");
  assert.equal(rankFor(of(12)), "silver"); // 60%
  assert.equal(rankFor(of(17)), "silver");
  assert.equal(rankFor(of(18)), "gold"); // 90%
  assert.equal(rankFor(of(20)), "gold");
  assert.deepEqual(Object.keys(RANK_THRESHOLDS), ["bronze", "silver", "gold"]);
});

test("the next rank says how many more mastered words reach it, and stops at gold", () => {
  const of = (mastered: number, total = 20) => ({
    total,
    new: total - mastered,
    learning: 0,
    mastered,
  });
  assert.deepEqual(nextRank(of(0)), { rank: "bronze", wordsToGo: 5 });
  assert.deepEqual(nextRank(of(3)), { rank: "bronze", wordsToGo: 2 });
  assert.deepEqual(nextRank(of(5)), { rank: "silver", wordsToGo: 7 });
  assert.deepEqual(nextRank(of(12)), { rank: "gold", wordsToGo: 6 });
  assert.equal(nextRank(of(18)), null);
  assert.equal(nextRank(of(0, 0)), null);
  // The words-to-go always lands exactly on the rank.
  for (let mastered = 0; mastered < 18; mastered += 1) {
    const next = nextRank(of(mastered));
    assert.ok(next);
    assert.equal(rankFor(of(mastered + next.wordsToGo)), next.rank);
  }
});

test("a weak word is one met but not secured; a new word is not weak", () => {
  assert.equal(isWeak(undefined), false);
  assert.equal(isWeak(at(0)), true);
  assert.equal(isWeak(at(2)), true);
  assert.equal(isWeak(at(3)), false);
  assert.equal(isWeak(at(5)), false);
});

test("weak practice picks the shaky words weakest first, then longest overdue, then group order", () => {
  const words = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id }));
  const states = new Map<string, MasteryState>([
    ["a", at(2, "2025-03-12")],
    ["b", at(0, "2025-03-11")],
    ["c", at(5)],
    ["d", at(0, "2025-03-09")],
    ["f", at(2, "2025-03-12")],
  ]);
  // "e" was never met (new, not weak) and "c" is strong.
  assert.deepEqual(
    selectWeakWords(words, states).map((word) => word.id),
    ["d", "b", "a", "f"],
  );
  assert.deepEqual(selectWeakWords(words, new Map()), []);
});

test("strength pips are the strength, clamped to the scale", () => {
  assert.equal(strengthPips(undefined), 0);
  assert.equal(strengthPips(at(3)), 3);
  assert.equal(strengthPips(at(9)), 5);
  assert.equal(strengthPips(at(-2)), 0);
});

test("chunk splits into batches of five with a shorter last one, and never drops or repeats a word", () => {
  const words = Array.from({ length: 23 }, (_, i) => i);
  const batches = chunk(words, 5);
  assert.deepEqual(
    batches.map((batch) => batch.length),
    [5, 5, 5, 5, 3],
  );
  assert.deepEqual(batches.flat(), words);
  assert.deepEqual(chunk([], 5), []);
  assert.throws(() => chunk(words, 0));
});
