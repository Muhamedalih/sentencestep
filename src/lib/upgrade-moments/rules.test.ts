import assert from "node:assert/strict";
import test from "node:test";

import {
  DISMISS_PAUSE_MS,
  NEW_ACCOUNT_MS,
  momentBlock,
  pickMoment,
  previewMoment,
  storiesFinishedOn,
  weekFigures,
} from "./rules";

const NOW = Date.UTC(2026, 10, 3, 12);
const base = {
  now: NOW,
  accountCreatedAt: NOW - 10 * 86_400_000,
  isSubscriber: false,
  hasOpenOrder: false,
  shownToday: false,
  lastDismissedAt: null,
};

test("a card may be shown to an established free learner with nothing else pending", () => {
  assert.equal(momentBlock(base), null);
});

test("an account in its first day, or of unknown age, never sees a card", () => {
  assert.equal(momentBlock({ ...base, accountCreatedAt: NOW - NEW_ACCOUNT_MS + 1 }), "new-account");
  assert.equal(momentBlock({ ...base, accountCreatedAt: null }), "new-account");
  assert.equal(momentBlock({ ...base, accountCreatedAt: NOW - NEW_ACCOUNT_MS }), null);
});

test("subscribers, an open order and a card already shown today block it, in that order", () => {
  assert.equal(momentBlock({ ...base, isSubscriber: true, hasOpenOrder: true }), "subscriber");
  assert.equal(momentBlock({ ...base, hasOpenOrder: true, shownToday: true }), "open-order");
  assert.equal(momentBlock({ ...base, shownToday: true }), "shown-today");
});

test("a closed card keeps every card away for three days, no longer", () => {
  assert.equal(
    momentBlock({ ...base, lastDismissedAt: NOW - DISMISS_PAUSE_MS + 1 }),
    "dismissed-lately",
  );
  assert.equal(momentBlock({ ...base, lastDismissedAt: NOW - DISMISS_PAUSE_MS }), null);
});

test("each moment has its own condition and the first listed one that holds wins", () => {
  assert.equal(pickMoment(["tasks"], { streak: 0, storiesToday: 0 }), "tasks");
  assert.equal(pickMoment(["streak3", "tasks"], { streak: 3, storiesToday: 0 }), "streak3");
  assert.equal(pickMoment(["streak3", "tasks"], { streak: 4, storiesToday: 0 }), "tasks");
  assert.equal(pickMoment(["streak3"], { streak: 2, storiesToday: 0 }), null);
  assert.equal(pickMoment(["story"], { streak: 3, storiesToday: 1 }), null);
  assert.equal(pickMoment(["story"], { streak: 0, storiesToday: 2 }), "story");
});

test("the week's figures count the last seven days and split stories from lessons", () => {
  const day = 86_400_000;
  const iso = (ago: number) => new Date(NOW - ago * day).toISOString();
  const figures = weekFigures(
    [
      { mode: "stories", completedAt: iso(1) },
      { mode: "stories", completedAt: iso(6) },
      { mode: "stories", completedAt: iso(8) },
      { mode: "normal", completedAt: iso(2) },
      { mode: "conversation", completedAt: iso(0) },
      { mode: "normal", completedAt: "not a date" },
    ],
    NOW,
  );
  assert.deepEqual(figures, { lessons: 2, stories: 2 });
});

test("stories finished today are counted on the learner's own day", () => {
  const dayOf = (iso: string) => iso.slice(0, 10);
  assert.equal(
    storiesFinishedOn(
      [
        { mode: "stories", completedAt: "2026-11-03T08:00:00Z" },
        { mode: "stories", completedAt: "2026-11-03T09:00:00Z" },
        { mode: "stories", completedAt: "2026-11-02T09:00:00Z" },
        { mode: "normal", completedAt: "2026-11-03T09:00:00Z" },
      ],
      "2026-11-03",
      dayOf,
    ),
    2,
  );
});

test("an admin's preview shows the tasks card when it is listed, else the first one", () => {
  assert.equal(previewMoment(["streak3", "tasks"]), "tasks");
  assert.equal(previewMoment(["streak3"]), "streak3");
  assert.equal(previewMoment(["story"]), "story");
  assert.equal(previewMoment([]), "tasks");
});
