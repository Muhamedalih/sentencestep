import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { LessonUnit } from "@/types/content";

import { pickNewItems } from "./next";

function unit(id: string, mode: "normal" | "stories", level: number, order: number, isFree = true) {
  return {
    id,
    mode,
    level,
    order,
    title: id,
    titleAr: id,
    isFree,
    sentences: [],
  } as LessonUnit;
}

const units = [
  unit("n1", "normal", 1, 1),
  unit("n2", "normal", 1, 2),
  unit("n3", "normal", 2, 3, false),
];
const storiesUnits = [unit("s1", "stories", 1, 1), unit("s2", "stories", 1, 2)];

const base = { units, storiesUnits, startingLevel: null, isPremium: false, floor: false };

describe("pickNewItems", () => {
  it("opens a Normal lesson first, then alternates with a story", () => {
    const pick = pickNewItems({ ...base, completions: [] });
    assert.equal(pick.next?.id, "n1");
    assert.deepEqual(
      pick.upcoming.map((item) => item.id),
      ["s1", "n2"],
    );
  });

  it("serves a story after a lesson and a lesson after a story", () => {
    const afterLesson = pickNewItems({
      ...base,
      completions: [{ lessonId: "n1", mode: "normal", completedAt: "2026-10-20T10:00:00Z" }],
    });
    assert.equal(afterLesson.next?.id, "s1");
    const afterStory = pickNewItems({
      ...base,
      completions: [
        { lessonId: "n1", mode: "normal", completedAt: "2026-10-19T10:00:00Z" },
        { lessonId: "s1", mode: "stories", completedAt: "2026-10-20T10:00:00Z" },
      ],
    });
    assert.equal(afterStory.next?.id, "n2");
  });

  it("falls back to the other kind when one list is finished", () => {
    const pick = pickNewItems({
      ...base,
      completions: [
        { lessonId: "s1", mode: "stories", completedAt: "2026-10-18T10:00:00Z" },
        { lessonId: "s2", mode: "stories", completedAt: "2026-10-19T10:00:00Z" },
        { lessonId: "n1", mode: "normal", completedAt: "2026-10-20T10:00:00Z" },
      ],
    });
    assert.equal(pick.next?.id, "n2");
  });

  it("holds a free learner at the first Premium lesson and names it as locked", () => {
    const pick = pickNewItems({
      ...base,
      completions: [
        { lessonId: "n1", mode: "normal", completedAt: "2026-10-18T10:00:00Z" },
        { lessonId: "n2", mode: "normal", completedAt: "2026-10-19T10:00:00Z" },
        { lessonId: "s1", mode: "stories", completedAt: "2026-10-19T11:00:00Z" },
        { lessonId: "s2", mode: "stories", completedAt: "2026-10-20T10:00:00Z" },
      ],
    });
    assert.equal(pick.next, null);
    assert.equal(pick.locked?.id, "n3");
  });

  it("a subscriber is never held", () => {
    const pick = pickNewItems({ ...base, isPremium: true, completions: [] });
    assert.equal(pick.locked, null);
  });
});
