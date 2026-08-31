import { test } from "node:test";
import assert from "node:assert/strict";

import {
  computeStoryCurriculumContext,
  type NormalContextLesson,
  type StoryContextLesson,
} from "./stories-curriculum-context";

function story(
  id: string,
  overrides: Partial<StoryContextLesson> & { en: string[] },
): StoryContextLesson {
  return {
    id,
    title: overrides.title ?? id,
    level: overrides.level ?? 1,
    orderIndex: overrides.orderIndex ?? 1,
    unitId: overrides.unitId ?? null,
    unitTitle: overrides.unitTitle ?? null,
    unitObjective: overrides.unitObjective ?? null,
    sentences: overrides.en.map((en) => ({ en })),
  };
}

function normal(level: number, en: string[]): NormalContextLesson {
  return { level, sentences: en.map((text) => ({ en: text })) };
}

test("computeStoryCurriculumContext: an unknown id returns null rather than throwing", () => {
  const curriculum = [story("s1", { en: ["A cat sat on the mat"] })];
  assert.equal(computeStoryCurriculumContext("does-not-exist", curriculum, []), null);
});

test("computeStoryCurriculumContext: preceding stories are only same-level ones that come earlier in order", () => {
  const curriculum = [
    story("s1", { level: 1, orderIndex: 1, en: ["A cat sat on the mat"] }),
    story("s2", { level: 2, orderIndex: 2, en: ["A dog ran in the park"] }), // different level — must not count
    story("s3", { level: 1, orderIndex: 3, en: ["The bird flew away"] }),
  ];
  const context = computeStoryCurriculumContext("s3", curriculum, []);
  assert.ok(context);
  assert.deepEqual(
    context!.precedingStoriesAtLevel.map((s) => s.id),
    ["s1"],
  );
});

test("computeStoryCurriculumContext: never compares against a later story", () => {
  const curriculum = [
    story("s1", { level: 1, orderIndex: 1, en: ["I ordered coffee"] }),
    story("s2", { level: 1, orderIndex: 2, en: ["coffee is my favorite drink"] }),
  ];
  const context = computeStoryCurriculumContext("s1", curriculum, []);
  assert.ok(context);
  assert.equal(context!.overlapWithEarlierStoriesAtLevel, 0);
  assert.deepEqual(context!.precedingStoriesAtLevel, []);
});

test("computeStoryCurriculumContext: overlap with earlier stories is scoped to the same level only", () => {
  const curriculum = [
    story("s1", { level: 3, orderIndex: 1, en: ["I signed the contract yesterday"] }),
    story("s2", { level: 1, orderIndex: 2, en: ["I signed the contract yesterday"] }),
  ];
  // s2 is Level 1; s1 (same word "contract"/"signed") is Level 3 and comes
  // earlier in order, but must NOT count toward a Level-1 story's overlap.
  const context = computeStoryCurriculumContext("s2", curriculum, []);
  assert.ok(context);
  assert.equal(context!.overlapWithEarlierStoriesAtLevel, 0);
});

test("computeStoryCurriculumContext: Normal-vocabulary overlap includes lower levels but excludes higher ones", () => {
  const curriculum = [story("s1", { level: 2, orderIndex: 1, en: ["I found a jacket online"] })];
  const normalLessons = [
    normal(1, ["I found ten dollars"]), // shares "found" — level below, should count
    normal(3, ["I found a jacket online too"]), // shares "jacket"/"online" — level above, must NOT count
  ];
  const context = computeStoryCurriculumContext("s1", curriculum, normalLessons);
  assert.ok(context);
  assert.equal(context!.overlapWithNormalVocabulary, 1); // only "found"
  assert.deepEqual(context!.sampleSharedWithNormal, ["found"]);
});

