import { test } from "node:test";
import assert from "node:assert/strict";

import { findCurrentLesson, getCurrentLevel } from "./level";
import type { LessonUnit } from "@/types/content";

function unit(id: string, level: number, order: number, isFree = false): LessonUnit {
  return { id, mode: "normal", level, order, title: id, titleAr: id, isFree, sentences: [] };
}

/** The shape of the live Daily Lessons catalog: three levels, a few free lessons each, and the three opening lessons published late in their level. */
const catalog: LessonUnit[] = [
  unit("normal-1", 1, 1, true),
  unit("normal-2", 1, 2, true),
  unit("normal-3", 1, 3),
  unit("onboarding-beginner", 1, 37, true),
  unit("normal-5", 2, 5, true),
  unit("normal-6", 2, 6, true),
  unit("normal-7", 2, 7),
  unit("onboarding-intermediate", 2, 38, true),
  unit("normal-11", 3, 9, true),
  unit("normal-12", 3, 10),
  unit("onboarding-advanced", 3, 39, true),
];

// The last argument is the "Chosen level shapes the path" permission: on, the level is a floor for
// good; off (the default), it only counts until the first lesson is finished, as it always did.

test("getCurrentLevel: with no placement it is the first level with an open lesson", () => {
  assert.equal(getCurrentLevel(catalog, []), 1);
  assert.equal(
    getCurrentLevel(catalog, ["normal-1", "normal-2", "normal-3", "onboarding-beginner"]),
    2,
  );
  for (const floor of [false, true]) {
    assert.equal(getCurrentLevel(catalog, [], null, floor), 1);
    assert.equal(getCurrentLevel(catalog, [], 0, floor), 1);
  }
});

test("getCurrentLevel: a brand-new learner starts at the chosen level, permission or not", () => {
  assert.equal(getCurrentLevel(catalog, [], 2), 2);
  assert.equal(getCurrentLevel(catalog, [], 2, true), 2);
});

test("getCurrentLevel: with the permission the placement is a floor that still holds after the first lesson", () => {
  assert.equal(getCurrentLevel(catalog, ["onboarding-intermediate"], 2, true), 2);
  assert.equal(
    getCurrentLevel(catalog, ["onboarding-intermediate", "normal-5", "normal-6"], 2, true),
    2,
  );
  assert.equal(getCurrentLevel(catalog, ["onboarding-advanced"], 3, true), 3);
});

test("getCurrentLevel: without the permission the placement is forgotten after the first lesson, as before", () => {
  assert.equal(getCurrentLevel(catalog, ["onboarding-intermediate"], 2), 1);
  assert.equal(getCurrentLevel(catalog, ["onboarding-intermediate"], 2, false), 1);
  assert.equal(getCurrentLevel(catalog, ["onboarding-advanced"], 3), 1);
});

test("getCurrentLevel: the level moves up from the floor once the floor's level is done", () => {
  const level2 = ["normal-5", "normal-6", "normal-7", "onboarding-intermediate"];
  assert.equal(getCurrentLevel(catalog, level2, 2, true), 3);
});

test("getCurrentLevel: with nothing open at or above the floor it falls back to what is left below", () => {
  const upper = [
    "normal-5",
    "normal-6",
    "normal-7",
    "onboarding-intermediate",
    "normal-11",
    "normal-12",
    "onboarding-advanced",
  ];
  assert.equal(getCurrentLevel(catalog, upper, 2, true), 1);
});

test("getCurrentLevel: everything done is the highest level; a floor beyond the catalog is ignored", () => {
  const all = catalog.map((entry) => entry.id);
  assert.equal(getCurrentLevel(catalog, all, 2, true), 3);
  assert.equal(getCurrentLevel(catalog, [], 7, true), 1);
  assert.equal(getCurrentLevel(catalog, [], 7), 1);
  assert.equal(getCurrentLevel([], [], 2, true), 1);
});

