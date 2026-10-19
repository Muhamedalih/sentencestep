// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildGatePay } from "./gate-pay";

const NOW = new Date("2026-11-10T09:00:00.000Z");

test("buildGatePay: no offer means no offer row, and an ended offer is not shown", () => {
  assert.equal(buildGatePay({ offer: null, now: NOW }).offer, null);
  assert.equal(
    buildGatePay({ offer: { bonusDays: 7, endsOn: "2026-11-01" }, now: NOW }).offer,
    null,
  );
});

test("buildGatePay: a running offer carries its days per plan, and one shared number only when they match", () => {
  const same = buildGatePay({ offer: { bonusDays: 7, endsOn: "2026-12-01" }, now: NOW });
  assert.deepEqual(same.offer, { byPlan: { "1m": 7, "3m": 7, "6m": 7 }, shared: 7 });

  const differ = buildGatePay({
    offer: { bonusDays: 7, planBonusDays: { "3m": 10, "6m": 15 }, endsOn: "2026-12-01" },
    now: NOW,
  });
  assert.deepEqual(differ.offer, { byPlan: { "1m": 7, "3m": 10, "6m": 15 }, shared: null });
});
