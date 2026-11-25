import assert from "node:assert/strict";
import test from "node:test";

import { buildGermanToday, type GermanTodayInput } from "@/lib/today/german";

const story = (id: string, level: number, order: number) =>
  ({ id, title: id, supportTitle: "ar " + id, level, order }) as never;
const passage = (id: string, order: number) =>
  ({
    id,
    title: id,
    titleAr: "ar",
    level: "A1",
    tone: "calm",
    order,
    estimatedMinutes: 4,
    posterUrl: null,
    isFree: true,
    sectionCount: 3,
  }) as never;
const group = (id: string, wordIds: string[]) =>
  ({ id, title: id, level: 1, order: 1, wordIds, wordCount: wordIds.length }) as never;

const base: GermanTodayInput = {
  todayISO: "2026-11-25",
  dayOf: (iso) => iso.slice(0, 10),
  stories: [story("de-s2", 1, 2), story("de-s1", 1, 1)],
  passages: [passage("de-p1", 1)],
  passageProgress: [],
  groups: [group("de-g1", ["de-w1", "de-w2", "de-w3", "de-w4", "de-w5", "de-w6"])],
  completions: [],
  words: [],
  storyCounts: new Map(),
  wpm: 30,
  locale: "ar",
};

test("a new day: three tasks in English's order (listen, story, words), none done, plain links", () => {
  const payload = buildGermanToday(base)!;
  assert.deepEqual(
    payload.quests.map((quest) => quest.today?.kind),
    ["listen", "story", "words"],
  );
  assert.equal(payload.allDone, false);
  assert.equal(payload.quests[1]!.today!.href, "/learn/stories/de-s1");
  assert.equal(payload.quests[0]!.today!.href, "/learn/passages/de-p1");
  assert.equal(payload.quests[2]!.today!.href, "/learn/word-lists/de-g1");
  assert.ok(
    payload.quests.every((quest) => !quest.today!.href.includes("today=1") && quest.xp === 0),
  );
});

test("a German story finished today ticks the story task and is shown as done, with redo", () => {
  const payload = buildGermanToday({
    ...base,
    completions: [
      { lessonId: "de-s1", mode: "stories", completedAt: "2026-11-25T08:00:00Z", accuracy: 0.9 },
      { lessonId: "s1", mode: "stories", completedAt: "2026-11-25T09:00:00Z", accuracy: 1 },
    ],
  })!;
  const task = payload.quests.find((quest) => quest.today?.kind === "story")!;
  assert.equal(task.completed, true);
  assert.equal(task.today!.title, "de-s1");
  assert.equal(task.today!.redoHref, "/learn/stories/de-s1");
  assert.equal(task.today!.accuracy, 0.9);
});

test("an English story finished today does not tick the German one", () => {
  const payload = buildGermanToday({
    ...base,
    completions: [
      { lessonId: "s1", mode: "stories", completedAt: "2026-11-25T09:00:00Z", accuracy: 1 },
    ],
  })!;
  assert.equal(payload.quests.find((quest) => quest.today?.kind === "story")!.completed, false);
});

test("five German words typed for the first time today tick the words task; English words and old days do not", () => {
  const words = ["de-w1", "de-w2", "de-w3", "de-w4"].map((wordId) => ({
    wordId,
    firstAt: "2026-11-25T07:00:00Z",
  }));
  const wordsTask = (input: GermanTodayInput) =>
    buildGermanToday(input)!.quests.find((quest) => quest.today?.kind === "words")!;
  assert.equal(wordsTask({ ...base, words }).completed, false);
  const five = [...words, { wordId: "de-w5", firstAt: "2026-11-25T07:05:00Z" }];
  assert.equal(wordsTask({ ...base, words: five }).completed, true);
  const mixed = [
    ...words,
    { wordId: "cat", firstAt: "2026-11-25T07:05:00Z" },
    { wordId: "de-w5", firstAt: "2026-11-24T07:05:00Z" },
  ];
  assert.equal(wordsTask({ ...base, words: mixed }).completed, false);
});

test("a day with all three finished is allDone; no content gives no tasks", () => {
  const done = buildGermanToday({
    ...base,
    completions: [
      { lessonId: "de-s1", mode: "stories", completedAt: "2026-11-25T08:00:00Z", accuracy: 1 },
    ],
    passageProgress: [{ passageId: "de-p1", completedAt: "2026-11-25T08:10:00Z" } as never],
    words: ["de-w1", "de-w2", "de-w3", "de-w4", "de-w5"].map((wordId) => ({
      wordId,
      firstAt: "2026-11-25T08:20:00Z",
    })),
  })!;
  assert.equal(done.allDone, true);
  assert.equal(buildGermanToday({ ...base, stories: [], passages: [], groups: [] }), null);
});
