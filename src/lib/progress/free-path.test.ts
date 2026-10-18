// Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { freePathFocus, freePathForLevel, lockedLessonOutcome, pathChips } from "./free-path";

/** The real catalog's shape: three levels, each a unit of four lessons plus its own First Steps copy at the end of the list. */
const units = [
  { id: "normal-1", level: 1, order: 1, isFree: true },
  { id: "normal-2", level: 1, order: 2, isFree: true },
  { id: "normal-3", level: 1, order: 3, isFree: true },
  { id: "normal-4", level: 1, order: 4, isFree: false },
  { id: "normal-5", level: 2, order: 5, isFree: true },
  { id: "normal-6", level: 2, order: 6, isFree: true },
  { id: "normal-7", level: 2, order: 7, isFree: true },
  { id: "normal-9", level: 2, order: 8, isFree: false },
  { id: "normal-8", level: 3, order: 9, isFree: true },
  { id: "normal-11", level: 3, order: 10, isFree: true },
  { id: "normal-10", level: 3, order: 11, isFree: true },
  { id: "normal-12", level: 3, order: 12, isFree: false },
  { id: "normal-13", level: 1, order: 13, isFree: false },
  { id: "onboarding-beginner", level: 1, order: 37, isFree: true },
  { id: "onboarding-intermediate", level: 2, order: 38, isFree: true },
  { id: "onboarding-advanced", level: 3, order: 39, isFree: true },
];

test("freePathForLevel: Beginner is First Steps, pinned first, then the free lessons in catalog order", () => {
  const path = freePathForLevel(units, 1, []);
  assert.deepEqual(path.ids, ["onboarding-beginner", "normal-1", "normal-2", "normal-3"]);
  assert.equal(path.total, 4);
  assert.equal(path.done, 0);
  assert.equal(path.finished, false);
  assert.deepEqual(path.remainingIds, path.ids);
});

test("freePathForLevel: a level whose First Steps is hidden counts only the lessons its catalog shows", () => {
  assert.deepEqual(freePathForLevel(units, 2, []).ids, ["normal-5", "normal-6", "normal-7"]);
  assert.deepEqual(freePathForLevel(units, 3, []).ids, ["normal-8", "normal-11", "normal-10"]);
});

test("freePathForLevel: the hidden First Steps a learner already finished counts as theirs", () => {
  const path = freePathForLevel(units, 2, ["onboarding-intermediate", "normal-5"]);
  assert.deepEqual(path.ids, ["onboarding-intermediate", "normal-5", "normal-6", "normal-7"]);
  assert.equal(path.total, 4);
  assert.equal(path.done, 2);
  assert.deepEqual(path.remainingIds, ["normal-6", "normal-7"]);
});

test("freePathForLevel: Premium lessons never count, even when they were finished while everything was open", () => {
  const path = freePathForLevel(units, 1, ["normal-4", "normal-13", "normal-1"]);
  assert.equal(path.total, 4);
  assert.equal(path.done, 1);
  assert.deepEqual(path.remainingIds, ["onboarding-beginner", "normal-2", "normal-3"]);
});

test("freePathForLevel: finished exactly when every lesson of the path is done", () => {
  const all = ["onboarding-beginner", "normal-1", "normal-2", "normal-3"];
  assert.equal(freePathForLevel(units, 1, all.slice(0, 3)).finished, false);
  assert.equal(freePathForLevel(units, 1, all).finished, true);
  assert.deepEqual(freePathForLevel(units, 1, all).remainingIds, []);
});

test("freePathForLevel: follows the lessons' own order, not the order of the list it is given", () => {
  const shuffled = [...units].reverse();
  assert.deepEqual(freePathForLevel(shuffled, 3, []).ids, ["normal-8", "normal-11", "normal-10"]);
});

test("freePathForLevel: a level with nothing free has nothing to finish", () => {
  const path = freePathForLevel(units, 4, []);
  assert.deepEqual(path, {
    level: 4,
    ids: [],
    total: 0,
    done: 0,
    remainingIds: [],
    finished: false,
  });
  assert.deepEqual(freePathForLevel([], 1, []).ids, []);
});