test("computeStoryCurriculumContext: sample word list is capped and alphabetized", () => {
  const curriculum = [
    story("s1", {
      level: 1,
      orderIndex: 1,
      en: ["apple banana cherry date elderberry fig grape honeydew imagine jackfruit"],
    }),
  ];
  const normalLessons = [
    normal(1, ["apple banana cherry date elderberry fig grape honeydew imagine jackfruit"]),
  ];
  const context = computeStoryCurriculumContext("s1", curriculum, normalLessons);
  assert.ok(context);
  assert.equal(context!.overlapWithNormalVocabulary, 10);
  assert.equal(context!.sampleSharedWithNormal.length, 8, "sample list should be capped");
  const sorted = [...context!.sampleSharedWithNormal].sort();
  assert.deepEqual(context!.sampleSharedWithNormal, sorted, "sample list should be alphabetized");
});

test("computeStoryCurriculumContext: no unit metadata resolves to a null unit, not a crash", () => {
  const curriculum = [story("s1", { en: ["A cat sat on the mat"] })];
  const context = computeStoryCurriculumContext("s1", curriculum, []);
  assert.ok(context);
  assert.equal(context!.unit, null);
});

// --- Difficulty context ------------------------------------------------

test("difficulty.currentStory: sentence count and average words/sentence are computed from real words, not content-word filtering", () => {
  const curriculum = [story("s1", { en: ["I am the very best at this", "It is a test of that"] })];
  const context = computeStoryCurriculumContext("s1", curriculum, []);
  assert.ok(context);
  assert.equal(context!.difficulty.currentStory.sentenceCount, 2);
  // 7 words + 6 words = 13 words / 2 sentences = 6.5 — this only works if
  // function words ("I", "am", "the", "is", "a", "of", "that"...) are
  // counted; extractContentWords would strip almost all of them.
  assert.equal(context!.difficulty.currentStory.averageWordsPerSentence, 6.5);
});

test("difficulty.sameLevel: level average is the mean of each Story's own average, not weighted by sentence count", () => {
  const shortStory = story("short", { level: 1, orderIndex: 1, en: ["one two three four"] }); // 4 words/sentence
  // A much longer Story (10 sentences) at 2 words/sentence — if the level
  // average were (total words)/(total sentences) instead of a mean of
  // per-Story averages, this long Story would pull the average toward 2.
  const longStory = story("long", {
    level: 1,
    orderIndex: 2,
    en: Array(10).fill("one two"),
  });
  const curriculum = [shortStory, longStory];
  const context = computeStoryCurriculumContext("short", curriculum, []);
  assert.ok(context);
  // Correct (unweighted) mean: (4 + 2) / 2 = 3, not the word-weighted ~2.18.
  assert.equal(context!.difficulty.sameLevel.averageWordsPerSentence, 3);
});

test("difficulty.currentStory comparisons: around-typical when at the Level average", () => {
  const curriculum = [
    story("a", { level: 1, orderIndex: 1, en: Array(10).fill("word word") }),
    story("b", { level: 1, orderIndex: 2, en: Array(10).fill("word word") }),
    story("c", { level: 1, orderIndex: 3, en: Array(10).fill("word word") }),
  ];
  const context = computeStoryCurriculumContext("a", curriculum, []);
  assert.ok(context);
  assert.equal(context!.difficulty.currentStory.sentenceCountComparison, "around-typical");
});

test("difficulty.currentStory comparisons: below-typical when more than ~15% under the Level average", () => {
  // Level average sentence count is (12+12+6)/3 = 10; 6 is well under 8.5 (10 * 0.85).
  const curriculum = [
    story("a", { level: 1, orderIndex: 1, en: Array(12).fill("word word") }),
    story("b", { level: 1, orderIndex: 2, en: Array(12).fill("word word") }),
    story("c", { level: 1, orderIndex: 3, en: Array(6).fill("word word") }),
  ];
  const context = computeStoryCurriculumContext("c", curriculum, []);
  assert.ok(context);
  assert.equal(context!.difficulty.currentStory.sentenceCountComparison, "below-typical");
});

