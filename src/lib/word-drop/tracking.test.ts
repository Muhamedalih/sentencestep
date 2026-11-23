import assert from "node:assert/strict";
import test from "node:test";

import { parseWordDropReport } from "@/lib/word-drop/tracking";

test("a started report becomes a WORD_DROP_STARTED event with counts only", () => {
  const parsed = parseWordDropReport({
    event: "started",
    mode: "sentences",
    kind: "free",
    level: 2,
  });
  assert.deepEqual(parsed?.event, {
    name: "WORD_DROP_STARTED",
    category: "ENGAGEMENT",
    properties: { mode: "sentences", kind: "free", level: 2 },
  });
});

test("a finished report carries the score, accuracy and words, and nothing the browser adds", () => {
  const parsed = parseWordDropReport({
    event: "finished",
    mode: "mid",
    kind: "daily",
    level: 1,
    score: 340,
    accuracy: 94,
    words: 21,
    word: "aunt",
    name: "someone",
  });
  assert.deepEqual(parsed?.event, {
    name: "WORD_DROP_FINISHED",
    category: "ENGAGEMENT",
    properties: { mode: "mid", kind: "daily", level: 1, score: 340, accuracy: 94, words: 21 },
  });
});

test("a shared report names the way and the kind of round", () => {
  assert.deepEqual(parseWordDropReport({ event: "shared", how: "link", kind: "friend" })?.event, {
    name: "WORD_DROP_SHARED",
    category: "ENGAGEMENT",
    properties: { how: "link", kind: "friend" },
  });
  assert.equal(parseWordDropReport({ event: "shared", how: "email", kind: "free" }), null);
});

test("reports the game could not have sent are dropped", () => {
  const ok = { event: "started", mode: "easy", kind: "free", level: 1 };
  assert.notEqual(parseWordDropReport(ok), null);
  const finished = { event: "finished", mode: "easy", kind: "free", level: 1, score: 10 };
  for (const bad of [
    null,
    "x",
    {},
    { ...ok, event: "other" },
    { ...ok, mode: "insane" },
    { ...ok, kind: "tournament" },
    { ...ok, level: 4 },
    { ...ok, level: 1.5 },
    { ...finished, score: -1, accuracy: 50, words: 3 },
    { ...finished, accuracy: 101, words: 3 },
    { ...finished, accuracy: 50, words: 999 },
  ]) {
    assert.equal(parseWordDropReport(bad), null);
  }
});