test("freePathFocus: starts at the learner's own level and moves on once its free lessons are done", () => {
  assert.equal(freePathFocus(units, [], null)?.level, 1);
  assert.equal(freePathFocus(units, [], 2)?.level, 2);
  assert.equal(freePathFocus(units, ["normal-5"], 2)?.level, 2);
  const beginnerDone = ["onboarding-beginner", "normal-1", "normal-2", "normal-3"];
  assert.equal(freePathFocus(units, beginnerDone, null)?.level, 2);
});

test("freePathFocus: wraps round to the lower levels, and a placement of 0 means no preference", () => {
  const upperDone = ["normal-5", "normal-6", "normal-7", "normal-8", "normal-11", "normal-10"];
  assert.equal(freePathFocus(units, upperDone, 2)?.level, 1);
  assert.equal(freePathFocus(units, [], 0)?.level, 1);
});

test("freePathFocus: when every free lesson is done it is the learner's own level, finished", () => {
  const everything = units.filter((unit) => unit.isFree).map((unit) => unit.id);
  const focus = freePathFocus(units, everything, 2);
  assert.equal(focus?.level, 2);
  assert.equal(focus?.finished, true);
});

test("freePathFocus: null when nothing is free", () => {
  assert.equal(freePathFocus([{ id: "p", level: 1, order: 1, isFree: false }], [], null), null);
  assert.equal(freePathFocus([], [], null), null);
});

test("lockedLessonOutcome: a finished path gets the screen that says so, however the learner arrived", () => {
  const done = freePathForLevel(units, 1, [
    "onboarding-beginner",
    "normal-1",
    "normal-2",
    "normal-3",
  ]);
  assert.deepEqual(lockedLessonOutcome(done, { signedIn: true, fromInApp: true }), {
    kind: "milestone",
  });
  assert.deepEqual(lockedLessonOutcome(done, { signedIn: true, fromInApp: false }), {
    kind: "milestone",
  });
});

test("lockedLessonOutcome: free lessons left and an arrival from outside the app go to the next free lesson", () => {
  const path = freePathForLevel(units, 1, ["onboarding-beginner", "normal-1"]);
  assert.deepEqual(lockedLessonOutcome(path, { signedIn: true, fromInApp: false }), {
    kind: "redirect",
    lessonId: "normal-2",
  });
});

test("lockedLessonOutcome: a tap inside the app, a guest or a level with no path just see a preview", () => {
  const path = freePathForLevel(units, 1, ["onboarding-beginner"]);
  assert.deepEqual(lockedLessonOutcome(path, { signedIn: true, fromInApp: true }), {
    kind: "preview",
  });
  assert.deepEqual(lockedLessonOutcome(path, { signedIn: false, fromInApp: false }), {
    kind: "preview",
  });
  assert.deepEqual(lockedLessonOutcome(null, { signedIn: true, fromInApp: false }), {
    kind: "preview",
  });
  assert.deepEqual(
    lockedLessonOutcome(freePathForLevel(units, 4, []), { signedIn: true, fromInApp: false }),
    { kind: "preview" },
  );
});

test("pathChips: the opening lesson is named, the others numbered from 1, and the lock gets the next number", () => {
  assert.deepEqual(pathChips(["onboarding-beginner", "normal-1", "normal-2", "normal-3"]), {
    labels: ["First Steps", "1", "2", "3"],
    nextNumber: 4,
  });
  assert.deepEqual(pathChips(["normal-5", "normal-6", "normal-7"]), {
    labels: ["1", "2", "3"],
    nextNumber: 4,
  });
  assert.deepEqual(pathChips(["onboarding-intermediate", "normal-5"]), {
    labels: ["First Steps", "1"],
    nextNumber: 2,
  });
  assert.deepEqual(pathChips([]), { labels: [], nextNumber: 1 });
});
