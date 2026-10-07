// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CHECKOUT_GRACE_MS,
  bonusDaysForCheckout,
  isOfferActive,
  offerEndsAt,
  parseLaunchOffer,
  validateLaunchOfferInput,
} from "./launch-offer";

const offer = { bonusDays: 7, endsOn: "2026-11-30" };

test("parseLaunchOffer: a whole number of days and a real date make an offer", () => {
  assert.deepEqual(
    parseLaunchOffer({ launch_offer_bonus_days: 7, launch_offer_ends_on: "2026-11-30" }),
    offer,
  );
});

test("parseLaunchOffer: anything missing, zero, out of range or malformed means no offer", () => {
  const bad = [
    null,
    undefined,
    {},
    { launch_offer_bonus_days: 0, launch_offer_ends_on: "2026-11-30" },
    { launch_offer_bonus_days: 91, launch_offer_ends_on: "2026-11-30" },
    { launch_offer_bonus_days: 7.5, launch_offer_ends_on: "2026-11-30" },
    { launch_offer_bonus_days: "7", launch_offer_ends_on: "2026-11-30" },
    { launch_offer_bonus_days: 7, launch_offer_ends_on: null },
    { launch_offer_bonus_days: 7, launch_offer_ends_on: "2026-02-31" },
    { launch_offer_bonus_days: 7, launch_offer_ends_on: "30/11/2026" },
  ];
  for (const row of bad) assert.equal(parseLaunchOffer(row), null, JSON.stringify(row));
});

test("offerEndsAt: the offer runs through the whole of its last day, UTC", () => {
  assert.equal(offerEndsAt(offer).toISOString(), "2026-12-01T00:00:00.000Z");
});

test("isOfferActive: shown through the end of the last day, not after", () => {
  assert.equal(isOfferActive(offer, new Date("2026-11-30T23:59:59.000Z")), true);
  assert.equal(isOfferActive(offer, new Date("2026-12-01T00:00:00.000Z")), false);
  assert.equal(isOfferActive(null, new Date("2026-11-01T00:00:00.000Z")), false);
});

test("bonusDaysForCheckout: the offer's days while it runs and for a short grace afterwards, then none", () => {
  const end = offerEndsAt(offer).getTime();
  assert.equal(bonusDaysForCheckout(offer, new Date("2026-11-10T09:00:00.000Z")), 7);
  assert.equal(bonusDaysForCheckout(offer, new Date(end + CHECKOUT_GRACE_MS - 1)), 7);
  assert.equal(bonusDaysForCheckout(offer, new Date(end + CHECKOUT_GRACE_MS)), 0);
  assert.equal(bonusDaysForCheckout(null, new Date("2026-11-10T09:00:00.000Z")), 0);
});

test("validateLaunchOfferInput: zero bonus days clears the offer whatever the date says", () => {
  assert.deepEqual(
    validateLaunchOfferInput({ bonusDays: 0, endsOn: "" }, new Date("2026-11-01T10:00:00.000Z")),
    { ok: true, clear: true },
  );
});

test("validateLaunchOfferInput: accepts today up to a year ahead", () => {
  const now = new Date("2026-11-01T10:00:00.000Z");
  assert.deepEqual(validateLaunchOfferInput({ bonusDays: 14, endsOn: "2026-11-01" }, now), {
    ok: true,
    clear: false,
    offer: { bonusDays: 14, endsOn: "2026-11-01" },
  });
  assert.equal(validateLaunchOfferInput({ bonusDays: 14, endsOn: "2027-11-02" }, now).ok, true);
});

test("validateLaunchOfferInput: refuses a bad number of days, a missing, past or far-off date", () => {
  const now = new Date("2026-11-01T10:00:00.000Z");
  for (const input of [
    { bonusDays: -1, endsOn: "2026-11-30" },
    { bonusDays: 91, endsOn: "2026-11-30" },
    { bonusDays: 2.5, endsOn: "2026-11-30" },
    { bonusDays: 7, endsOn: "" },
    { bonusDays: 7, endsOn: "2026-10-31" },
    { bonusDays: 7, endsOn: "2027-11-03" },
  ]) {
    assert.equal(validateLaunchOfferInput(input, now).ok, false, JSON.stringify(input));
  }
});
