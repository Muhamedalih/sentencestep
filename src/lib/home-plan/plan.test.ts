import { test } from "node:test";
import assert from "node:assert/strict";

import type { WordGroupSummary } from "@/types/word-lists";

import {
  cefrForLevel,
  levelCount,
  levelProgress,
  pickNextWordBlock,
  stepStates,
  summarizeLevel,
  wordCountsByLevel,
} from "./plan";

function group(
  id: string,
  level: number,
  order: number,
  size = 12,
  isFree = true,
): WordGroupSummary {
  const wordIds = Array.from({ length: size }, (_unused, index) => `${id}-${index + 1}`);
  return { id, level, order, title: id, titleAr: id, isFree, wordCount: size, wordIds };
}

test("stepStates: the first unfinished step is current, later ones wait", () => {
  assert.deepEqual(stepStates({ words: false, story: false, write: false }), {
    words: "current",
    story: "todo",
    write: "todo",
  });
  assert.deepEqual(stepStates({ words: true, story: false, write: true }), {
    words: "done",
    story: "current",
    write: "done",
  });
  assert.deepEqual(stepStates({ words: true, story: true, write: true }), {
    words: "done",
    story: "done",
    write: "done",
  });
});

test("summarizeLevel: averages the tracks and names the one furthest behind", () => {
  const summary = summarizeLevel({
    words: { done: 10, total: 60 },
    stories: { done: 3, total: 21 },
    lessons: { done: 3, total: 12 },
  });
  assert.equal(summary.percent, 19);
  assert.equal(summary.weakest, "stories");
});

test("summarizeLevel: ignores empty tracks and handles nothing to measure", () => {
  assert.deepEqual(
    summarizeLevel({
      words: { done: 0, total: 0 },
      stories: { done: 0, total: 0 },
      lessons: { done: 0, total: 0 },
    }),
    { percent: 0, weakest: null },
  );
  assert.equal(
    summarizeLevel({
      words: { done: 0, total: 0 },
      stories: { done: 5, total: 10 },
      lessons: { done: 10, total: 10 },
    }).percent,
    75,
  );
});

test("cefrForLevel clamps to the known levels", () => {
  assert.equal(cefrForLevel(0), "A1");
  assert.equal(cefrForLevel(2), "A2-B1");
  assert.equal(cefrForLevel(9), "B2");
});

test("levelCount counts only the level's lessons this learner can open", () => {
  const units = [
    { id: "a", level: 1, isFree: true },
    { id: "b", level: 1, isFree: false },
    { id: "c", level: 2, isFree: true },
  ];
  assert.deepEqual(levelCount(units, ["a", "b", "c"], 1, false), { done: 1, total: 1 });
  assert.deepEqual(levelCount(units, ["a", "b", "c"], 1, true), { done: 2, total: 2 });
});

test("pickNextWordBlock: resumes inside a started group at the block of the first open word", () => {
  const groups = [group("family", 1, 1), group("colors", 1, 2)];
  const done = new Set(["family-1", "family-2", "family-3", "family-4", "family-5", "family-6"]);
  const next = pickNextWordBlock(groups, done, { isPremiumUser: true, startingLevel: null });
  assert.equal(next?.group.id, "family");
  assert.equal(next?.blockIndex, 1);
  assert.deepEqual([next?.from, next?.to, next?.started], [6, 10, true]);
});

test("pickNextWordBlock: a finished group is skipped and the last block is clipped to the group", () => {
  const groups = [group("family", 1, 1, 7), group("colors", 1, 2, 7)];
  const done = new Set(groups[0]!.wordIds);
  const next = pickNextWordBlock(groups, done, { isPremiumUser: true, startingLevel: null });
  assert.deepEqual([next?.group.id, next?.from, next?.to, next?.started], ["colors", 1, 5, false]);
  const second = pickNextWordBlock(
    groups,
    new Set([...done, "colors-1", "colors-2", "colors-3", "colors-4", "colors-5"]),
    {
      isPremiumUser: true,
      startingLevel: null,
    },
  );
  assert.deepEqual([second?.from, second?.to], [6, 7]);
});

