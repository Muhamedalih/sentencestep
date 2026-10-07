// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { calendarDaysUntil, planExpiryReminders, reminderStage } from "./expiry-reminders";

const NOW = new Date("2027-01-26T09:00:00.000Z");
const DAY = 86_400_000;
const end = (days: number) => new Date(NOW.getTime() + days * DAY);

test("reminderStage: nothing while the end is more than a week away", () => {
  assert.equal(reminderStage(end(7.5), NOW), null);
  assert.equal(reminderStage(end(30), NOW), null);
});

test("reminderStage: the 7-day reminder covers the days between a week and three days out", () => {
  assert.equal(reminderStage(end(7), NOW), 7);
  assert.equal(reminderStage(end(5), NOW), 7);
  assert.equal(reminderStage(end(3.1), NOW), 7);
});

test("reminderStage: the 3-day reminder covers the last three days", () => {
  assert.equal(reminderStage(end(3), NOW), 3);
  assert.equal(reminderStage(end(1), NOW), 3);
  assert.equal(reminderStage(end(0.01), NOW), 3);
});

test("reminderStage: nothing once the period has ended", () => {
  assert.equal(reminderStage(end(0), NOW), null);
  assert.equal(reminderStage(end(-2), NOW), null);
});

test("planExpiryReminders: plans only the periods inside the window, with whole days left rounded up", () => {
  const due = planExpiryReminders({
    now: NOW,
    streaks: [],
    subscriptions: [
      { userId: "far", periodEnd: end(20).toISOString() },
      { userId: "week", periodEnd: end(6.2).toISOString() },
      { userId: "soon", periodEnd: end(1.5).toISOString() },
      { userId: "over", periodEnd: end(-1).toISOString() },
      { userId: "bad", periodEnd: "not a date" },
    ],
  });

  assert.deepEqual(
    due.map((reminder) => [reminder.userId, reminder.stage, reminder.daysLeft]),
    [
      ["week", 7, 7],
      ["soon", 3, 2],
    ],
  );
});

test("planExpiryReminders: quotes a live streak of three or more days, and only that", () => {
  const due = planExpiryReminders({
    now: NOW,
    subscriptions: [
      { userId: "long", periodEnd: end(2).toISOString() },
      { userId: "short", periodEnd: end(2).toISOString() },
      { userId: "lapsed", periodEnd: end(2).toISOString() },
      { userId: "none", periodEnd: end(2).toISOString() },
    ],
    streaks: [
      { user_id: "long", current_streak: 12, last_active_date: "2027-01-25" },
      { user_id: "short", current_streak: 2, last_active_date: "2027-01-26" },
      { user_id: "lapsed", current_streak: 30, last_active_date: "2027-01-10" },
    ],
  });

  assert.deepEqual(
    due.map((reminder) => [reminder.userId, reminder.streak]),
    [
      ["long", 12],
      ["short", 0],
      ["lapsed", 0],
      ["none", 0],
    ],
  );
});

test("calendarDaysUntil: counts calendar days in the runtime's own time zone, whatever the time of day", () => {
  const lateEvening = new Date(2027, 0, 26, 23, 30);
  assert.equal(calendarDaysUntil(new Date(2027, 0, 26, 23, 59), lateEvening), 0);
  assert.equal(calendarDaysUntil(new Date(2027, 0, 27, 0, 5), lateEvening), 1);
  assert.equal(calendarDaysUntil(new Date(2027, 0, 29, 8, 0), lateEvening), 3);
  assert.equal(calendarDaysUntil(new Date(2027, 1, 2, 12, 0), new Date(2027, 0, 26, 6, 0)), 7);
});
