import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildReuseAdvisory,
  computeRecyclingReport,
  extractContentWords,
  spiralThreadsBefore,
  type CurriculumLessonInput,
} from "./curriculum-recycling";
import type { LessonRole } from "@/types/database";

function lesson(
  id: string,
  overrides: Partial<CurriculumLessonInput> & { en: string[] },
): CurriculumLessonInput {
  return {
    id,
    title: overrides.title ?? id,
    level: overrides.level ?? 1,
    orderIndex: overrides.orderIndex ?? 1,
    unitId: overrides.unitId ?? null,
    unitTitle: overrides.unitTitle ?? null,
    unitObjective: overrides.unitObjective ?? null,
    unitOrderIndex: overrides.unitOrderIndex ?? null,
    role: overrides.role ?? null,
    sentences: overrides.en.map((en) => ({ en })),
  };
}

// --- extractContentWords ---------------------------------------------------

test("extractContentWords: excludes function words, keeps content words", () => {
  const words = extractContentWords([{ en: "The waiter brought me tea instead of coffee" }]);
  assert.ok(words.has("waiter"));
  assert.ok(words.has("brought"));
  assert.ok(words.has("tea"));
  assert.ok(words.has("instead"));
  assert.ok(words.has("coffee"));
  assert.ok(!words.has("the"), "article should be excluded");
  assert.ok(!words.has("me"), "pronoun should be excluded");
  assert.ok(!words.has("of"), "preposition should be excluded");
});

test("extractContentWords: normalization matches normalizeMistakeWord (case + punctuation), deduping repeats", () => {
  const words = extractContentWords([{ en: "Coffee. coffee, COFFEE!" }]);
  assert.equal(words.size, 1);
  assert.ok(words.has("coffee"));
});

test("extractContentWords: does not fold inflections (identity-based, not stemmed)", () => {
  const words = extractContentWords([{ en: "I walked and I walk" }]);
  assert.ok(words.has("walked"));
  assert.ok(words.has("walk"));
  assert.equal(words.size, 2);
});

// --- computeRecyclingReport --------------------------------------------------

test("computeRecyclingReport: first published lesson has no prior curriculum, all words new", () => {
  const curriculum = [
    lesson("l1", { orderIndex: 1, role: "establish", en: ["I ordered a black coffee"] }),
    lesson("l2", { orderIndex: 2, role: "build", en: ["I woke up late this morning"] }),
  ];
  const report = computeRecyclingReport("l1", curriculum);
  assert.ok(report);
  assert.equal(report!.isFirstPublishedLesson, true);
  assert.equal(report!.newCount, report!.totalCount);
  assert.equal(report!.reusedCount, 0);
  assert.equal(report!.previousLesson, null);
});

test("computeRecyclingReport: previous-lesson overlap is zero when no shared content words", () => {
  const curriculum = [
    lesson("l1", { orderIndex: 1, role: "establish", en: ["I ordered a black coffee"] }),
    lesson("l2", { orderIndex: 2, role: "build", en: ["I woke up late this morning"] }),
  ];
  const report = computeRecyclingReport("l2", curriculum);
  assert.ok(report);
  assert.equal(report!.previousLesson?.overlapCount, 0);
});

test("computeRecyclingReport: previous-lesson overlap counts shared content words", () => {
  const curriculum = [
    lesson("l1", { orderIndex: 1, role: "establish", en: ["I felt confused at work"] }),
    lesson("l2", { orderIndex: 2, role: "build", en: ["I was late for work again"] }),
  ];
  const report = computeRecyclingReport("l2", curriculum);
  assert.ok(report);
  assert.equal(report!.previousLesson?.overlapCount, 1); // "work"
});

test("computeRecyclingReport: unit-level overlap unions every earlier lesson in the same unit, not just the immediate previous one", () => {
  const curriculum = [
    lesson("l1", {
      orderIndex: 1,
      unitId: "u1",
      role: "establish",
      en: ["I found a jacket online"],
    }),
    lesson("l2", {
      orderIndex: 2,
      unitId: "u1",
      role: "build",
      en: ["I woke up late this morning"],
    }),
    lesson("l3", {
      orderIndex: 3,
      unitId: "u1",
      unitTitle: "Unit",
      unitObjective: "Objective",
      unitOrderIndex: 1,
      role: "integrate",
      en: ["I bought a jacket and got to work on time"],
    }),
  ];
  const report = computeRecyclingReport("l3", curriculum);
  assert.ok(report);
  assert.equal(report!.isFirstInUnit, false);
  // "jacket" only appears in l1 (not the immediate-previous l2) — proves the
  // union spans the whole unit, not just the immediately preceding lesson.
  assert.equal(report!.unitPriorOverlapCount, 1);
  assert.equal(report!.previousLesson?.overlapCount, 0);
});

test("computeRecyclingReport: a lesson with no unit reports isFirstInUnit and a null unit-overlap", () => {
  const curriculum = [
    lesson("l1", { orderIndex: 1, en: ["I ordered coffee"] }),
    lesson("l2", { orderIndex: 2, en: ["I drank coffee"] }),
  ];
  const report = computeRecyclingReport("l2", curriculum);
  assert.ok(report);
  assert.equal(report!.unit, null);
  assert.equal(report!.isFirstInUnit, true);
  assert.equal(report!.unitPriorOverlapCount, null);
});