test("difficulty.currentStory comparisons: above-typical when more than ~15% over the Level average", () => {
  // Same set — 12 is well over 11.5 (10 * 1.15).
  const curriculum = [
    story("a", { level: 1, orderIndex: 1, en: Array(12).fill("word word") }),
    story("b", { level: 1, orderIndex: 2, en: Array(12).fill("word word") }),
    story("c", { level: 1, orderIndex: 3, en: Array(6).fill("word word") }),
  ];
  const context = computeStoryCurriculumContext("a", curriculum, []);
  assert.ok(context);
  assert.equal(context!.difficulty.currentStory.sentenceCountComparison, "above-typical");
});

test("difficulty neighbors: previous/next are same-level only — a higher- or lower-level Story never leaks in", () => {
  const curriculum = [
    story("l1-last", { level: 1, orderIndex: 1, en: ["a"] }),
    story("l2-first", { level: 2, orderIndex: 2, en: ["b"] }),
    story("l2-second", { level: 2, orderIndex: 3, en: ["c"] }),
    story("l3-first", { level: 3, orderIndex: 4, en: ["d"] }),
  ];
  const context = computeStoryCurriculumContext("l2-first", curriculum, []);
  assert.ok(context);
  // l2-first's immediate predecessor in the raw sequence is l1-last (a
  // different Level) and its successor is l2-second (same Level, correct).
  assert.equal(
    context!.difficulty.previousAtLevel,
    null,
    "must not leak the Level 1 story as a neighbor",
  );
  assert.equal(context!.difficulty.nextAtLevel?.title, "l2-second");
});

test("difficulty neighbors: first Story at a Level has no previous neighbor", () => {
  const curriculum = [
    story("first", { level: 1, orderIndex: 1, en: ["a"] }),
    story("second", { level: 1, orderIndex: 2, en: ["b"] }),
  ];
  const context = computeStoryCurriculumContext("first", curriculum, []);
  assert.ok(context);
  assert.equal(context!.difficulty.previousAtLevel, null);
  assert.equal(context!.difficulty.nextAtLevel?.title, "second");
});

test("difficulty neighbors: most recent Story at a Level has no next neighbor", () => {
  const curriculum = [
    story("first", { level: 1, orderIndex: 1, en: ["a"] }),
    story("last", { level: 1, orderIndex: 2, en: ["b"] }),
  ];
  const context = computeStoryCurriculumContext("last", curriculum, []);
  assert.ok(context);
  assert.equal(context!.difficulty.nextAtLevel, null);
  assert.equal(context!.difficulty.previousAtLevel?.title, "first");
});

test("difficulty context does not change the existing vocabulary-context fields", () => {
  const curriculum = [
    story("s1", { level: 1, orderIndex: 1, en: ["I found a jacket online"] }),
    story("s2", { level: 1, orderIndex: 2, en: ["I bought the jacket"] }),
  ];
  const context = computeStoryCurriculumContext("s2", curriculum, []);
  assert.ok(context);
  assert.equal(context!.overlapWithEarlierStoriesAtLevel, 1); // "jacket" — unchanged behavior
  assert.deepEqual(
    context!.precedingStoriesAtLevel.map((s) => s.id),
    ["s1"],
  );
  assert.ok(
    context!.difficulty,
    "difficulty context should be present alongside the existing fields",
  );
});

test("computeStoryCurriculumContext: exposes level and unit, no role-based fields at all", () => {
  const curriculum = [
    story("s1", {
      level: 2,
      unitId: "unit-stories-2",
      unitTitle: "New Chapters",
      unitObjective: "Everyday moments told with a bit more detail.",
      en: ["A cat sat on the mat"],
    }),
  ];
  const context = computeStoryCurriculumContext("s1", curriculum, []);
  assert.ok(context);
  assert.equal(context!.level, 2);
  assert.deepEqual(context!.unit, {
    id: "unit-stories-2",
    title: "New Chapters",
    objective: "Everyday moments told with a bit more detail.",
  });
  assert.ok(!("role" in context!), "Stories context must never carry a role/role-banding field");
});
