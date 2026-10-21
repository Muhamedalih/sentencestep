import { test } from "node:test";
import assert from "node:assert/strict";

import {
  REMINDER_GRACE_MS,
  REMINDER_HOURS,
  hasReturnedBeforeReminder,
  isStorableReminderTime,
  reminderSendsPerRun,
  reminderTimeFor,
  reminderWindowBounds,
} from "./reminder";

const HOUR = 3_600_000;

test("REMINDER_HOURS: the evening hours the screen offers", () => {
  assert.deepEqual([...REMINDER_HOURS], [20, 21, 22]);
});

test("reminderTimeFor: tomorrow at the chosen hour on the learner's own clock", () => {
  const now = new Date(2026, 9, 21, 19, 40);
  const at = reminderTimeFor(21, now);
  assert.equal(at.getFullYear(), 2026);
  assert.equal(at.getMonth(), 9);
  assert.equal(at.getDate(), 22);
  assert.equal(at.getHours(), 21);
  assert.equal(at.getMinutes(), 0);
  assert.equal(now.getDate(), 21, "the clock passed in is not changed");
});

test("reminderTimeFor: across a month end", () => {
  const at = reminderTimeFor(20, new Date(2026, 9, 31, 23, 30));
  assert.equal(at.getMonth(), 10);
  assert.equal(at.getDate(), 1);
  assert.equal(at.getHours(), 20);
});

test("isStorableReminderTime: only a real instant between an hour and forty hours away", () => {
  const now = new Date(2026, 9, 21, 19, 40);
  assert.equal(isStorableReminderTime(reminderTimeFor(21, now).toISOString(), now), true);
  assert.equal(
    isStorableReminderTime(new Date(now.getTime() + 30 * 60_000).toISOString(), now),
    false,
  );
  assert.equal(
    isStorableReminderTime(new Date(now.getTime() + 41 * HOUR).toISOString(), now),
    false,
  );
  assert.equal(isStorableReminderTime(new Date(now.getTime() - HOUR).toISOString(), now), false);
  assert.equal(isStorableReminderTime("not a date", now), false);
  assert.equal(isStorableReminderTime("", now), false);
});

test("reminderWindowBounds: due now, and no more than six hours late", () => {
  const now = new Date("2026-10-21T18:07:00.000Z");
  const { from, to } = reminderWindowBounds(now);
  assert.equal(to.getTime(), now.getTime());
  assert.equal(now.getTime() - from.getTime(), REMINDER_GRACE_MS);
  assert.equal(REMINDER_GRACE_MS, 6 * HOUR);
});

test("hasReturnedBeforeReminder: studying on the reminder's own day means the learner is back", () => {
  const remindAt = "2026-10-22T18:00:00.000Z";
  assert.equal(hasReturnedBeforeReminder(remindAt, ["2026-10-22T09:30:00.000Z"]), true);
  assert.equal(hasReturnedBeforeReminder(remindAt, ["2026-10-22T17:59:00.000Z"]), true);
});

test("hasReturnedBeforeReminder: an extra lesson the evening before does not cancel tomorrow's reminder", () => {
  const remindAt = "2026-10-22T18:00:00.000Z";
  assert.equal(hasReturnedBeforeReminder(remindAt, ["2026-10-21T17:00:00.000Z"]), false);
  assert.equal(hasReturnedBeforeReminder(remindAt, []), false);
});

test("hasReturnedBeforeReminder: a lesson after the hour, or an unreadable time, does not count", () => {
  const remindAt = "2026-10-22T18:00:00.000Z";
  assert.equal(hasReturnedBeforeReminder(remindAt, ["2026-10-22T18:30:00.000Z"]), false);
  assert.equal(hasReturnedBeforeReminder(remindAt, ["oops"]), false);
  assert.equal(hasReturnedBeforeReminder("oops", ["2026-10-22T09:30:00.000Z"]), false);
});

test("reminderSendsPerRun: off unless a positive number is set, capped at 200", () => {
  assert.equal(reminderSendsPerRun(undefined), 0);
  assert.equal(reminderSendsPerRun(""), 0);
  assert.equal(reminderSendsPerRun("0"), 0);
  assert.equal(reminderSendsPerRun("-5"), 0);
  assert.equal(reminderSendsPerRun("abc"), 0);
  assert.equal(reminderSendsPerRun("30"), 30);
  assert.equal(reminderSendsPerRun(" 45 "), 45);
  assert.equal(reminderSendsPerRun("9999"), 200);
});
