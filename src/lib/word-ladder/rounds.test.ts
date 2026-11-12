import assert from "node:assert/strict";
import test from "node:test";

import { ladderRoundCount, nextRoundSize, planRound } from "@/lib/word-ladder/rounds";

const words = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `w${i + 1}` }));

test("a topic is split into rounds of three, and a lone leftover joins the last round", () => {
  assert.equal(ladderRoundCount(0), 0);
  assert.equal(ladderRoundCount(1), 1);
  assert.equal(ladderRoundCount(3), 1);
  assert.equal(ladderRoundCount(4), 1);
  assert.equal(ladderRoundCount(5), 2);
  assert.equal(ladderRoundCount(7), 2);
  assert.equal(ladderRoundCount(25), 8);
  assert.equal(ladderRoundCount(26), 9);
  assert.equal(ladderRoundCount(30), 10);
});

test("a round takes three words, or all of a tail of four or fewer", () => {
  assert.equal(nextRoundSize(0), 0);
  assert.equal(nextRoundSize(1), 1);
  assert.equal(nextRoundSize(4), 4);
  assert.equal(nextRoundSize(5), 3);
  assert.equal(nextRoundSize(25), 3);
});

test("walking a 25-word topic gives seven rounds of three and a last of four, numbered 1 to 8", () => {
  const topic = words(25);
  const done = new Set<string>();
  const sizes: number[] = [];
  const numbers: number[] = [];
  for (let guard = 0; guard < 20; guard++) {
    const plan = planRound(topic, done);
    if (!plan) break;
    sizes.push(plan.words.length);
    numbers.push(plan.number);
    assert.equal(plan.count, 8);
    assert.equal(plan.done, done.size);
    for (const word of plan.words) done.add(word.id);
  }
  assert.deepEqual(sizes, [3, 3, 3, 3, 3, 3, 3, 4]);
  assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(planRound(topic, done), null);
});

test("a 30-word topic is ten rounds of three", () => {
  const topic = words(30);
  const done = new Set<string>();
  let rounds = 0;
  for (let plan = planRound(topic, done); plan; plan = planRound(topic, done)) {
    assert.equal(plan.words.length, 3);
    for (const word of plan.words) done.add(word.id);
    rounds += 1;
  }
  assert.equal(rounds, 10);
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
