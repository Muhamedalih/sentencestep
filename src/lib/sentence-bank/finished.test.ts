import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_POOL_LESSONS,
  MAX_TODAY_LESSONS,
  finishedLessonDays,
  finishedTodayLessons,
  recentFinishedLessons,
  reviewedTodayCount,
  storiesFinishedToday,
} from "@/lib/sentence-bank/finished";

const utcDay = (iso: string) => iso.slice(0, 10);

test("only daily lessons and stories count, each with the day it was finished", () => {
  const days = finishedLessonDays(
    [
      { lessonId: "normal-1", mode: "normal", completedAt: "2025-06-01T10:00:00Z" },
      { lessonId: "story-1", mode: "stories", completedAt: "2025-06-02T09:00:00Z" },
      { lessonId: "chat-1", mode: "conversation", completedAt: "2025-06-02T09:30:00Z" },
    ],
    utcDay,
  );
  assert.deepEqual(
    [...days],
    [
      ["normal-1", "2025-06-01"],
      ["story-1", "2025-06-02"],
    ],
  );
});

test("the day follows the learner's calendar, not the timestamp's", () => {
  // 23:30 UTC is already the next morning in Baghdad.
  const baghdad = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Baghdad",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  const days = finishedLessonDays(
    [{ lessonId: "normal-1", mode: "normal", completedAt: "2025-06-01T23:30:00Z" }],
    baghdad,
  );
  assert.equal(days.get("normal-1"), "2025-06-02");
});

test("a lesson listed twice keeps its earliest day", () => {
  const days = finishedLessonDays(
    [
      { lessonId: "normal-1", mode: "normal", completedAt: "2025-06-05T10:00:00Z" },
      { lessonId: "normal-1", mode: "normal", completedAt: "2025-06-01T10:00:00Z" },
    ],
    utcDay,
  );
  assert.equal(days.get("normal-1"), "2025-06-01");
});

test("the recent lessons are the ones finished before today, newest first, never more than the cap", () => {
  const finished = new Map([
    ["a", "2025-06-01"],
    ["b", "2025-06-09"],
    ["c", "2025-06-05"],
    ["d", "2025-06-10"], // finished today: not yet a memory to test
    ["e", "2025-06-09"],
  ]);
  assert.deepEqual(recentFinishedLessons(finished, "2025-06-10"), ["b", "e", "c", "a"]);
  assert.deepEqual(recentFinishedLessons(finished, "2025-06-10", 2), ["b", "e"]);
  assert.deepEqual(recentFinishedLessons(finished, "2025-06-10", 0), []);
  assert.deepEqual(recentFinishedLessons(new Map(), "2025-06-10"), []);
  assert.equal(MAX_POOL_LESSONS, 40);
});

test("the cap keeps a long history from becoming a big read", () => {
  const finished = new Map(
    Array.from({ length: 150 }, (_unused, index) => [
      `lesson-${index}`,
      `2025-0${1 + Math.floor(index / 30)}-${String(1 + (index % 28)).padStart(2, "0")}`,
    ]),
  );
  assert.equal(recentFinishedLessons(finished, "2025-12-31").length, MAX_POOL_LESSONS);
});

test("the lessons finished today are only today's, in id order, never more than the cap", () => {
  const finished = new Map([
    ["c", "2025-06-10"],
    ["a", "2025-06-10"],
    ["b", "2025-06-09"], // yesterday
    ["d", "2025-06-10"],
  ]);
  assert.deepEqual(finishedTodayLessons(finished, "2025-06-10"), ["a", "c", "d"]);
  assert.deepEqual(finishedTodayLessons(finished, "2025-06-10", 2), ["a", "c"]);
  assert.deepEqual(finishedTodayLessons(finished, "2025-06-10", 0), []);
  assert.deepEqual(finishedTodayLessons(new Map(), "2025-06-10"), []);
  assert.equal(MAX_TODAY_LESSONS, 6);
});

test("it counts the sentences already asked today", () => {
  const states = new Map([
    ["a", { lastReviewedOn: "2025-06-10" }],
    ["b", { lastReviewedOn: "2025-06-09" }],
    ["c", { lastReviewedOn: "2025-06-10" }],
  ]);
  assert.equal(reviewedTodayCount(states, "2025-06-10"), 2);
  assert.equal(reviewedTodayCount(new Map(), "2025-06-10"), 0);
});

test("the stories finished today are the day's own, a redo of an old story counts, a daily lesson never does", () => {
  const completions = [
    { lessonId: "story-b", mode: "stories", completedAt: "2025-06-10T08:00:00Z" },
    { lessonId: "story-a", mode: "stories", completedAt: "2025-06-10T09:00:00Z" },
    // Finished on an earlier day and done again today: today it is one of the day's lessons.
    { lessonId: "story-old", mode: "stories", completedAt: "2025-06-03T09:00:00Z" },
    { lessonId: "story-old", mode: "stories", completedAt: "2025-06-10T10:00:00Z" },
    { lessonId: "story-yesterday", mode: "stories", completedAt: "2025-06-09T10:00:00Z" },
    { lessonId: "normal-1", mode: "normal", completedAt: "2025-06-10T11:00:00Z" },
    { lessonId: "chat-1", mode: "conversation", completedAt: "2025-06-10T11:30:00Z" },
  ];
  assert.deepEqual(storiesFinishedToday(completions, utcDay, "2025-06-10"), [
    "story-a",
    "story-b",
    "story-old",
  ]);
  assert.deepEqual(storiesFinishedToday(completions, utcDay, "2025-06-10", 2), [
    "story-a",
    "story-b",
  ]);
  assert.deepEqual(storiesFinishedToday(completions, utcDay, "2025-06-11"), []);
});
