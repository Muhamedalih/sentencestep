import assert from "node:assert/strict";
import test from "node:test";

import { composeExam } from "@/lib/sentence-bank/exam";

const today = ["t1", "t2", "t3", "t4"];
const earlier = ["e1", "e2", "e3", "e4"];

test("a three-sentence exam asks two about today and one from before, today's first", () => {
  assert.deepEqual(composeExam({ today, earlier, limit: 3 }), ["t1", "t2", "e1"]);
});

test("a four-sentence exam is split evenly", () => {
  assert.deepEqual(composeExam({ today, earlier, limit: 4 }), ["t1", "t2", "e1", "e2"]);
});

test("a learner who finished nothing today is asked only about before", () => {
  assert.deepEqual(composeExam({ today: [], earlier, limit: 3 }), ["e1", "e2", "e3"]);
});

test("a learner on their first day is asked only about today", () => {
  assert.deepEqual(composeExam({ today, earlier: [], limit: 3 }), ["t1", "t2", "t3"]);
});

test("when one side runs short the other fills the exam, and it never grows past the limit", () => {
  assert.deepEqual(composeExam({ today: ["t1"], earlier: ["e1", "e2", "e3"], limit: 3 }), [
    "t1",
    "e1",
    "e2",
  ]);
  assert.deepEqual(composeExam({ today: ["t1", "t2", "t3"], earlier: ["e1"], limit: 3 }), [
    "t1",
    "t2",
    "e1",
  ]);
  assert.deepEqual(composeExam({ today: ["t1"], earlier: ["e1"], limit: 5 }), ["t1", "e1"]);
});

test("a single sentence is the earlier one when there is one, else today's", () => {
  assert.deepEqual(composeExam({ today, earlier, limit: 1 }), ["e1"]);
  assert.deepEqual(composeExam({ today, earlier: [], limit: 1 }), ["t1"]);
});

test("nothing to ask, or nothing wanted, is an empty exam", () => {
  assert.deepEqual(composeExam({ today: [], earlier: [], limit: 3 }), []);
  assert.deepEqual(composeExam({ today, earlier, limit: 0 }), []);
  assert.deepEqual(composeExam({ today, earlier, limit: -2 }), []);
});
