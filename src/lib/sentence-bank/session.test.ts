import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_SECOND_CHANCES,
  queueAfterAnswer,
  startQueue,
  summarizeReview,
} from "@/lib/sentence-bank/session";
import type { ReviewResult } from "@/lib/sentence-bank/session";

test("by default a visit gives no second chance: a miss comes back tomorrow, nothing more is asked now", () => {
  assert.equal(MAX_SECOND_CHANCES, 0);
  const queue = startQueue(["a", "b", "c"]);
  assert.deepEqual(queueAfterAnswer(queue, 0, "missed"), queue);
  assert.deepEqual(queueAfterAnswer(queue, 2, "missed"), queue);
});

test("when second chances are given, a sentence missed on its first go is asked once more at the end, and never a third time", () => {
  const queue = startQueue(["a", "b", "c"]);
  assert.deepEqual(queue, [
    { item: "a", attempt: 0 },
    { item: "b", attempt: 0 },
    { item: "c", attempt: 0 },
  ]);

  const afterMiss = queueAfterAnswer(queue, 0, "missed", 2);
  assert.deepEqual(afterMiss, [...queue, { item: "a", attempt: 1 }]);

  // Missing the second chance too leaves the queue as it is.
  const again = queueAfterAnswer(afterMiss, 3, "missed", 2);
  assert.deepEqual(again, afterMiss);
  // Getting the second chance right changes nothing either.
  assert.deepEqual(queueAfterAnswer(afterMiss, 3, "clean", 2), afterMiss);
});

test("a visit never gives more second chances than it was allowed", () => {
  const queue = startQueue(["a", "b", "c"]);
  const one = queueAfterAnswer(queue, 0, "missed", 1);
  assert.equal(one.length, 4);
  // The allowance is used up: the next miss adds nothing.
  assert.deepEqual(queueAfterAnswer(one, 1, "missed", 1), one);
  assert.equal(queueAfterAnswer(one, 1, "missed", 2).length, 5);
});

test("a right answer, even a helped one, adds nothing to the queue", () => {
  const queue = startQueue(["a", "b"]);
  assert.deepEqual(queueAfterAnswer(queue, 0, "clean"), queue);
  assert.deepEqual(queueAfterAnswer(queue, 1, "assisted"), queue);
});

test("answering an entry that is not there leaves the queue alone, and the old queue is never changed", () => {
  const queue = startQueue(["a"]);
  const snapshot = JSON.stringify(queue);
  assert.deepEqual(queueAfterAnswer(queue, 5, "missed", 2), queue);
  queueAfterAnswer(queue, 0, "missed", 2);
  assert.equal(JSON.stringify(queue), snapshot);
});

test("a visit adds up to how many were remembered with no help, and in which forms they were asked", () => {
  const results: ReviewResult[] = [
    { sentenceId: "a", form: "partial", outcome: "clean" },
    { sentenceId: "b", form: "audio", outcome: "assisted" },
    { sentenceId: "c", form: "translate", outcome: "missed" },
    { sentenceId: "d", form: "partial", outcome: "clean" },
  ];
  assert.deepEqual(summarizeReview(results), {
    total: 4,
    clean: 2,
    assisted: 1,
    missed: 1,
    forms: { partial: 2, audio: 1, translate: 1 },
  });
  assert.deepEqual(summarizeReview([]), {
    total: 0,
    clean: 0,
    assisted: 0,
    missed: 0,
    forms: { partial: 0, audio: 0, translate: 0 },
  });
});
