// Run with `npm run test:admin`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  baghdadDay,
  summarizeGermanActivity,
  summarizeGermanChoices,
  type GermanChoiceRow,
} from "./german-counter-domain";

const NOW = new Date("2026-11-26T12:00:00Z");

function choice(user: string | null, at: string, properties: unknown): GermanChoiceRow {
  return { user_id: user, created_at: at, event_properties: properties };
}

test("a Baghdad day starts at 21:00 UTC the evening before", () => {
  assert.equal(baghdadDay("2026-11-25T20:59:00Z"), "2026-11-25");
  assert.equal(baghdadDay("2026-11-25T21:00:00Z"), "2026-11-26");
});

test("one person who switches to German twice is one person and two switches", () => {
  const summary = summarizeGermanChoices(
    [
      choice(null, "2026-11-26T08:00:00Z", { via: "first_run", visitor: "abc123abc123" }),
      choice(null, "2026-11-26T09:00:00Z", { via: "switch", visitor: "abc123abc123" }),
      choice("user-1", "2026-11-25T09:00:00Z", { via: "switch" }),
    ],
    NOW,
  );
  assert.equal(summary.switches, 3);
  assert.equal(summary.people, 2);
  assert.equal(summary.peopleToday, 1);
  assert.equal(summary.peopleLast7Days, 2);
  // The visitor's first switch was the first-run step; the member's was a later switch.
  assert.equal(summary.firstRunPeople, 1);
  assert.equal(summary.laterPeople, 1);
});

test("a row with no account and no token counts as its own person", () => {
  const summary = summarizeGermanChoices(
    [
      choice(null, "2026-11-26T08:00:00Z", { via: "first_run" }),
      choice(null, "2026-11-26T08:01:00Z", {}),
    ],
    NOW,
  );
  assert.equal(summary.people, 2);
});

test("the per-day list ends today, is oldest first and has a zero for quiet days", () => {
  const summary = summarizeGermanChoices([choice("u", "2026-11-24T10:00:00Z", {})], NOW, 3);
  assert.deepEqual(summary.perDay, [
    { day: "2026-11-24", people: 1 },
    { day: "2026-11-25", people: 0 },
    { day: "2026-11-26", people: 0 },
  ]);
});

test("nothing chosen yet is all zeros", () => {
  const summary = summarizeGermanChoices([], NOW);
  assert.equal(summary.people, 0);
  assert.equal(summary.perDay.length, 14);
});

test("German activity counts starts and finishes, members apart from guests", () => {
  const summary = summarizeGermanActivity([
    { user_id: "a", event_name: "LESSON_STARTED" },
    { user_id: "a", event_name: "STORY_STARTED" },
    { user_id: "b", event_name: "LESSON_STARTED" },
    { user_id: null, event_name: "LESSON_STARTED" },
    { user_id: "a", event_name: "LESSON_COMPLETED" },
    { user_id: null, event_name: "STORY_COMPLETED" },
    { user_id: "a", event_name: "AUDIO_PLAYED" },
  ]);
  assert.equal(summary.started, 4);
  assert.equal(summary.finished, 2);
  assert.equal(summary.membersStarted, 2);
  assert.equal(summary.membersFinished, 1);
  assert.equal(summary.guestStarted, 1);
  assert.equal(summary.guestFinished, 1);
});
