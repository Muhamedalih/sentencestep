import assert from "node:assert/strict";
import test from "node:test";

import { ladderRoundCount, nextRoundSize, planRound, roundSizes } from "@/lib/word-ladder/rounds";

const words = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `w${i + 1}` }));
const sum = (sizes: number[]) => sizes.reduce((a, b) => a + b, 0);

test("a topic is split into rounds of four, with threes only where the count needs them", () => {
  assert.deepEqual(roundSizes(0), []);
  assert.deepEqual(roundSizes(1), [1]);
  assert.deepEqual(roundSizes(2), [2]);
  assert.deepEqual(roundSizes(3), [3]);
  assert.deepEqual(roundSizes(4), [4]);
  assert.deepEqual(roundSizes(5), [3, 2]);
  assert.deepEqual(roundSizes(6), [3, 3]);
  assert.deepEqual(roundSizes(7), [4, 3]);
  assert.deepEqual(roundSizes(8), [4, 4]);
  assert.deepEqual(roundSizes(9), [3, 3, 3]);
  assert.deepEqual(roundSizes(25), [4, 4, 4, 4, 3, 3, 3]);
  assert.deepEqual(roundSizes(26), [4, 4, 4, 4, 4, 3, 3]);
  assert.deepEqual(roundSizes(28), [4, 4, 4, 4, 4, 4, 4]);
  assert.deepEqual(roundSizes(30), [4, 4, 4, 4, 4, 4, 3, 3]);
});

test("every split adds up, never has a round of more than four, and uses the fewest threes", () => {
  for (let n = 1; n <= 120; n++) {
    const sizes = roundSizes(n);
    assert.equal(sum(sizes), n, `n=${n}`);
    assert.ok(Math.max(...sizes) <= 4, `n=${n}`);
    if (n >= 6) assert.ok(Math.min(...sizes) >= 3, `n=${n}`);
    assert.ok(sizes.filter((size) => size === 3).length <= 3, `n=${n}`);
  }
});

test("the next round and the round count follow the split", () => {
  assert.equal(nextRoundSize(0), 0);
  assert.equal(nextRoundSize(25), 4);
  assert.equal(nextRoundSize(9), 3);
  assert.equal(nextRoundSize(5), 3);
  assert.equal(ladderRoundCount(25), 7);
  assert.equal(ladderRoundCount(30), 8);
});

test("walking a 25-word topic gives four rounds of four and three of three, numbered 1 to 7", () => {
  const topic = words(25);
  const done = new Set<string>();
  const sizes: number[] = [];
  const numbers: number[] = [];
  for (let guard = 0; guard < 20; guard++) {
    const plan = planRound(topic, done);
    if (!plan) break;
    sizes.push(plan.words.length);
    numbers.push(plan.number);
    assert.equal(plan.count, 7);
    assert.equal(plan.done, done.size);
    for (const word of plan.words) done.add(word.id);
  }
  assert.deepEqual(sizes, [4, 4, 4, 4, 3, 3, 3]);
  assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(planRound(topic, done), null);
});

test("words finished in the old Practice, in any order, are not asked again", () => {
  const topic = words(10);
  const plan = planRound(topic, ["w1", "w2", "w4", "w9"]);
  assert.deepEqual(
    plan?.words.map((word) => word.id),
    ["w3", "w5", "w6"],
  );
  assert.equal(plan?.done, 4);
  assert.equal(plan?.total, 10);
});

test("a word that is still open keeps its round open: it is offered on its own when it is the last", () => {
  const topic = words(6);
  const plan = planRound(topic, ["w1", "w2", "w3", "w4", "w5"]);
  assert.deepEqual(
    plan?.words.map((word) => word.id),
    ["w6"],
  );
  assert.equal(plan?.number, 2);
  assert.equal(plan?.count, 2);
});

test("a topic of one or two words is a single round", () => {
  assert.equal(planRound(words(2), [])?.words.length, 2);
  assert.equal(planRound(words(2), [])?.count, 1);
  assert.equal(planRound(words(1), [])?.number, 1);
});
