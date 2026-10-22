import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isImportantWord } from "./important-words";
import { DEFAULT_WPM, estimateStoryMinutes, medianWpm, planToday } from "./plan";
import { weekDates, weekStartFor } from "./week";

const open = { available: true, done: false };

describe("planToday", () => {
  it("lists the three steps in order, the first as current", () => {
    const plan = planToday(
      {
        listen: { ...open, minutes: 5 },
        story: { ...open, minutes: 4 },
        words: { ...open, minutes: 2 },
      },
      false,
    );
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["listen", "story", "words"],
    );
    assert.equal(plan.current, "listen");
    assert.equal(plan.remainingMinutes, 11);
    assert.equal(plan.totalMinutes, 11);
    assert.equal(plan.allDone, false);
  });

  it("moves on to the next step as steps are finished and counts only what is left", () => {
    const plan = planToday(
      {
        listen: { available: false, done: true, minutes: 5 },
        story: { ...open, minutes: 4 },
        words: { ...open, minutes: 2 },
      },
      false,
    );
    assert.equal(plan.current, "story");
    assert.equal(plan.remainingMinutes, 6);
    assert.equal(plan.totalMinutes, 11);
  });

  it("leaves out a step with nothing open to this learner", () => {
    const plan = planToday(
      {
        listen: { available: false, done: false, minutes: 0 },
        story: { ...open, minutes: 4 },
        words: { ...open, minutes: 2 },
      },
      false,
    );
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["story", "words"],
    );
    assert.equal(plan.current, "story");
  });

  it("is all done once the finish screen was reached, whatever the steps say", () => {
    const plan = planToday(
      {
        listen: { ...open, minutes: 5 },
        story: { ...open, minutes: 4 },
        words: { ...open, minutes: 2 },
      },
      true,
    );
    assert.equal(plan.allDone, true);
    assert.equal(plan.current, null);
    assert.equal(plan.remainingMinutes, 0);
  });

  it("has nothing to do when no step exists", () => {
    const none = { available: false, done: false, minutes: 0 };
    const plan = planToday({ listen: none, story: none, words: none }, false);
    assert.equal(plan.steps.length, 0);
    assert.equal(plan.current, null);
    assert.equal(plan.allDone, false);
  });
});

describe("time estimates", () => {
  it("uses the median of recent typing speeds and falls back to a default", () => {
    assert.equal(medianWpm([20, 30, 10]), 20);
    assert.equal(medianWpm([20, 30]), 25);
    assert.equal(medianWpm([null, 0, 400]), DEFAULT_WPM);
    assert.equal(medianWpm([]), DEFAULT_WPM);
  });

  it("a story takes longer for a slower typist", () => {
    const base = { words: 64, sentences: 8 };
    const slow = estimateStoryMinutes({ ...base, wpm: 10 });
    const fast = estimateStoryMinutes({ ...base, wpm: 40 });
    assert.ok(slow > fast);
    assert.ok(fast >= 2);
  });
});

describe("isImportantWord", () => {
  it("keeps content words", () => {
    for (const word of ["coffee", "ordered", "sandwich", "waiter", "apologized", "instead"]) {
      assert.equal(isImportantWord(word), true, word);
    }
  });

  it("drops function words, contractions and tiny words", () => {
    for (const word of ["and", "the", "into", "isn't", "He", "to", "very", "with", "a"]) {
      assert.equal(isImportantWord(word), false, word);
    }
  });
});

describe("week dots", () => {
  it("builds the calendar week from Saturday for Arabic (21 Oct 2026 is a Wednesday)", () => {
    const dates = weekDates("2026-10-21", weekStartFor("ar"));
    assert.equal(dates[0], "2026-10-17");
    assert.equal(dates[6], "2026-10-23");
  });

  it("starts on Monday elsewhere", () => {
    const dates = weekDates("2026-10-21", weekStartFor("en"));
    assert.equal(dates[0], "2026-10-19");
    assert.equal(dates[6], "2026-10-25");
  });
});
