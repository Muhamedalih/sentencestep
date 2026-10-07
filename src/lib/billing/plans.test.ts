// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BASE_PLAN_ID,
  BEST_VALUE_PLAN_ID,
  PLANS,
  PLAN_IDS,
  RECOMMENDED_PLAN_ID,
  getPlan,
  isPlanId,
  perMonthCents,
  planPriceCents,
  savingsPercent,
} from "./plans";

test("PLANS: one entry per plan id, in order, with the agreed days", () => {
  assert.deepEqual(
    PLANS.map((plan) => [plan.id, plan.days]),
    [
      ["1m", 30],
      ["3m", 90],
      ["6m", 180],
    ],
  );
  assert.deepEqual(
    PLANS.map((plan) => plan.id),
    [...PLAN_IDS],
  );
});

test("planPriceCents: the agreed USD price of every plan in both tiers", () => {
  assert.deepEqual(
    PLANS.map((plan) => planPriceCents("A", plan.id)),
    [200, 400, 700],
  );
  assert.deepEqual(
    PLANS.map((plan) => planPriceCents("B", plan.id)),
    [300, 600, 1000],
  );
});

test("the recommended and best-value plans are real plans, and the base plan is the shortest", () => {
  assert.equal(getPlan(RECOMMENDED_PLAN_ID).id, "3m");
  assert.equal(getPlan(BEST_VALUE_PLAN_ID).id, "6m");
  assert.equal(getPlan(BASE_PLAN_ID).days, Math.min(...PLANS.map((plan) => plan.days)));
});

test("perMonthCents: the price per 30 days, to the nearest cent", () => {
  assert.deepEqual(
    PLANS.map((plan) => perMonthCents("A", plan.id)),
    [200, 133, 117],
  );
  assert.deepEqual(
    PLANS.map((plan) => perMonthCents("B", plan.id)),
    [300, 200, 167],
  );
});

test("savingsPercent: none for the base plan, the per-day saving for longer ones", () => {
  assert.equal(savingsPercent("A", "1m"), null);
  assert.equal(savingsPercent("A", "3m"), 33);
  assert.equal(savingsPercent("A", "6m"), 42);
  assert.equal(savingsPercent("B", "1m"), null);
  assert.equal(savingsPercent("B", "3m"), 33);
  assert.equal(savingsPercent("B", "6m"), 44);
});

test("every longer plan is cheaper per day than the one before it, in both tiers", () => {
  for (const tier of ["A", "B"] as const) {
    let previous = Infinity;
    for (const plan of PLANS) {
      const perDay = plan.priceUsdCents[tier] / plan.days;
      assert.ok(perDay < previous, `${tier} ${plan.id}`);
      previous = perDay;
    }
  }
});

test("isPlanId: accepts only the known ids, so a form value can never pick a price", () => {
  for (const id of PLAN_IDS) assert.equal(isPlanId(id), true);
  for (const bad of ["", "12m", "1M", " 1m", "constructor", "__proto__", null, undefined, 1, {}]) {
    assert.equal(isPlanId(bad), false, String(bad));
  }
});
