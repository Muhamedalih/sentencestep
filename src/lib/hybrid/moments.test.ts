import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DISMISS_PAUSE_MS,
  DISMISS_WINDOW_MS,
  NEW_ACCOUNT_MS,
  momentBlock,
  momentPauseUntil,
} from "./moments";

const DAY = 86_400_000;
const now = Date.UTC(2026, 9, 28, 12);
const oldAccount = now - 10 * DAY;

const open = {
  now,
  accountCreatedAt: oldAccount,
  isSubscriber: false,
  hasOpenOrder: false,
  shownToday: false,
  dismissals: [],
};

describe("momentPauseUntil", () => {
  it("is not paused without two dismissals close together", () => {
    assert.equal(momentPauseUntil([]), null);
    assert.equal(momentPauseUntil([now]), null);
    assert.equal(momentPauseUntil([now - 10 * DAY, now]), null);
  });

  it("pauses seven days after the second of two dismissals within a week", () => {
    assert.equal(momentPauseUntil([now - 2 * DAY, now]), now + DISMISS_PAUSE_MS);
    assert.equal(
      momentPauseUntil([now, now - DISMISS_WINDOW_MS]),
      now + DISMISS_PAUSE_MS,
      "the order of the instants does not matter",
    );
  });

  it("takes the pair in the window, not an old dismissal far from the rest", () => {
    assert.equal(momentPauseUntil([now - 30 * DAY, now - 1 * DAY, now]), now + DISMISS_PAUSE_MS);
  });
});

describe("momentBlock", () => {
  it("lets a moment through for an old, free, unpaid account that has not seen one today", () => {
    assert.equal(momentBlock(open), null);
  });

  it("never shows a moment in the first day, or when the account's age is unknown", () => {
    assert.equal(
      momentBlock({ ...open, accountCreatedAt: now - NEW_ACCOUNT_MS / 2 }),
      "new-account",
    );
    assert.equal(momentBlock({ ...open, accountCreatedAt: null }), "new-account");
  });

  it("holds back subscribers, learners with an order still open, and a second moment in one day", () => {
    assert.equal(momentBlock({ ...open, isSubscriber: true }), "subscriber");
    assert.equal(momentBlock({ ...open, hasOpenOrder: true }), "open-order");
    assert.equal(momentBlock({ ...open, shownToday: true }), "shown-today");
  });

  it("pauses after two dismissals, and comes back when the pause is over", () => {
    // The second dismissal was a day ago: the pause runs to six days from now.
    const dismissals = [now - 2 * DAY, now - 1 * DAY];
    assert.equal(momentBlock({ ...open, dismissals }), "paused");
    assert.equal(momentBlock({ ...open, now: now + 5 * DAY, dismissals }), "paused");
    assert.equal(momentBlock({ ...open, now: now + 6 * DAY, dismissals }), null);
  });

  it("gives the first reason that holds", () => {
    assert.equal(
      momentBlock({ ...open, accountCreatedAt: now, isSubscriber: true, shownToday: true }),
      "new-account",
    );
    assert.equal(momentBlock({ ...open, isSubscriber: true, hasOpenOrder: true }), "subscriber");
  });
});
