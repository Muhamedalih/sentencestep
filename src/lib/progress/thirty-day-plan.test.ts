import { test } from "node:test";
import assert from "node:assert/strict";

import { PLAN_DAYS, isFirstPayment, thirtyDayPlan } from "./thirty-day-plan";

test("thirtyDayPlan: thirty sessions are thirty passages, thirty stories and a hundred and fifty words", () => {
  const plan = thirtyDayPlan();
  assert.equal(plan.days, PLAN_DAYS);
  assert.equal(plan.passages, 30);
  assert.equal(plan.stories, 30);
  assert.equal(plan.words, 150);
});

test("thirtyDayPlan: the sentences written are the typical story's, once a day", () => {
  assert.equal(thirtyDayPlan().sentences, 240);
  assert.equal(thirtyDayPlan(10).sentences, 80);
});

test("thirtyDayPlan: a session takes the minutes Today's own estimates give for the typical content (5 + 4 + 2)", () => {
  assert.equal(thirtyDayPlan().minutesPerSession, 11);
});

test("isFirstPayment: the order just confirmed is the only fulfilled one", () => {
  assert.equal(
    isFirstPayment(
      [
        { reference_id: "now", status: "fulfilled" },
        { reference_id: "old", status: "expired" },
        { reference_id: "older", status: "cancelled" },
      ],
      "now",
    ),
    true,
  );
});

test("isFirstPayment: an earlier fulfilled order means the learner is adding days, not starting", () => {
  assert.equal(
    isFirstPayment(
      [
        { reference_id: "now", status: "fulfilled" },
        { reference_id: "before", status: "fulfilled" },
      ],
      "now",
    ),
    false,
  );
});

test("isFirstPayment: orders that could not be read leave the card out", () => {
  assert.equal(isFirstPayment(null, "now"), false);
  assert.equal(isFirstPayment(undefined, "now"), false);
});
