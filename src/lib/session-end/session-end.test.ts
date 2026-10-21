import { test } from "node:test";
import assert from "node:assert/strict";

import type { FromMemoryItem } from "@/lib/features/from-memory";

import { RECALL_COUNT, pickRecallItems } from "./recall";
import { LESSON_MINUTES, activeDaysInWindow, estimateTomorrowMinutes } from "./summary";

function item(id: string, en: string): FromMemoryItem {
  return { sentence: { id, en, ar: "ترجمة" }, prompt: "ترجمة" };
}

function items(count: number): FromMemoryItem[] {
  return Array.from({ length: count }, (_unused, index) =>
    item(`s${index + 1}`, `This is sentence number ${index + 1}`),
  );
}

const ids = (list: readonly FromMemoryItem[]) => list.map((entry) => entry.sentence.id);

test("pickRecallItems: three sentences spread through an eight-sentence lesson", () => {
  assert.equal(RECALL_COUNT, 3);
  assert.deepEqual(ids(pickRecallItems(items(8))), ["s2", "s5", "s7"]);
});

test("pickRecallItems: a long lesson is still sampled from its start, middle and end", () => {
  const picked = ids(pickRecallItems(items(30)));
  assert.equal(picked.length, 3);
  assert.deepEqual(picked, ["s6", "s16", "s26"]);
});

test("pickRecallItems: a short lesson asks everything it has, in order", () => {
  assert.deepEqual(ids(pickRecallItems(items(3))), ["s1", "s2", "s3"]);
  assert.deepEqual(ids(pickRecallItems(items(2))), ["s1", "s2"]);
  assert.deepEqual(pickRecallItems([]), []);
});

test("pickRecallItems: four sentences give three distinct ones", () => {
  const picked = ids(pickRecallItems(items(4)));
  assert.equal(new Set(picked).size, 3);
});

test("pickRecallItems: one-and-two-word sentences are skipped while enough longer ones exist", () => {
  const mixed = [
    item("a", "Hi!"),
    item("b", "Good morning everyone here"),
    item("c", "Thank you"),
    item("d", "I would like some tea"),
    item("e", "See you tomorrow morning"),
    item("f", "Yes"),
  ];
  assert.deepEqual(ids(pickRecallItems(mixed)), ["b", "d", "e"]);
});

test("pickRecallItems: when too few sentences are long enough, the short ones are used too", () => {
  const mostlyShort = [
    item("a", "Hi!"),
    item("b", "Thank you"),
    item("c", "I would like some tea"),
  ];
  assert.deepEqual(ids(pickRecallItems(mostlyShort)), ["a", "b", "c"]);
});

test("activeDaysInWindow: today always counts, even with nothing saved yet", () => {
  const now = new Date(2026, 9, 21, 20, 30);
  assert.equal(activeDaysInWindow([], now), 1);
});

test("activeDaysInWindow: distinct local days inside the last seven, one count per day", () => {
  const now = new Date(2026, 9, 21, 20, 30);
  const completedAt = [
    new Date(2026, 9, 21, 9, 0).toISOString(), // today again
    new Date(2026, 9, 20, 22, 0).toISOString(),
    new Date(2026, 9, 20, 8, 0).toISOString(), // same day as the one above
    new Date(2026, 9, 17, 12, 0).toISOString(),
    new Date(2026, 9, 15, 12, 0).toISOString(), // 6 days back: the oldest day still inside
  ];
  assert.equal(activeDaysInWindow(completedAt, now), 4);
});

test("activeDaysInWindow: days older than the window and unreadable timestamps are ignored", () => {
  const now = new Date(2026, 9, 21, 20, 30);
  const completedAt = [
    new Date(2026, 9, 14, 12, 0).toISOString(), // 7 days back: just outside
    new Date(2026, 8, 1, 12, 0).toISOString(),
    "not a date",
    "",
  ];
  assert.equal(activeDaysInWindow(completedAt, now), 1);
});

test("estimateTomorrowMinutes: reviews at about 20 seconds a word plus a three-minute lesson", () => {
  assert.equal(LESSON_MINUTES, 3);
  assert.equal(estimateTomorrowMinutes(0, true), 3);
  assert.equal(estimateTomorrowMinutes(9, true), 6);
  assert.equal(estimateTomorrowMinutes(9, false), 3);
  assert.equal(estimateTomorrowMinutes(1, false), 1);
  assert.equal(estimateTomorrowMinutes(0, false), 0);
});
