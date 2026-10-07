// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildPlanViews, cheapestPerMonth } from "./plan-views";

test("buildPlanViews: Tier A shows $2, $4 and $7 with their per-month and saving figures", () => {
  assert.deepEqual(buildPlanViews("A"), [
    {
      id: "1m",
      days: 30,
      price: "$2",
      perMonth: "$2.00",
      perDay: "$0.07",
      savingsPercent: null,
      badge: null,
      preselected: false,
    },
    {
      id: "3m",
      days: 90,
      price: "$4",
      perMonth: "$1.33",
      perDay: "$0.04",
      savingsPercent: 33,
      badge: "recommended",
      preselected: true,
    },
    {
      id: "6m",
      days: 180,
      price: "$7",
      perMonth: "$1.17",
      perDay: "$0.04",
      savingsPercent: 42,
      badge: "best-value",
      preselected: false,
    },
  ]);
});

test("buildPlanViews: Tier B shows $3, $6 and $10", () => {
  const views = buildPlanViews("B");
  assert.deepEqual(
    views.map((view) => [view.price, view.perMonth, view.savingsPercent]),
    [
      ["$3", "$3.00", null],
      ["$6", "$2.00", 33],
      ["$10", "$1.67", 44],
    ],
  );
});

test("buildPlanViews: exactly one plan is pre-selected and it carries the recommended badge", () => {
  for (const tier of ["A", "B"] as const) {
    const selected = buildPlanViews(tier).filter((view) => view.preselected);
    assert.equal(selected.length, 1);
    assert.equal(selected[0]!.badge, "recommended");
  }
});

test("buildPlanViews: shows dollars only", () => {
  for (const tier of ["A", "B"] as const) {
    for (const view of buildPlanViews(tier)) {
      for (const text of [view.price, view.perMonth, view.perDay]) {
        assert.match(text, /^\$\d+(\.\d{2})?$/);
      }
    }
  }
});

test("cheapestPerMonth: the longest plan's monthly price in each tier", () => {
  assert.equal(cheapestPerMonth("A"), "$1.17");
  assert.equal(cheapestPerMonth("B"), "$1.67");
});
