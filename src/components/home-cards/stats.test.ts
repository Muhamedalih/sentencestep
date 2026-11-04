import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { countFinishedStories, levelPercent } from "./stats";

describe("countFinishedStories", () => {
  const stats = { "stories:a": { sentences: 3 }, "stories:b": { sentences: 4 }, "normal:n1": {} };

  it("counts each finished story once and ignores replays", () => {
    const done = [
      { mode: "stories", lessonId: "a" },
      { mode: "stories", lessonId: "a" },
      { mode: "stories", lessonId: "b" },
    ];
    assert.equal(countFinishedStories(done, stats), 2);
  });

  it("ignores other modes and stories that no longer exist", () => {
    const done = [
      { mode: "normal", lessonId: "n1" },
      { mode: "stories", lessonId: "gone" },
      { mode: "stories", lessonId: "a" },
    ];
    assert.equal(countFinishedStories(done, stats), 1);
  });

  it("is 0 with nothing finished", () => {
    assert.equal(countFinishedStories([], stats), 0);
  });
});

describe("levelPercent", () => {
  it("rounds down and never reaches 100 while a next level exists", () => {
    assert.equal(levelPercent(0.629, true), 62);
    assert.equal(levelPercent(0.999, true), 99);
    assert.equal(levelPercent(1, true), 99);
  });

  it("is 100 at the top level and 0 for a broken value", () => {
    assert.equal(levelPercent(1, false), 100);
    assert.equal(levelPercent(Number.NaN, true), 0);
    assert.equal(levelPercent(-0.2, true), 0);
  });
});
