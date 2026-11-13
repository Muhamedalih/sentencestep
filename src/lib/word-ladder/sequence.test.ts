import assert from "node:assert/strict";
import test from "node:test";

import {
  LADDER_PHASES,
  LADDER_STEPS,
  MAX_RETRIES,
  RETRY_LAG,
  buildExamQueue,
  buildQueue,
  canScramble,
  ladderOutcome,
  learnOrder,
  phaseOf,
  retryOf,
  scheduleRetry,
  stepsFor,
} from "@/lib/word-ladder/sequence";
import type { LadderCard, SteppedWord } from "@/lib/word-ladder/sequence";

const word = (id: string, over: Partial<SteppedWord> = {}): SteppedWord => ({
  id,
  word: id,
  meaningOptions: ["a", "b", "c", "d"],
  spellingOptions: [id, `${id}x`, `${id}y`, `${id}z`],
  ...over,
});

const four = [word("aunt"), word("uncle"), word("cousin"), word("niece")];
const label = (card: LadderCard) => `${card.wordId}:${card.step}`;

test("a word has five steps: meet, meaning, letters, hear and choose, hear and type", () => {
  assert.deepEqual([...LADDER_STEPS], ["meet", "meaning", "letters", "listen", "type"]);
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

test("four words: A, B and C are met and asked their meaning, then A's and B's letters, then D joins, then C's and D's letters", () => {
  const queue = buildQueue(four, "round-1");
  assert.deepEqual(queue.slice(0, 12).map(label), [
    "aunt:meet",
    "aunt:meaning",
    "uncle:meet",
    "uncle:meaning",
    "cousin:meet",
    "cousin:meaning",
    "aunt:letters",
    "uncle:letters",
    "niece:meet",
    "niece:meaning",
    "cousin:letters",
    "niece:letters",
  ]);
});

test("after the learning come the hearing test over all four, then the typed test over all four: twenty screens", () => {
  const queue = buildQueue(four, "round-1");
  assert.equal(queue.length, 12 + 4 + 4);
  assert.deepEqual(
    queue.slice(12, 16).map((card) => card.step),
    ["listen", "listen", "listen", "listen"],
  );
  assert.deepEqual(
    queue.slice(16).map((card) => card.step),
    ["type", "type", "type", "type"],
  );
  for (const [from, to] of [
    [12, 16],
    [16, 20],
  ] as const) {
    assert.deepEqual(
      queue
        .slice(from, to)
        .map((card) => card.wordId)
        .sort(),
      ["aunt", "cousin", "niece", "uncle"],
    );
  }
  assert.ok(queue.every((card) => card.retry === false && card.tries === 0));
});

test("three words: A, B and C met and asked their meaning, then their letters, then both tests", () => {
  const queue = buildQueue([word("aunt"), word("uncle"), word("cousin")], "round-1");
  assert.deepEqual(queue.slice(0, 9).map(label), [
    "aunt:meet",
    "aunt:meaning",
    "uncle:meet",
    "uncle:meaning",
    "cousin:meet",
    "cousin:meaning",
    "aunt:letters",
    "uncle:letters",
    "cousin:letters",
  ]);
  assert.equal(queue.length, 9 + 3 + 3);
});

test("the learning order is fixed for one to four words", () => {
  assert.deepEqual(
    learnOrder(1).map((t) => `${t.word}${t.kind[0]}`),
    ["0i", "0l"],
  );
  assert.deepEqual(
    learnOrder(2).map((t) => `${t.word}${t.kind[0]}`),
    ["0i", "1i", "0l", "1l"],
  );
  assert.deepEqual(
    learnOrder(4).map((t) => `${t.word}${t.kind[0]}`),
    ["0i", "1i", "2i", "0l", "1l", "3i", "2l", "3l"],
  );
  assert.deepEqual(learnOrder(0), []);
});

test("a test never opens with the word the screen before it was about, and no word is on two screens in a row except its meeting and meaning", () => {
  for (let n = 0; n < 60; n++) {
    const queue = buildQueue(four, `seed-${n}`);
    for (let i = 1; i < queue.length; i++) {
      if (queue[i]!.step === "meaning") continue;
      assert.notEqual(queue[i]!.wordId, queue[i - 1]!.wordId, `seed-${n} at ${i}`);
    }
  }
});

test("the same seed gives the same order, and the two tests are in different orders for some seeds", () => {
  assert.deepEqual(buildQueue(four, "same"), buildQueue(four, "same"));
  const differ = Array.from({ length: 30 }, (_, n) => buildQueue(four, `s${n}`)).some((queue) => {
    const listen = queue.filter((card) => card.step === "listen").map((card) => card.wordId);
    const type = queue.filter((card) => card.step === "type").map((card) => card.wordId);
    return listen.join() !== type.join();
  });
  assert.ok(differ);
});

test("a word without a screen kind is left out of that kind only", () => {
  const queue = buildQueue([word("aunt"), word("it", { meaningOptions: [] })], "seed");
  assert.deepEqual(
    queue.filter((card) => card.step === "meaning").map((card) => card.wordId),
    ["aunt"],
  );
  assert.deepEqual(queue.slice(0, 3).map(label), ["aunt:meet", "aunt:meaning", "it:meet"]);
  assert.equal(queue.filter((card) => card.step === "type").length, 2);
  assert.equal(queue.filter((card) => card.step === "letters").length, 1);
});

test("the progress bar counts the learning as one phase and each test as its own", () => {
  assert.deepEqual([...LADDER_PHASES], ["learn", "listen", "type"]);
  assert.equal(phaseOf("meet"), "learn");
  assert.equal(phaseOf("meaning"), "learn");
  assert.equal(phaseOf("letters"), "learn");
  assert.equal(phaseOf("listen"), "listen");
  assert.equal(phaseOf("type"), "type");
});

test("a miss earns the screen again, twice at most, and the meeting earns nothing", () => {
  const card: LadderCard = { wordId: "aunt", step: "meaning", retry: false, tries: 0 };
  const first = retryOf(card);
  assert.deepEqual(first, { wordId: "aunt", step: "meaning", retry: true, tries: 1 });
  const second = retryOf(first!);
  assert.deepEqual(second, { wordId: "aunt", step: "meaning", retry: true, tries: 2 });
  assert.equal(MAX_RETRIES, 2);
  assert.equal(retryOf(second!), null);
  assert.equal(retryOf({ wordId: "aunt", step: "meet", retry: false, tries: 0 }), null);
});

test("a retry comes back three screens later, not at the end of the round and not straight away", () => {
  const queue = buildQueue(four, "r");
  const at = 3;
  const miss = queue[at]!;
  const again = retryOf(miss)!;
  const next = scheduleRetry(queue, at, again);
  assert.equal(next.length, queue.length + 1);
  assert.deepEqual(next.slice(0, at + 1), queue.slice(0, at + 1));
  assert.equal(RETRY_LAG, 3);
  assert.deepEqual(next[at + 1 + RETRY_LAG], again);
  assert.deepEqual(next.slice(at + 1, at + 1 + RETRY_LAG), queue.slice(at + 1, at + 1 + RETRY_LAG));
});

test("with fewer screens left than the lag, the retry goes to the end", () => {
  const queue = buildQueue(four, "r");
  const lastIndex = queue.length - 1;
  const again = retryOf(queue[lastIndex]!)!;
  const next = scheduleRetry(queue, lastIndex, again);
  assert.deepEqual(next[next.length - 1], again);
  assert.equal(next.length, queue.length + 1);
  const nearEnd = scheduleRetry(queue, queue.length - 3, again);
  assert.deepEqual(nearEnd[nearEnd.length - 1], again);
});

test("the exam is every word heard and typed once, in a seeded order", () => {
  const exam = buildExamQueue(four, "x");
  assert.equal(exam.length, 4);
  assert.ok(exam.every((card) => card.step === "type" && !card.retry && card.tries === 0));
  assert.deepEqual(exam.map((card) => card.wordId).sort(), ["aunt", "cousin", "niece", "uncle"]);
  assert.deepEqual(buildExamQueue(four, "x"), exam);
});

test("the outcome is decided by the typed step: right all the way is clean, a miss earlier is assisted", () => {
  assert.equal(ladderOutcome({ earlierMisses: 0, typedFirst: null }), null);
  assert.equal(ladderOutcome({ earlierMisses: 0, typedFirst: true }), "clean");
  assert.equal(ladderOutcome({ earlierMisses: 2, typedFirst: true }), "assisted");
  assert.equal(ladderOutcome({ earlierMisses: 0, typedFirst: false }), "missed");
  assert.equal(ladderOutcome({ earlierMisses: 3, typedFirst: false }), "missed");
});

test("a one-word round (skipListen) is four steps: meet, meaning, letters, type", () => {
  const queue = buildQueue([word("apple")], "w", true);
  assert.deepEqual(
    queue.map((card) => card.step),
    ["meet", "meaning", "letters", "type"],
  );
});
