import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_POOL_LESSONS,
  finishedLessonDays,
  recentFinishedLessons,
  reviewedTodayCount,
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

test("it counts the sentences already asked today", () => {
  const states = new Map([
    ["a", { lastReviewedOn: "2025-06-10" }],
    ["b", { lastReviewedOn: "2025-06-09" }],
    ["c", { lastReviewedOn: "2025-06-10" }],
  ]);
  assert.equal(reviewedTodayCount(states, "2025-06-10"), 2);
  assert.equal(reviewedTodayCount(new Map(), "2025-06-10"), 0);
});