test("findCurrentLesson: a new learner starts with the opening lesson of the chosen tier, permission or not", () => {
  for (const floor of [false, true]) {
    assert.equal(findCurrentLesson(catalog, [], false, 2, floor)?.id, "onboarding-intermediate");
    assert.equal(findCurrentLesson(catalog, [], true, 3, floor)?.id, "onboarding-advanced");
    assert.equal(findCurrentLesson(catalog, [], false, 1, floor)?.id, "onboarding-beginner");
  }
  assert.equal(findCurrentLesson(catalog, [], false)?.id, "normal-1");
});

test("findCurrentLesson: with the permission, a learner who chose Intermediate stays on Level 2 after the opening lesson", () => {
  assert.equal(
    findCurrentLesson(catalog, ["onboarding-intermediate"], false, 2, true)?.id,
    "normal-5",
  );
  assert.equal(
    findCurrentLesson(catalog, ["onboarding-intermediate"], true, 2, true)?.id,
    "normal-5",
  );
  assert.equal(
    findCurrentLesson(catalog, ["onboarding-advanced"], false, 3, true)?.id,
    "normal-11",
  );
});

test("findCurrentLesson: without the permission, the second lesson goes back to Level 1, as before", () => {
  assert.equal(findCurrentLesson(catalog, ["onboarding-intermediate"], false, 2)?.id, "normal-1");
  assert.equal(
    findCurrentLesson(catalog, ["onboarding-intermediate"], false, 2, false)?.id,
    "normal-1",
  );
  assert.equal(findCurrentLesson(catalog, ["onboarding-advanced"], false, 3)?.id, "normal-1");
});

test("findCurrentLesson: a premium learner keeps going up from the floor", () => {
  const done = ["onboarding-intermediate", "normal-5", "normal-6", "normal-7"];
  assert.equal(findCurrentLesson(catalog, done, true, 2, true)?.id, "normal-11");
});

test("findCurrentLesson: with nothing open at or above the floor it falls back to the lessons below", () => {
  const done = [
    "onboarding-intermediate",
    "normal-5",
    "normal-6",
    "normal-11",
    "onboarding-advanced",
  ];
  assert.equal(findCurrentLesson(catalog, done, false, 2, true)?.id, "normal-1");
});

test("findCurrentLesson: undefined once every lesson the learner can open is done", () => {
  const freeIds = catalog.filter((entry) => entry.isFree).map((entry) => entry.id);
  assert.equal(findCurrentLesson(catalog, freeIds, false, 2, true), undefined);
  assert.equal(findCurrentLesson(catalog, freeIds, false, 2), undefined);
});

test("findCurrentLesson: with no placement it is plain level-then-order progression", () => {
  for (const floor of [false, true]) {
    assert.equal(findCurrentLesson(catalog, ["normal-1"], false, undefined, floor)?.id, "normal-2");
    assert.equal(findCurrentLesson(catalog, ["normal-1"], false, null, floor)?.id, "normal-2");
    assert.equal(findCurrentLesson(catalog, ["normal-1"], false, 0, floor)?.id, "normal-2");
    assert.equal(
      findCurrentLesson(catalog, ["normal-1", "normal-2"], false, 1, floor)?.id,
      "onboarding-beginner",
    );
  }
});

test("findCurrentLesson: a floor beyond the catalog is ignored", () => {
  assert.equal(findCurrentLesson(catalog, ["normal-1"], false, 9, true)?.id, "normal-2");
});

test("findCurrentLesson: Stories have no opening lesson, so the floor alone decides", () => {
  const stories = [
    { ...unit("story-81", 1, 81, true), mode: "stories" as const },
    { ...unit("story-99", 2, 101, true), mode: "stories" as const },
    { ...unit("story-100", 2, 102), mode: "stories" as const },
    { ...unit("story-119", 3, 121, true), mode: "stories" as const },
  ];
  assert.equal(findCurrentLesson(stories, [], false, 2)?.id, "story-99");
  assert.equal(findCurrentLesson(stories, ["story-99"], false, 2, true)?.id, "story-119");
  assert.equal(findCurrentLesson(stories, ["story-99"], true, 2, true)?.id, "story-100");
  assert.equal(findCurrentLesson(stories, ["story-99"], false, 2)?.id, "story-81");
});
