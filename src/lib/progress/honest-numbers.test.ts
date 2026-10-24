import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_PLAUSIBLE_WPM,
  honestLine,
  honestNumbers,
  lessonTotals,
  medianWpm,
} from "./honest-numbers";
import type { HonestInput } from "./honest-numbers";

const lessonStats = {
  "normal:a": { sentences: 8, words: 60 },
  "normal:b": { sentences: 10, words: 75 },
  "stories:c": { sentences: 12, words: 120 },
};

const empty: HonestInput = {
  completions: [],
  lessonStats,
  wpm: [],
  wordStrengths: [],
  activity: [],
};

test("lessonTotals: the sentences and words of the lessons completed, the way Home adds them up", () => {
  const totals = lessonTotals(
    [
      { mode: "normal", lessonId: "a" },
      { mode: "stories", lessonId: "c" },
    ],
    lessonStats,
  );
  assert.deepEqual(totals, { lessons: 2, sentences: 20, words: 180 });
});

test("lessonTotals: a lesson counts once however often it appears, and an unknown lesson counts for nothing", () => {
  const totals = lessonTotals(
    [
      { mode: "normal", lessonId: "a" },
      { mode: "normal", lessonId: "a" },
      { mode: "normal", lessonId: "gone" },
      { mode: "stories", lessonId: "a" },
    ],
    lessonStats,
  );
  assert.deepEqual(totals, { lessons: 1, sentences: 8, words: 60 });
});

test("medianWpm: the middle run, an even count takes the two in the middle, rounded", () => {
  assert.deepEqual(medianWpm([30, 10, 20]), { median: 20, samples: 3 });
  assert.deepEqual(medianWpm([10, 20, 30, 41]), { median: 25, samples: 4 });
  assert.deepEqual(medianWpm([10, 21, 22, 40]), { median: 22, samples: 4 }, "21.5 rounds up");
});

test("medianWpm: one fast run does not move it (a median, not a mean)", () => {
  assert.equal(medianWpm([18, 19, 20, 21, 140]).median, 20);
});

test("medianWpm: nothing impossible or missing counts as a run", () => {
  const sample = medianWpm([
    null,
    undefined,
    0,
    -5,
    Number.NaN,
    911,
    MAX_PLAUSIBLE_WPM + 1,
    20,
    22,
    24,
  ]);
  assert.deepEqual(sample, { median: 22, samples: 3 });
  assert.equal(medianWpm([MAX_PLAUSIBLE_WPM, 10, 20]).samples, 3, "the ceiling itself is allowed");
});

test("medianWpm: fewer than three valid runs give no speed, but still say how many there were", () => {
  assert.deepEqual(medianWpm([]), { median: null, samples: 0 });
  assert.deepEqual(medianWpm([25, 30]), { median: null, samples: 2 });
  assert.deepEqual(medianWpm([25, 30, 0, null]), { median: null, samples: 2 });
});

test("honestNumbers: every figure from its own source", () => {
  const numbers = honestNumbers({
    completions: [
      { mode: "normal", lessonId: "a" },
      { mode: "normal", lessonId: "b" },
    ],
    lessonStats,
    wpm: [15, 18, 21, 24],
    wordStrengths: [0, 1, 3, 4, 5, 5],
    activity: [
      { day: "2026-10-20", kind: "active" },
      { day: "2026-10-21", kind: "grace" },
      { day: "2026-10-22", kind: "frozen" },
      { day: "2026-10-23", kind: "active" },
      { day: "2026-10-23", kind: "active" },
    ],
  });
  assert.deepEqual(numbers, {
    lessons: 2,
    sentences: 18,
    words: 135,
    medianWpm: 20,
    wpmSamples: 4,
    masteredWords: 3,
    activeDays: 2,
  });
});

test("honestNumbers: a brand-new learner has zeros and no speed, never a made-up figure", () => {
  assert.deepEqual(honestNumbers(empty), {
    lessons: 0,
    sentences: 0,
    words: 0,
    medianWpm: null,
    wpmSamples: 0,
    masteredWords: 0,
    activeDays: 0,
  });
});

const numbers = (overrides: Partial<ReturnType<typeof honestNumbers>>) => ({
  ...honestNumbers(empty),
  ...overrides,
});

test("honestLine: nothing is said to a learner who has barely started", () => {
  assert.equal(honestLine(numbers({ sentences: 0 })), null);
  assert.equal(honestLine(numbers({ sentences: 4, activeDays: 3 })), null);
});

test("honestLine: the sentences alone while there is only one day of practice", () => {
  assert.deepEqual(honestLine(numbers({ sentences: 5, activeDays: 1 })), {
    kind: "sentences",
    sentences: 5,
  });
  assert.deepEqual(honestLine(numbers({ sentences: 30, activeDays: 0 })), {
    kind: "sentences",
    sentences: 30,
  });
});

test("honestLine: sentences over days once there are two days or more", () => {
  assert.deepEqual(honestLine(numbers({ sentences: 124, activeDays: 6 })), {
    kind: "sentences_days",
    sentences: 124,
    days: 6,
  });
});

test("honestLine: words in memory are added only once there are ten", () => {
  assert.equal(
    honestLine(numbers({ sentences: 50, activeDays: 4, masteredWords: 9 }))?.kind,
    "sentences_days",
  );
  assert.deepEqual(honestLine(numbers({ sentences: 50, activeDays: 4, masteredWords: 12 })), {
    kind: "sentences_days_mastered",
    sentences: 50,
    days: 4,
    mastered: 12,
  });
});
