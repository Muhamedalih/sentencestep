// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MAX_ORDERS_PER_PERSON_PER_DAY } from "./constants";
import { orderLimitReason } from "./limits";

test("orderLimitReason: a learner may open orders until their own daily limit of five", () => {
  assert.equal(MAX_ORDERS_PER_PERSON_PER_DAY, 5);
  for (const own of [0, 1, 4]) {
    assert.equal(
      orderLimitReason({
        dailyOrderCap: 200,
        ordersInLastDay: 3,
        ordersByThisLearnerInLastDay: own,
      }),
      null,
      `${own} orders so far`,
    );
  }
  for (const own of [5, 6, 50]) {
    assert.equal(
      orderLimitReason({
        dailyOrderCap: 200,
        ordersInLastDay: 3,
        ordersByThisLearnerInLastDay: own,
      }),
      "personal_limit",
      `${own} orders so far`,
    );
  }
});

test("orderLimitReason: the daily limit for everyone pauses the button, and 0 pauses it outright", () => {
  assert.equal(
    orderLimitReason({ dailyOrderCap: 200, ordersInLastDay: 199, ordersByThisLearnerInLastDay: 0 }),
    null,
  );
  assert.equal(
    orderLimitReason({ dailyOrderCap: 200, ordersInLastDay: 200, ordersByThisLearnerInLastDay: 0 }),
    "paused_today",
  );
  assert.equal(
    orderLimitReason({ dailyOrderCap: 0, ordersInLastDay: 0, ordersByThisLearnerInLastDay: 0 }),
    "paused_today",
  );
});

test("orderLimitReason: when the button is paused for everyone that is what a learner is told, even at their own limit", () => {
  assert.equal(
    orderLimitReason({ dailyOrderCap: 10, ordersInLastDay: 10, ordersByThisLearnerInLastDay: 5 }),
    "paused_today",
  );
});
