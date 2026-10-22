import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import type { LessonUnit } from "@/types/content";

import { passageStartIndex, pickPassage, pickStory } from "./next";

function passage(
  id: string,
  level: PassageSummary["level"],
  order: number,
  isFree = true,
): PassageSummary {
  return {
    id,
    order,
    level,
    tone: "funny",
    icon: "book",
    title: id,
    titleAr: id,
    summary: "",
    summaryAr: "",
    isFree,
    sectionCount: 3,
    sentenceCount: 12,
    estimatedMinutes: 5,
    wordGroupId: null,
    posterUrl: null,
  };
}

function progress(passageId: string, sectionsDone: number, done = false): PassageProgress {
  return {
    passageId,
    sectionsDone,
    correctAnswers: 0,
    totalQuestions: 0,
    completedAt: done ? "2026-10-20T10:00:00Z" : null,
  };
}

const passages = [
  passage("a1-one", "A1", 1),
  passage("a1-two", "A1", 2),
  passage("a2-one", "A2", 1, false),
  passage("b1-one", "B1", 1),
];

describe("pickPassage", () => {
  it("starts a beginner on the first A1 passage", () => {
    assert.equal(pickPassage(passages, new Map(), false, null)?.id, "a1-one");
    assert.equal(pickPassage(passages, new Map(), false, 1)?.id, "a1-one");
  });

  it("starts from the learner's level: Intermediate on A2, Advanced on B1", () => {
    assert.equal(passageStartIndex(2), 1);
    assert.equal(pickPassage(passages, new Map(), true, 2)?.id, "a2-one");
    assert.equal(pickPassage(passages, new Map(), true, 3)?.id, "b1-one");
  });

  it("lower levels only come after the ones at or above", () => {
    const done = new Map([["b1-one", progress("b1-one", 3, true)]]);
    assert.equal(pickPassage(passages, done, true, 3)?.id, "a1-one");
  });

  it("finishes a started passage before a new one", () => {
    const started = new Map([["a1-two", progress("a1-two", 1)]]);
    assert.equal(pickPassage(passages, started, false, null)?.id, "a1-two");
  });

  it("never points a free learner at a Premium passage", () => {
    const done = new Map([
      ["a1-one", progress("a1-one", 3, true)],
      ["a1-two", progress("a1-two", 3, true)],
    ]);
    assert.equal(pickPassage(passages, done, false, null)?.id, "b1-one");
    assert.equal(pickPassage(passages, done, true, null)?.id, "a2-one");
  });

  it("is null when every open passage is done", () => {
    const done = new Map(passages.map((entry) => [entry.id, progress(entry.id, 3, true)] as const));
    assert.equal(pickPassage(passages, done, true, null), null);
  });
});

function story(id: string, level: number, order: number, isFree = true): LessonUnit {
  return { id, mode: "stories", level, order, title: id, titleAr: id, isFree, sentences: [] };
}

describe("pickStory", () => {
  const stories = [story("s1", 1, 1), story("s2", 1, 2), story("s3", 2, 3, false)];

  it("serves the next open story, from the learner's level up", () => {
    assert.equal(pickStory(stories, [], false, null)?.id, "s1");
    assert.equal(pickStory(stories, ["s1"], false, null)?.id, "s2");
    assert.equal(pickStory(stories, ["s1"], true, 2)?.id, "s3");
  });

  it("is null when a free learner has finished every free story", () => {
    assert.equal(pickStory(stories, ["s1", "s2"], false, null), null);
  });
});
