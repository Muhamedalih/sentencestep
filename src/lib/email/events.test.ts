// Deterministic unit tests for the notification event model — no
// database, no email provider, no network. Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { dedupeKeyFor, shouldNotify } from "./events";
import type { NotificationEvent } from "./events";

test("shouldNotify: a lesson-count milestone (5) is meaningful", () => {
  const event: NotificationEvent = { type: "LESSON_COMPLETED", totalCompleted: 5 };
  assert.equal(shouldNotify(event), true);
});

test("shouldNotify: a non-milestone lesson count (6) is not meaningful — no spam per lesson", () => {
  const event: NotificationEvent = { type: "LESSON_COMPLETED", totalCompleted: 6 };
  assert.equal(shouldNotify(event), false);
});

test("shouldNotify: every story completion is meaningful", () => {
  const event: NotificationEvent = { type: "STORY_COMPLETED", lessonId: "story-2" };
  assert.equal(shouldNotify(event), true);
});

test("shouldNotify: every conversation completion is meaningful", () => {
  const event: NotificationEvent = { type: "CONVERSATION_COMPLETED", lessonId: "conversation-3" };
  assert.equal(shouldNotify(event), true);
});

test("shouldNotify: every level completion is meaningful", () => {
  const event: NotificationEvent = { type: "LEVEL_COMPLETED", mode: "normal", level: 2 };
  assert.equal(shouldNotify(event), true);
});

test("shouldNotify: a streak milestone (7) is meaningful", () => {
  const event: NotificationEvent = { type: "STREAK_MILESTONE", streak: 7 };
  assert.equal(shouldNotify(event), true);
});

test("shouldNotify: a non-milestone streak (8) is not meaningful", () => {
  const event: NotificationEvent = { type: "STREAK_MILESTONE", streak: 8 };
  assert.equal(shouldNotify(event), false);
});

test("shouldNotify: inactivity below the threshold does not warrant a reminder", () => {
  const event: NotificationEvent = { type: "INACTIVE_LEARNER", daysInactive: 2 };
  assert.equal(shouldNotify(event), false);
});

test("shouldNotify: inactivity at the threshold warrants a reminder", () => {
  const event: NotificationEvent = { type: "INACTIVE_LEARNER", daysInactive: 3 };
  assert.equal(shouldNotify(event), true);
});

test("dedupeKeyFor: identical events produce identical keys (idempotency contract)", () => {
  const a: NotificationEvent = { type: "LEVEL_COMPLETED", mode: "stories", level: 1 };
  const b: NotificationEvent = { type: "LEVEL_COMPLETED", mode: "stories", level: 1 };
  assert.equal(dedupeKeyFor(a), dedupeKeyFor(b));
});

test("dedupeKeyFor: different levels/modes produce different keys", () => {
  const level1: NotificationEvent = { type: "LEVEL_COMPLETED", mode: "normal", level: 1 };
  const level2: NotificationEvent = { type: "LEVEL_COMPLETED", mode: "normal", level: 2 };
  const otherMode: NotificationEvent = { type: "LEVEL_COMPLETED", mode: "stories", level: 1 };
  assert.notEqual(dedupeKeyFor(level1), dedupeKeyFor(level2));
  assert.notEqual(dedupeKeyFor(level1), dedupeKeyFor(otherMode));
});

test("dedupeKeyFor: two lesson-count milestones (5 then 10) never collide", () => {
  const five: NotificationEvent = { type: "LESSON_COMPLETED", totalCompleted: 5 };
  const ten: NotificationEvent = { type: "LESSON_COMPLETED", totalCompleted: 10 };
  assert.notEqual(dedupeKeyFor(five), dedupeKeyFor(ten));
});

test("dedupeKeyFor: INACTIVE_LEARNER on the same day produces the same key (won't double-send same-day)", () => {
  const event: NotificationEvent = { type: "INACTIVE_LEARNER", daysInactive: 4 };
  const now = new Date("2026-01-15T09:00:00Z");
  const laterSameDay = new Date("2026-01-15T21:00:00Z");
  assert.equal(dedupeKeyFor(event, now), dedupeKeyFor(event, laterSameDay));
});

test("dedupeKeyFor: INACTIVE_LEARNER a week apart produces a different key (can remind again later)", () => {
  const event: NotificationEvent = { type: "INACTIVE_LEARNER", daysInactive: 10 };
  const now = new Date("2026-01-15T09:00:00Z");
  const nextWeek = new Date("2026-01-25T09:00:00Z");
  assert.notEqual(dedupeKeyFor(event, now), dedupeKeyFor(event, nextWeek));
});
