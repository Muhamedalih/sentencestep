import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import type { LessonUnit } from "@/types/content";

import { todayPicks } from "./picks";

function passage(id: string, level: PassageSummary["level"], isFree: boolean): PassageSummary {
  return {
    id,
    order: 1,
    level,
    isFree,
    sectionCount: 2,
    title: id,
    titleAr: id,
    summary: "",
    summaryAr: "",
    sentenceCount: 4,
    estimatedMinutes: 5,
    tone: "funny",
    icon: "",
    wordGroupId: null,
    posterUrl: null,
  } as PassageSummary;
}

function story(id: string, level: number, isFree: boolean): LessonUnit {
  return { id, mode: "stories", level, order: 1, title: id, titleAr: id, isFree } as LessonUnit;
}

const passages = [passage("free-a1", "A1", true), passage("paid-a1", "A1", false)];
const stories = [story("free-1", 1, true), story("paid-1", 1, false), story("paid-2", 2, false)];
const done = (id: string): PassageProgress => ({
  passageId: id,
  sectionsDone: 2,
  correctAnswers: 4,
  totalQuestions: 4,
  completedAt: "2026-10-27T10:00:00Z",
});

const base = {
  userId: "user-1",
  todayISO: "2026-10-28",
  isPremium: false,
  startingLevel: 1,
  storiesUnits: stories,
  completedStoryIds: [],
};

describe("todayPicks", () => {
  it("without the taste it is the normal pick: free content only", () => {
    const picks = todayPicks({
      ...base,
      taste: false,
      passages: { summaries: passages, progress: [] },
    });
    assert.equal(picks.passage?.id, "free-a1");
    assert.equal(picks.story?.id, "free-1");
    assert.equal(picks.passageIsTaste, false);
    assert.equal(picks.storyIsTaste, false);
  });

  it("with the taste, free content still comes first, and nothing is a taste while it is left", () => {
    const picks = todayPicks({
      ...base,
      taste: true,
      passages: { summaries: passages, progress: [] },
    });
    assert.equal(picks.passage?.id, "free-a1");
    assert.equal(picks.storyIsTaste, false);
    assert.equal(picks.story?.id, "free-1");
  });

  it("once a step's free content is finished, that step opens its Premium taste", () => {
    const picks = todayPicks({
      ...base,
      taste: true,
      passages: { summaries: passages, progress: [done("free-a1")] },
      completedStoryIds: ["free-1"],
    });
    assert.equal(picks.passage?.id, "paid-a1");
    assert.equal(picks.passageIsTaste, true);
    assert.equal(picks.story?.id, "paid-1");
    assert.equal(picks.storyIsTaste, true);
  });

  it("a step with free content left keeps it, while the other step is already on its taste", () => {
    const picks = todayPicks({
      ...base,
      taste: true,
      passages: { summaries: passages, progress: [done("free-a1")] },
    });
    assert.equal(picks.passage?.id, "paid-a1");
    assert.equal(picks.passageIsTaste, true);
    assert.equal(picks.story?.id, "free-1");
    assert.equal(picks.storyIsTaste, false);
  });

  it("a Premium learner never gets a taste: they have the whole library already", () => {
    const picks = todayPicks({
      ...base,
      isPremium: true,
      taste: true,
      passages: { summaries: passages, progress: [done("free-a1")] },
      completedStoryIds: ["free-1"],
    });
    assert.equal(picks.passage?.id, "paid-a1");
    assert.equal(picks.passageIsTaste, false);
    assert.equal(picks.storyIsTaste, false);
  });

  it("a page that only reads the story leaves the passage out", () => {
    const picks = todayPicks({
      ...base,
      taste: true,
      completedStoryIds: ["free-1"],
    });
    assert.equal(picks.passage, null);
    assert.equal(picks.story?.id, "paid-1");
  });
});
