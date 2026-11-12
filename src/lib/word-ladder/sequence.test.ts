import assert from "node:assert/strict";
import test from "node:test";

import {
  LADDER_STEPS,
  buildQueue,
  canScramble,
  ladderOutcome,
  retryOf,
  stepsFor,
} from "@/lib/word-ladder/sequence";
import type { SteppedWord } from "@/lib/word-ladder/sequence";

const word = (id: string, over: Partial<SteppedWord> = {}): SteppedWord => ({
  id,
  word: id,
  meaningOptions: ["a", "b", "c", "d"],
  spellingOptions: [id, `${id}x`, `${id}y`, `${id}z`],
  ...over,
});

test("a word that can be scrambled goes through all five steps", () => {
  assert.deepEqual(stepsFor(word("aunt")), [...LADDER_STEPS]);
});

test("steps that cannot be a question are skipped for that word only", () => {
  assert.ok(!stepsFor(word("aunt", { meaningOptions: ["a"] })).includes("meaning"));
  assert.ok(!stepsFor(word("aunt", { spellingOptions: ["aunt"] })).includes("listen"));
  assert.ok(!stepsFor(word("ice cream")).includes("letters"));
  assert.ok(!stepsFor(word("it")).includes("letters"));
  assert.ok(!stepsFor(word("aaa")).includes("letters"));
  assert.deepEqual(stepsFor(word("it", { meaningOptions: [], spellingOptions: [] })), [
    "meet",
    "type",
  ]);
});

test("a word is scrambled only when it is plain letters, three to fourteen, not one letter repeated", () => {
  assert.equal(canScramble("aunt"), true);
  assert.equal(canScramble("sovereignty"), true);
  assert.equal(canScramble("it"), false);
  assert.equal(canScramble("aaa"), false);
  assert.equal(canScramble("well-known"), false);
  assert.equal(canScramble("Aunt"), false);
  assert.equal(canScramble("a".repeat(15)), false);
});

test("a round of three is fifteen screens, step by step: every word's step one, then every word's step two...", () => {
  const queue = buildQueue([word("aunt"), word("uncle"), word("cousin")], "round-1");
  assert.equal(queue.length, 15);
  assert.deepEqual(
    queue.map((card) => card.step),
    LADDER_STEPS.flatMap((step) => [step, step, step]),
  );
  for (let step = 0; step < 5; step++) {
    const ids = queue.slice(step * 3, step * 3 + 3).map((card) => card.wordId);
    assert.deepEqual([...ids].sort(), ["aunt", "cousin", "uncle"]);
  }
  assert.ok(queue.every((card) => card.retry === false));
});

test("the meeting step keeps the topic's order", () => {
  const queue = buildQueue([word("aunt"), word("uncle"), word("cousin")], "any");
  assert.deepEqual(
    queue.slice(0, 3).map((card) => card.wordId),
    ["aunt", "uncle", "cousin"],
  );
});

test("a step never opens with the word the step before it ended on", () => {
  for (let n = 0; n < 60; n++) {
    const queue = buildQueue([word("aunt"), word("uncle"), word("cousin")], `seed-${n}`);
    for (let i = 1; i < queue.length; i++) {
      assert.notEqual(queue[i]!.wordId, queue[i - 1]!.wordId, `seed-${n} at ${i}`);
    }
  }
});

test("the same seed gives the same order", () => {
  const words = [word("aunt"), word("uncle"), word("cousin"), word("niece")];
  assert.deepEqual(buildQueue(words, "same"), buildQueue(words, "same"));
});

test("a word without a step is left out of that step only", () => {
  const queue = buildQueue([word("aunt"), word("it", { meaningOptions: [] })], "seed");
  const meaning = queue.filter((card) => card.step === "meaning").map((card) => card.wordId);
  assert.deepEqual(meaning, ["aunt"]);
  assert.equal(queue.filter((card) => card.step === "type").length, 2);
});

test("a miss earns one more go at the end, never two, and the meeting earns none", () => {
  const card = { wordId: "aunt", step: "meaning", retry: false } as const;
  assert.deepEqual(retryOf(card), { wordId: "aunt", step: "meaning", retry: true });
  assert.equal(retryOf({ ...card, retry: true }), null);
  assert.equal(retryOf({ wordId: "aunt", step: "meet", retry: false }), null);
});

test("the outcome is decided by the typed step: right all the way is clean, a miss earlier is assisted", () => {
  assert.equal(ladderOutcome({ earlierMisses: 0, typedFirst: null }), null);
  assert.equal(ladderOutcome({ earlierMisses: 0, typedFirst: true }), "clean");
  assert.equal(ladderOutcome({ earlierMisses: 2, typedFirst: true }), "assisted");
  assert.equal(ladderOutcome({ earlierMisses: 0, typedFirst: false }), "missed");
  assert.equal(ladderOutcome({ earlierMisses: 3, typedFirst: false }), "missed");
});
