import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dayNumber, pickTaste, todayTaste } from "./taste";
import type { TasteCandidate } from "./taste";

const items: TasteCandidate[] = [
  { id: "a", level: 1 },
  { id: "b", level: 1 },
  { id: "c", level: 1 },
  { id: "d", level: 1 },
  { id: "e", level: 1 },
];

function days(start: string, count: number): string[] {
  const first = dayNumber(start);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date((first + index) * 86_400_000);
    return date.toISOString().slice(0, 10);
  });
}

describe("dayNumber", () => {
  it("counts whole days, across a leap day too", () => {
    assert.equal(dayNumber("2026-10-29") - dayNumber("2026-10-28"), 1);
    assert.equal(dayNumber("2028-03-01") - dayNumber("2028-02-28"), 2);
    assert.equal(dayNumber("1970-01-02"), 1);
  });
});

describe("pickTaste", () => {
  const input = { userId: "user-1", kind: "passage" as const, todayISO: "2026-10-28", minLevel: 1 };

  it("gives nothing when there is nothing to offer", () => {
    assert.equal(pickTaste([], input), null);
  });

  it("gives the same item to the same learner on the same day", () => {
    assert.deepEqual(pickTaste(items, input), pickTaste(items, input));
    assert.deepEqual(pickTaste([...items].reverse(), input), pickTaste(items, input));
  });

  it("walks every candidate once before any comes back", () => {
    const week = days("2026-10-28", items.length).map(
      (todayISO) => pickTaste(items, { ...input, todayISO })?.id,
    );
    assert.deepEqual([...new Set(week)].sort(), items.map((item) => item.id).sort());
    const nextWeek = days("2026-11-02", items.length).map(
      (todayISO) => pickTaste(items, { ...input, todayISO })?.id,
    );
    assert.deepEqual(nextWeek, week);
  });

  it("gives different learners different orders", () => {
    const first = days("2026-10-28", items.length).map(
      (todayISO) => pickTaste(items, { ...input, todayISO })?.id,
    );
    const second = days("2026-10-28", items.length).map(
      (todayISO) => pickTaste(items, { ...input, userId: "user-2", todayISO })?.id,
    );
    assert.notDeepEqual(first, second);
  });

  it("keeps passages and stories on separate orders for the same learner", () => {
    const passages = days("2026-10-28", items.length).map(
      (todayISO) => pickTaste(items, { ...input, todayISO })?.id,
    );
    const stories = days("2026-10-28", items.length).map(
      (todayISO) => pickTaste(items, { ...input, kind: "story", todayISO })?.id,
    );
    assert.notDeepEqual(passages, stories);
  });

  it("uses the learner's own level: the lowest level at or above it that has anything", () => {
    const mixed: TasteCandidate[] = [
      { id: "low", level: 0 },
      { id: "mid-1", level: 1 },
      { id: "mid-2", level: 1 },
      { id: "high", level: 2 },
    ];
    for (const todayISO of days("2026-10-28", 10)) {
      const picked = pickTaste(mixed, { ...input, minLevel: 1, todayISO });
      assert.ok(
        picked?.id === "mid-1" || picked?.id === "mid-2",
        `level 1 expected, got ${picked?.id}`,
      );
    }
    assert.equal(pickTaste(mixed, { ...input, minLevel: 2 })?.id, "high");
  });

  it("falls back to any level rather than offering nothing when nothing is at the learner's level", () => {
    const low: TasteCandidate[] = [{ id: "only", level: 0 }];
    assert.equal(pickTaste(low, { ...input, minLevel: 3 })?.id, "only");
  });
});

describe("todayTaste", () => {
  const passages = [
    { id: "p1", level: 1 },
    { id: "p2", level: 1 },
  ];
  const stories = [
    { id: "s1", level: 1 },
    { id: "s2", level: 2 },
  ];

  it("gives a step its taste only once that step's free content is finished", () => {
    const freeLeft = todayTaste({
      userId: "user-1",
      todayISO: "2026-10-28",
      passages: { candidates: passages, minLevel: 1, freeLeft: true },
      stories: { candidates: stories, minLevel: 1, freeLeft: false },
    });
    assert.equal(freeLeft.passage, null);
    assert.ok(freeLeft.story);

    const finished = todayTaste({
      userId: "user-1",
      todayISO: "2026-10-28",
      passages: { candidates: passages, minLevel: 1, freeLeft: false },
      stories: { candidates: stories, minLevel: 1, freeLeft: false },
    });
    assert.ok(finished.passage);
    assert.ok(finished.story);
  });
});
