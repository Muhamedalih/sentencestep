// Run with `npm run test:billing` (also part of `npm test`).

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildGateLean, giftPill } from "./gate-lean";
import type { GatePay } from "./gate-pay";

const offer = (
  byPlan: { "1m": number; "3m": number; "6m": number },
  shared: number | null,
): GatePay => ({
  offer: { byPlan, shared },
});

test("the lean card is off for everyone the permission has not reached", () => {
  assert.equal(
    buildGateLean({
      access: { leanGate: false, libraryGift: true },
      proof: { learners: 9200, lessons: null },
      ratings: { average: 4.8, count: 1100 },
      locale: "ar",
    }),
    null,
  );
});

test("the sealed-section card needs its own permission as well", () => {
  const base = {
    proof: { learners: null, lessons: null },
    ratings: null,
    locale: null,
  };
  assert.equal(
    buildGateLean({ ...base, access: { leanGate: true, libraryGift: false } })?.gift,
    false,
  );
  assert.equal(
    buildGateLean({ ...base, access: { leanGate: true, libraryGift: true } })?.gift,
    true,
  );
});

test("the proof figures are only the real ones, formatted for the language", () => {
  const lean = buildGateLean({
    access: { leanGate: true, libraryGift: false },
    proof: { learners: 9200, lessons: 19000 },
    ratings: { average: 4.8, count: 1100 },
    locale: null,
  });
  assert.equal(lean?.learners, "9,200");
  assert.equal(lean?.rating, "4.8");
  const none = buildGateLean({
    access: { leanGate: true, libraryGift: false },
    proof: { learners: null, lessons: null },
    ratings: null,
    locale: "ar",
  });
  assert.equal(none?.learners, null);
  assert.equal(none?.rating, null);
});

test("no running offer means no gift mark", () => {
  assert.equal(giftPill({ offer: null }), null);
  assert.equal(giftPill(offer({ "1m": 0, "3m": 0, "6m": 0 }, null)), null);
});

test("one number for every plan is quoted as it is", () => {
  assert.deepEqual(giftPill(offer({ "1m": 7, "3m": 7, "6m": 7 }, 7)), { days: 7, upTo: false });
});

test("different numbers per plan are quoted as up to the largest", () => {
  assert.deepEqual(giftPill(offer({ "1m": 7, "3m": 10, "6m": 15 }, null)), {
    days: 15,
    upTo: true,
  });
});
