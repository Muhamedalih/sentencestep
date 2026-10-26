import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { finishedStoryOrPassageToday, todayEndInfo } from "./end-state";

const free = (count: number) => Array.from({ length: count }, () => ({ isFree: true }));
const locked = (count: number) => Array.from({ length: count }, () => ({ isFree: false }));

const finishedAll = {
  isPremium: false,
  passagesEnabled: true,
  passages: [...free(8), ...locked(45)],
  stories: [...free(8), ...locked(124)],
  nextPassage: null,
  nextStory: null,
  hasLessonsToday: false,
};

describe("todayEndInfo", () => {
  it("a free learner who finished every free passage and story: counts the free ones only", () => {
    assert.deepEqual(todayEndInfo(finishedAll), { premium: false, passages: 8, stories: 8 });
  });

  it("a Premium learner who finished the whole library: counts everything", () => {
    assert.deepEqual(todayEndInfo({ ...finishedAll, isPremium: true }), {
      premium: true,
      passages: 53,
      stories: 132,
    });
  });

  it("nothing to say while a passage or a story is still open", () => {
    assert.equal(todayEndInfo({ ...finishedAll, nextPassage: { id: "a" } }), null);
    assert.equal(todayEndInfo({ ...finishedAll, nextStory: { id: "b" } }), null);
  });

  it("the day a learner finishes the last one is still an ordinary, finished day", () => {
    assert.equal(todayEndInfo({ ...finishedAll, hasLessonsToday: true }), null);
  });

  it("an empty list (a failed read is one) is never taken for 'everything is done'", () => {
    assert.equal(todayEndInfo({ ...finishedAll, stories: [] }), null);
    assert.equal(todayEndInfo({ ...finishedAll, passages: [] }), null);
    assert.equal(todayEndInfo({ ...finishedAll, stories: locked(5) }), null);
    assert.equal(todayEndInfo({ ...finishedAll, passages: locked(5) }), null);
  });

  it("says nothing while the passages section is switched off", () => {
    assert.equal(todayEndInfo({ ...finishedAll, passagesEnabled: false }), null);
  });
});

describe("finishedStoryOrPassageToday", () => {
  const dayOf = (iso: string) => iso.slice(0, 10);
  const today = "2026-10-26";

  it("a story or a passage finished today counts", () => {
    assert.equal(
      finishedStoryOrPassageToday({
        completions: [{ mode: "stories", completedAt: "2026-10-26T08:00:00Z" }],
        passageProgress: [],
        todayISO: today,
        dayOf,
      }),
      true,
    );
    assert.equal(
      finishedStoryOrPassageToday({
        completions: [],
        passageProgress: [{ completedAt: "2026-10-26T09:30:00Z" }],
        todayISO: today,
        dayOf,
      }),
      true,
    );
  });

  it("nothing from another day, an unfinished passage, or another kind of lesson counts", () => {
    assert.equal(
      finishedStoryOrPassageToday({
        completions: [
          { mode: "stories", completedAt: "2026-10-25T23:59:00Z" },
          { mode: "normal", completedAt: "2026-10-26T08:00:00Z" },
        ],
        passageProgress: [{ completedAt: null }, { completedAt: "2026-10-24T10:00:00Z" }],
        todayISO: today,
        dayOf,
      }),
      false,
    );
  });

  it("the learner's own calendar day decides, not the instant's UTC date", () => {
    const baghdad = (iso: string) =>
      new Date(Date.parse(iso) + 3 * 3600_000).toISOString().slice(0, 10);
    assert.equal(
      finishedStoryOrPassageToday({
        completions: [{ mode: "stories", completedAt: "2026-10-25T22:30:00Z" }],
        passageProgress: [],
        todayISO: today,
        dayOf: baghdad,
      }),
      true,
    );
  });
});