test("computeRecyclingReport: a lesson with no sentences yet has a null reused share, not a crash", () => {
  const curriculum = [
    lesson("l1", { orderIndex: 1, en: ["I ordered coffee"] }),
    lesson("l2", { orderIndex: 2, en: [] }),
  ];
  const report = computeRecyclingReport("l2", curriculum);
  assert.ok(report);
  assert.equal(report!.totalCount, 0);
  assert.equal(report!.reusedSharePercent, null);
});

test("computeRecyclingReport: an id not present in the curriculum (e.g. an unpublished draft) returns null rather than throwing", () => {
  const curriculum = [lesson("l1", { orderIndex: 1, en: ["I ordered coffee"] })];
  assert.equal(computeRecyclingReport("does-not-exist", curriculum), null);
});

test("computeRecyclingReport: never compares against a later lesson", () => {
  const curriculum = [
    lesson("l1", { orderIndex: 1, en: ["I ordered coffee"] }),
    lesson("l2", { orderIndex: 2, en: ["coffee is my favorite drink"] }),
  ];
  const report = computeRecyclingReport("l1", curriculum);
  assert.ok(report);
  // l1 is first, so nothing (including l2's shared word "coffee") should
  // count as reused — l2 comes after it in the curriculum.
  assert.equal(report!.reusedCount, 0);
});

// --- buildReuseAdvisory: role-aware interpretation --------------------------

function reportWith(overrides: Partial<import("./curriculum-recycling").RecyclingReport>) {
  return {
    lessonId: "l",
    title: "l",
    level: 1,
    orderIndex: 1,
    role: null as LessonRole | null,
    unit: null,
    isFirstPublishedLesson: false,
    isFirstInUnit: false,
    newCount: 0,
    reusedCount: 0,
    totalCount: 0,
    reusedSharePercent: null,
    previousLesson: null,
    unitPriorOverlapCount: null,
    ...overrides,
  };
}

test("buildReuseAdvisory: first published lesson gets a 'necessarily new' note, not an establish-specific one", () => {
  const advisory = buildReuseAdvisory(
    reportWith({ isFirstPublishedLesson: true, role: "establish" }),
  );
  assert.ok(advisory.notes.some((n) => n.includes("First lesson in the published curriculum")));
});

test("buildReuseAdvisory: a later establish lesson gets the unit-opening note", () => {
  const advisory = buildReuseAdvisory(
    reportWith({ isFirstPublishedLesson: false, role: "establish" }),
  );
  assert.ok(advisory.notes.some((n) => n.includes("First lesson of its unit")));
});

test("buildReuseAdvisory: a Build lesson with zero overlap with the previous lesson is flagged", () => {
  const advisory = buildReuseAdvisory(
    reportWith({
      role: "build",
      previousLesson: { id: "prev", title: "The Previous Lesson", overlapCount: 0 },
    }),
  );
  assert.ok(advisory.notes.some((n) => n.includes("No direct vocabulary overlap")));
  assert.ok(advisory.notes.every((n) => !/pass|fail|invalid|must fix|blocked/i.test(n)));
});

test("buildReuseAdvisory: a Build lesson with nonzero overlap is not flagged", () => {
  const advisory = buildReuseAdvisory(
    reportWith({
      role: "build",
      previousLesson: { id: "prev", title: "The Previous Lesson", overlapCount: 2 },
    }),
  );
  assert.ok(!advisory.notes.some((n) => n.includes("No direct vocabulary overlap")));
});

test("buildReuseAdvisory: an Integrate lesson with low reuse gets a soft note", () => {
  const advisory = buildReuseAdvisory(reportWith({ role: "integrate", reusedSharePercent: 10 }));
  assert.ok(advisory.notes.some((n) => n.includes("lower than typical")));
});

test("buildReuseAdvisory: an Integrate lesson with strong reuse gets no low-reuse note", () => {
  const advisory = buildReuseAdvisory(reportWith({ role: "integrate", reusedSharePercent: 70 }));
  assert.ok(!advisory.notes.some((n) => n.includes("lower than typical")));
});

test("buildReuseAdvisory: the same reused share reads differently depending on role (no universal threshold)", () => {
  // 20% is "Healthy" for a Build lesson (band: light < 15) but "Light" for
  // an Integrate lesson (band: light < 35) — proving the label depends on
  // role, not one fixed percentage.
  const buildAdvisory = buildReuseAdvisory(reportWith({ role: "build", reusedSharePercent: 20 }));
  const integrateAdvisory = buildReuseAdvisory(
    reportWith({ role: "integrate", reusedSharePercent: 20 }),
  );
  assert.equal(buildAdvisory.label, "Healthy reuse");
  assert.equal(integrateAdvisory.label, "Light reuse");
});

test("buildReuseAdvisory: never returns a null-total percent as a label", () => {
  const advisory = buildReuseAdvisory(reportWith({ role: "build", reusedSharePercent: null }));
  assert.equal(advisory.label, null);
});

// --- spiralThreadsBefore -----------------------------------------------------

test("spiralThreadsBefore: the first lesson has no prior threads", () => {
  assert.deepEqual(spiralThreadsBefore(1), []);
});

test("spiralThreadsBefore: only includes threads that already occurred strictly earlier", () => {
  const threads = spiralThreadsBefore(3);
  const labels = threads.map((t) => t.label);
  assert.deepEqual(labels.sort(), ["felt X", "work"].sort());
  assert.ok(threads.find((t) => t.label === "work")!.text.includes("Lessons 1 and 2"));
});

test("spiralThreadsBefore: a thread not yet started before this position is omitted, not shown as empty", () => {
  const threads = spiralThreadsBefore(3);
  assert.ok(!threads.some((t) => t.label === "online"));
});
