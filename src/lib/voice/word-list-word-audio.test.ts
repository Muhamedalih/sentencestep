import assert from "node:assert/strict";
import test from "node:test";

import {
  isSynthesizableWord,
  runWithinBudget,
  wordAudioCandidates,
} from "@/lib/voice/word-list-word-audio";

test("isSynthesizableWord: accepts a plain word, an apostrophe/hyphen word and a short phrase", () => {
  for (const word of ["went", "don't", "well-known", "Mr. Smith", "café", "ice cream"]) {
    assert.equal(isSynthesizableWord(word), true, word);
  }
});

test("isSynthesizableWord: rejects empty, digits, symbols, markup and anything sentence-length", () => {
  for (const word of [
    "",
    "   ",
    "42",
    "go2",
    "<speak>hi</speak>",
    "hello; world",
    "a".repeat(61),
    "…",
  ]) {
    assert.equal(isSynthesizableWord(word), false, JSON.stringify(word));
  }
});

test("wordAudioCandidates: exact spelling first, then lower-case, then Capitalized, de-duplicated", () => {
  assert.deepEqual(wordAudioCandidates("went"), ["went", "Went"]);
  assert.deepEqual(wordAudioCandidates("Went"), ["Went", "went"]);
  assert.deepEqual(wordAudioCandidates("  NASA "), ["NASA", "nasa", "Nasa"]);
  assert.deepEqual(wordAudioCandidates("   "), []);
});

test("wordAudioCandidates: whitespace is collapsed like the cache key does", () => {
  assert.deepEqual(wordAudioCandidates("ice   cream"), ["ice cream", "Ice cream"]);
});

test("runWithinBudget: runs every item, keeps results in item order, and respects the concurrency cap", async () => {
  let active = 0;
  let peak = 0;
  const results = await runWithinBudget(
    [1, 2, 3, 4, 5, 6],
    async (n) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return n * 10;
    },
    { concurrency: 2, deadlineAt: Date.now() + 5_000 },
  );
  assert.deepEqual(results, [10, 20, 30, 40, 50, 60]);
  assert.equal(peak, 2);
});

test("runWithinBudget: a task that throws leaves just that slot undefined", async () => {
  const results = await runWithinBudget(
    ["a", "boom", "c"],
    async (item) => {
      if (item === "boom") throw new Error("provider down");
      return item.toUpperCase();
    },
    { concurrency: 3, deadlineAt: Date.now() + 5_000 },
  );
  assert.deepEqual(results, ["A", undefined, "C"]);
});

test("runWithinBudget: stops starting new items once the deadline has passed", async () => {
  const started: number[] = [];
  const results = await runWithinBudget(
    [1, 2, 3, 4],
    async (n) => {
      started.push(n);
      return n;
    },
    { concurrency: 1, deadlineAt: Date.now() - 1 },
  );
  assert.deepEqual(started, []);
  assert.deepEqual(results, [undefined, undefined, undefined, undefined]);
});

test("runWithinBudget: returns at the deadline even while a slow task is still running", async () => {
  const startedAt = Date.now();
  const results = await runWithinBudget(
    ["fast", "slow"],
    async (item) => {
      if (item === "slow") await new Promise((resolve) => setTimeout(resolve, 2_000));
      return item;
    },
    { concurrency: 2, deadlineAt: Date.now() + 100 },
  );
  assert.ok(Date.now() - startedAt < 1_000, "must not wait for the slow task");
  assert.deepEqual(results, ["fast", undefined]);
});