test("pickNextWordBlock: with the permission the onboarding level is a floor, groups below it come last; locked groups are skipped", () => {
  const groups = [group("a", 1, 1), group("b", 2, 1, 12, false), group("c", 2, 2)];
  const floor = { isPremiumUser: true, startingLevel: 2, floor: true };
  assert.equal(pickNextWordBlock(groups, new Set(), floor)?.group.id, "b");
  assert.equal(
    pickNextWordBlock(groups, new Set(), { ...floor, isPremiumUser: false })?.group.id,
    "c",
  );
  assert.equal(pickNextWordBlock(groups, new Set(["a-1"]), floor)?.group.id, "b");
  const finishedAboveTheFloor = new Set([...groups[1]!.wordIds, ...groups[2]!.wordIds]);
  assert.equal(pickNextWordBlock(groups, finishedAboveTheFloor, floor)?.group.id, "a");
});

test("pickNextWordBlock: without the permission the onboarding level only counts before any word is done, as before", () => {
  const groups = [group("a", 1, 1), group("b", 2, 1, 12, false), group("c", 2, 2)];
  const plain = { isPremiumUser: true, startingLevel: 2 };
  assert.equal(pickNextWordBlock(groups, new Set(), plain)?.group.id, "b");
  assert.equal(pickNextWordBlock(groups, new Set(["a-1"]), plain)?.group.id, "a");
  assert.equal(
    pickNextWordBlock(groups, new Set(["a-1"]), { ...plain, floor: false })?.group.id,
    "a",
  );
});

test("pickNextWordBlock: locked groups are skipped and a finished catalog has no next block", () => {
  const groups = [group("a", 1, 1), group("b", 2, 1, 12, false), group("c", 2, 2)];
  assert.equal(
    pickNextWordBlock(groups, new Set(), { isPremiumUser: false, startingLevel: 2 })?.group.id,
    "c",
  );
  assert.equal(
    pickNextWordBlock([group("z", 1, 1, 2)], new Set(["z-1", "z-2"]), {
      isPremiumUser: true,
      startingLevel: null,
    }),
    null,
  );
});

test("wordCountsByLevel sums the words per level", () => {
  const groups = [group("a", 1, 1, 10), group("b", 1, 2, 10), group("c", 2, 1, 10, false)];
  const counts = wordCountsByLevel(groups, new Set(["a-1", "b-1", "c-1"]), false);
  assert.deepEqual(counts, { 1: { done: 2, total: 20 } });
});

test("levelProgress: the level follows the lessons and every track is measured inside it", () => {
  const units = [
    { id: "l1", level: 1, isFree: true },
    { id: "l2", level: 1, isFree: true },
    { id: "l3", level: 2, isFree: true },
  ];
  const stories = [
    { id: "s1", level: 1, isFree: true },
    { id: "s2", level: 2, isFree: true },
  ];
  const groups = [group("a", 1, 1, 10), group("b", 2, 1, 10)];
  const base = {
    units,
    storiesUnits: stories,
    groups,
    completedWordIds: new Set(["a-1", "a-2", "b-1"]),
    startingLevel: null,
    isPremiumUser: true,
  };
  const first = levelProgress({ ...base, lessonIds: ["l1"], storyIds: ["s1"] });
  assert.equal(first.level, 1);
  assert.deepEqual(first.counts, {
    words: { done: 2, total: 10 },
    stories: { done: 1, total: 1 },
    lessons: { done: 1, total: 2 },
  });
  const second = levelProgress({ ...base, lessonIds: ["l1", "l2"], storyIds: [] });
  assert.equal(second.level, 2);
  assert.deepEqual(second.counts.words, { done: 1, total: 10 });
});
