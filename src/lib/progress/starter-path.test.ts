// Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { starterPathProgress } from "./starter-path";

const units = [
  { id: "n1", isFree: true },
  { id: "n2", isFree: true },
  { id: "n3", isFree: true },
  { id: "n4", isFree: false },
  { id: "n5", isFree: false },
];

test("starterPathProgress: counts only the free lessons, however many are done", () => {
  assert.deepEqual(starterPathProgress(units, []), { done: 0, total: 3, finished: false });
  assert.deepEqual(starterPathProgress(units, ["n1"]), { done: 1, total: 3, finished: false });
  assert.deepEqual(starterPathProgress(units, ["n1", "n2"]), {
    done: 2,
    total: 3,
    finished: false,
  });
});

test("starterPathProgress: finishes exactly when every free lesson is done", () => {
  assert.deepEqual(starterPathProgress(units, ["n1", "n2", "n3"]), {
    done: 3,
    total: 3,
    finished: true,
  });
});

test("starterPathProgress: lessons that are not free never count, even if completed while everything was open", () => {
  assert.deepEqual(starterPathProgress(units, ["n4", "n5"]), {
    done: 0,
    total: 3,
    finished: false,
  });
  assert.deepEqual(starterPathProgress(units, ["n1", "n2", "n3", "n4", "n5"]), {
    done: 3,
    total: 3,
    finished: true,
  });
});

test("starterPathProgress: ids that are not lessons, and repeats, are ignored", () => {
  assert.deepEqual(starterPathProgress(units, ["n1", "n1", "gone"]), {
    done: 1,
    total: 3,
    finished: false,
  });
});

test("starterPathProgress: with no free lessons there is nothing to finish", () => {
  assert.deepEqual(starterPathProgress([{ id: "p1", isFree: false }], ["p1"]), {
    done: 0,
    total: 0,
    finished: false,
  });
  assert.deepEqual(starterPathProgress([], []), { done: 0, total: 0, finished: false });
});
