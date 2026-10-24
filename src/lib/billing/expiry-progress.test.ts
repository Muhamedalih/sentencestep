import assert from "node:assert/strict";
import { test } from "node:test";

import { expiryProgressLines } from "./expiry-progress";

/** A lesson of `n` sentences of three words each. */
const lesson = (id: string, n: number) =>
  Array.from({ length: n }, (_, index) => ({ lesson_id: id, en: `one two three ${index}` }));

const SENTENCES = [...lesson("a", 4), ...lesson("b", 4), ...lesson("c", 4)];

test("a learner with enough sentences gets a line; days are added from two days", () => {
  const lines = expiryProgressLines({
    userIds: ["u1", "u2", "u3"],
    progress: [
      { user_id: "u1", lesson_id: "a", mode: "normal" },
      { user_id: "u1", lesson_id: "b", mode: "stories" },
      { user_id: "u2", lesson_id: "a", mode: "normal" },
      { user_id: "u2", lesson_id: "b", mode: "normal" },
      { user_id: "u3", lesson_id: "a", mode: "normal" },
    ],
    sentences: SENTENCES,
    activity: [
      { user_id: "u1", day: "2026-10-20", kind: "active" },
      { user_id: "u1", day: "2026-10-21", kind: "active" },
      { user_id: "u2", day: "2026-10-20", kind: "active" },
      { user_id: "u2", day: "2026-10-20", kind: "active" },
    ],
  });
  assert.deepEqual(lines.get("u1"), { kind: "sentences_days", sentences: 8, days: 2 });
  assert.deepEqual(lines.get("u2"), { kind: "sentences", sentences: 8 });
  // Four sentences is a start, not a record: no line.
  assert.equal(lines.has("u3"), false);
});

test("a lesson counts once however many rows name it, and other kinds of day are not practice", () => {
  const lines = expiryProgressLines({
    userIds: ["u1"],
    progress: [
      { user_id: "u1", lesson_id: "a", mode: "normal" },
      { user_id: "u1", lesson_id: "a", mode: "normal" },
      { user_id: "u1", lesson_id: "b", mode: "normal" },
    ],
    sentences: SENTENCES,
    activity: [
      { user_id: "u1", day: "2026-10-20", kind: "active" },
      { user_id: "u1", day: "2026-10-21", kind: "grace" },
    ],
  });
  assert.deepEqual(lines.get("u1"), { kind: "sentences", sentences: 8 });
});

test("a lesson whose sentences are unknown adds nothing, and nobody is nobody", () => {
  const lines = expiryProgressLines({
    userIds: ["u1"],
    progress: [{ user_id: "u1", lesson_id: "gone", mode: "normal" }],
    sentences: SENTENCES,
    activity: [],
  });
  assert.equal(lines.size, 0);
  assert.equal(
    expiryProgressLines({ userIds: [], progress: [], sentences: [], activity: [] }).size,
    0,
  );
});
