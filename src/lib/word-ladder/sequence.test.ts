import assert from "node:assert/strict";
import test from "node:test";

import {
  LADDER_PHASES,
  LADDER_STEPS,
  buildQueue,
  ladderOutcome,
  phaseOf,
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

test("a word goes through all four kinds of screen: meet, meaning, hear and choose, hear and type", () => {
  assert.deepEqual([...LADDER_STEPS], ["meet", "meaning", "listen", "type"]);
  assert.deepEqual(stepsFor(word("aunt")), [...LADDER_STEPS]);
});

test("steps that cannot be a question are skipped for that word only", () => {
  assert.ok(!stepsFor(word("aunt", { meaningOptions: ["a"] })).includes("meaning"));
  assert.ok(!stepsFor(word("aunt", { spellingOptions: ["aunt"] })).includes("listen"));
  assert.deepEqual(stepsFor(word("it", { meaningOptions: [], spellingOptions: [] })), [
    "meet",
    "type",
  ]);
});

test("each word is met and asked its meaning at once, one word after the other", () => {
  const queue = buildQueue([word("aunt"), word("uncle"), word("cousin")], "round-1");
  assert.deepEqual(
    queue.slice(0, 6).map((card) => `${card.wordId}:${card.step}`),
    [
      "aunt:meet",
      "aunt:meaning",
      "uncle:meet",
      "uncle:meaning",
      "cousin:meet",
      "cousin:meaning",
    ],
  );
});

test("after the introductions come the two tests, one after the other over every word: twelve screens in all", () => {
  const queue = buildQueue([word("aunt"), word("uncle"), word("cousin")], "round-1");
  assert.equal(queue.length, 12);
  assert.deepEqual(
    queue.slice(6).map((card) => card.step),
    ["listen", "listen", "listen", "type", "type", "type"],
  );
  for (const [from, to] of [
    [6, 9],
    [9, 12],
  ] as const) {
    assert.deepEqual(
      queue
        .slice(from, to)
        .map((card) => card.wordId)
        .sort(),
      ["aunt", "cousin", "uncle"],
    );
  }
  assert.ok(queue.every((card) => card.retry === false));
});

test("a test never opens with the word the screen before it was about", () => {
  for (let n = 0; n < 60; n++) {
    const queue = buildQueue([word("aunt"), word("uncle"), word("cousin")], `seed-${n}`);
    for (let i = 1; i < queue.length; i++) {
      // The meeting and the meaning of one word are meant to be side by side.
      if (queue[i]!.step === "meaning") continue;
      assert.notEqual(queue[i]!.wordId, queue[i - 1]!.wordId, `seed-${n} at ${i}`);
    }
  }
});

test("the same seed gives the same order", () => {
  const words = [word("aunt"), word("uncle"), word("cousin"), word("niece")];
  assert.deepEqual(buildQueue(words, "same"), buildQueue(words, "same"));
});

test("a word without a screen kind is left out of that kind only", () => {
  const queue = buildQueue([word("aunt"), word("it", { meaningOptions: [] })], "seed");
  assert.deepEqual(
    queue.filter((card) => card.step === "meaning").map((card) => card.wordId),
    ["aunt"],
  );
  assert.deepEqual(
    queue.slice(0, 3).map((card) => `${card.wordId}:${card.step}`),
    ["aunt:meet", "aunt:meaning", "it:meet"],
  );
  assert.equal(queue.filter((card) => card.step === "type").length, 2);
});

test("a round of four words is four introductions and two tests of four", () => {
  const queue = buildQueue([word("aunt"), word("uncle"), word("cousin"), word("niece")], "four");
  assert.equal(queue.length, 8 + 8);
});

test("the progress bar counts the introductions as one phase and each test as its own", () => {
  assert.deepEqual([...LADDER_PHASES], ["intro", "listen", "type"]);
  assert.equal(phaseOf("meet"), "intro");
  assert.equal(phaseOf("meaning"), "intro");
  assert.equal(phaseOf("listen"), "listen");
  assert.equal(phaseOf("type"), "type");
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
