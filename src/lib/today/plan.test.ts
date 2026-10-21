import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SESSION_LENGTH,
  REVIEW_CAP,
  daysBetween,
  defaultLengthFor,
  parseSessionLength,
  planAllLengths,
  planToday,
  startHref,
} from "./plan";
import { weekDates, weekDots, weekStartFor } from "./week";

const base = { dueReview: 0, hasNew: true, hasHistory: true, daysAway: 1 } as const;

describe("planToday", () => {
  it("a learner with no finished lesson gets only the opening lesson", () => {
    const plan = planToday({ ...base, length: 7, hasHistory: false, daysAway: null, dueReview: 9 });
    assert.equal(plan.variant, "first");
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["new"],
    );
  });

  it("a regular 7-minute day reviews first, then one lesson, then a 3-sentence recall", () => {
    const plan = planToday({ ...base, length: 7, dueReview: 8 });
    assert.equal(plan.variant, "regular");
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["review", "new", "recall"],
    );
    const recall = plan.steps[2];
    assert.equal(recall?.kind === "recall" ? recall.items : 0, 3);
  });

  it("the review is capped by the session length", () => {
    const seven = planToday({ ...base, length: 7, dueReview: 15 });
    const twelve = planToday({ ...base, length: 12, dueReview: 20 });
    const first7 = seven.steps[0];
    const first12 = twelve.steps[0];
    assert.equal(first7?.kind === "review" ? first7.items : 0, REVIEW_CAP[7]);
    assert.equal(first12?.kind === "review" ? first12.items : 0, REVIEW_CAP[12]);
    const recall = twelve.steps.find((step) => step.kind === "recall");
    assert.equal(recall?.kind === "recall" ? recall.items : 0, 4);
  });

  it("skips the review when fewer than three words are due", () => {
    const plan = planToday({ ...base, length: 7, dueReview: 2 });
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["new", "recall"],
    );
  });

  it("the 3-minute session is review only, or one lesson when nothing is due", () => {
    assert.deepEqual(
      planToday({ ...base, length: 3, dueReview: 5 }).steps.map((step) => step.kind),
      ["review"],
    );
    assert.deepEqual(
      planToday({ ...base, length: 3, dueReview: 0 }).steps.map((step) => step.kind),
      ["new"],
    );
  });

  it("a large backlog makes a review-only day", () => {
    const plan = planToday({ ...base, length: 7, dueReview: REVIEW_CAP[7] * 2 + 1 });
    assert.equal(plan.variant, "reviewOnly");
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["review"],
    );
  });

  it("a years-old backlog does not freeze the path: review a few, then a lesson", () => {
    const plan = planToday({ ...base, length: 7, dueReview: REVIEW_CAP[7] * 5 + 1 });
    assert.equal(plan.variant, "regular");
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["review", "new", "recall"],
    );
  });

  it("days away give a light review and nothing new", () => {
    const plan = planToday({ ...base, length: 3, daysAway: 5, dueReview: 10 });
    assert.equal(plan.variant, "comeback");
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["review"],
    );
  });

  it("days away with nothing due is an ordinary day", () => {
    const plan = planToday({ ...base, length: 7, daysAway: 9, dueReview: 0 });
    assert.equal(plan.variant, "regular");
  });

  it("nothing due and nothing new is idle", () => {
    const plan = planToday({ ...base, length: 7, hasNew: false, dueReview: 0 });
    assert.equal(plan.variant, "idle");
    assert.equal(plan.steps.length, 0);
  });

  it("a learner with only review left still gets a review session", () => {
    const plan = planToday({ ...base, length: 7, hasNew: false, dueReview: 6 });
    assert.deepEqual(
      plan.steps.map((step) => step.kind),
      ["review"],
    );
  });

  it("plans all three lengths and defaults the comeback to the short one", () => {
    const plans = planAllLengths({ ...base, dueReview: 4 });
    assert.equal(plans[3].length, 3);
    assert.equal(plans[12].length, 12);
    assert.equal(defaultLengthFor("comeback"), 3);
    assert.equal(defaultLengthFor("regular"), DEFAULT_SESSION_LENGTH);
  });
});

describe("startHref and helpers", () => {
  it("starts on the review when there is one, otherwise on the lesson", () => {
    const next = { id: "stories-3", mode: "stories" };
    assert.equal(
      startHref(planToday({ ...base, length: 7, dueReview: 8 }), next),
      "/learn/session/today?length=7&then=lesson",
    );
    assert.equal(
      startHref(planToday({ ...base, length: 3, dueReview: 8 }), next),
      "/learn/session/today?length=3&then=end",
    );
    assert.equal(
      startHref(planToday({ ...base, length: 7, dueReview: 0 }), next),
      "/learn/stories/stories-3?today=1&length=7",
    );
    assert.equal(startHref(planToday({ ...base, length: 7, hasNew: false }), next), null);
  });

  it("parses a length from the address, defaulting to 7", () => {
    assert.equal(parseSessionLength("12"), 12);
    assert.equal(parseSessionLength("5"), 7);
    assert.equal(parseSessionLength(undefined), 7);
  });

  it("counts whole days between two dates", () => {
    assert.equal(daysBetween("2026-10-18", "2026-10-21"), 3);
    assert.equal(daysBetween("2026-10-21", "2026-10-21"), 0);
  });
});

describe("week dots", () => {
  it("builds the calendar week from Saturday for Arabic (21 Oct 2026 is a Wednesday)", () => {
    const dates = weekDates("2026-10-21", weekStartFor("ar"));
    assert.equal(dates[0], "2026-10-17");
    assert.equal(dates[6], "2026-10-23");
  });

  it("starts on Monday elsewhere", () => {
    const dates = weekDates("2026-10-21", weekStartFor("en"));
    assert.equal(dates[0], "2026-10-19");
    assert.equal(dates[6], "2026-10-25");
  });

  it("lights active days, marks today, and never lights a future day", () => {
    const dots = weekDots(
      new Set(["2026-10-17", "2026-10-19", "2026-10-21", "2026-10-23"]),
      "2026-10-21",
      6,
      (iso) => iso.slice(8),
    );
    assert.deepEqual(
      dots.map((dot) => dot.on),
      [true, false, true, false, true, false, false],
    );
    assert.equal(dots.filter((dot) => dot.today).length, 1);
    assert.equal(dots[4]?.today, true);
  });
});
