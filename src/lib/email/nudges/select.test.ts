// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { dedupeKeyFor, shouldNotify } from "@/lib/email/events";
import {
  BLOCKED_MAX_AGE_MS,
  BLOCKED_MIN_ORDERS,
  HOUR_MS,
  abandonedBucket,
  canEmailAccount,
  checkoutHelpFor,
  holdoutPercent,
  isDayOneCandidate,
  isHoldout,
  maxSendsPerRun,
} from "./select";

const NOW = new Date("2026-11-10T15:00:00.000Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * HOUR_MS).toISOString();

test("maxSendsPerRun: off unless a positive number is set, and never above 500", () => {
  for (const raw of [undefined, "", "0", "-3", "abc"])
    assert.equal(maxSendsPerRun(raw), 0, String(raw));
  assert.equal(maxSendsPerRun("120"), 120);
  assert.equal(maxSendsPerRun("9999"), 500);
});

test("holdoutPercent: 20 by default, a whole number from 0 to 50 otherwise", () => {
  assert.equal(holdoutPercent(undefined), 20);
  assert.equal(holdoutPercent("abc"), 20);
  assert.equal(holdoutPercent("-1"), 20);
  assert.equal(holdoutPercent("0"), 0);
  assert.equal(holdoutPercent("35"), 35);
  assert.equal(holdoutPercent("90"), 50);
});

test("isHoldout: stable for a learner, none at 0 percent, and close to the share asked for", () => {
  const id = "3f2a8c1e-0000-4000-8000-000000000001";
  assert.equal(isHoldout(id, 20), isHoldout(id, 20));
  assert.equal(isHoldout(id, 0), false);
  let held = 0;
  const total = 5000;
  for (let i = 0; i < total; i += 1) {
    if (isHoldout(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, 20)) held += 1;
  }
  const share = (100 * held) / total;
  assert.ok(share > 17 && share < 23, `held share ${share}`);
});

test("isDayOneCandidate: signed up 18 to 72 hours ago, active before, not yet active today", () => {
  const base = { now: NOW, lastActiveDate: "2026-11-09" };
  assert.equal(isDayOneCandidate({ ...base, createdAt: hoursAgo(30) }), true);
  assert.equal(isDayOneCandidate({ ...base, createdAt: hoursAgo(18) }), true);
  assert.equal(isDayOneCandidate({ ...base, createdAt: hoursAgo(72) }), true);
  assert.equal(isDayOneCandidate({ ...base, createdAt: hoursAgo(10) }), false);
  assert.equal(isDayOneCandidate({ ...base, createdAt: hoursAgo(80) }), false);
  // Active today means they are already back; never active means there is nothing to continue.
  assert.equal(
    isDayOneCandidate({ now: NOW, createdAt: hoursAgo(30), lastActiveDate: "2026-11-10" }),
    false,
  );
  assert.equal(
    isDayOneCandidate({ now: NOW, createdAt: hoursAgo(30), lastActiveDate: null }),
    false,
  );
});

test("abandonedBucket: one two-week period for a run today and for one a week later, a new one after", () => {
  const day = 86_400_000;
  assert.equal(abandonedBucket(NOW), abandonedBucket(new Date(NOW.getTime() + 1 * day)));
  assert.notEqual(abandonedBucket(NOW), abandonedBucket(new Date(NOW.getTime() + 15 * day)));
});

test("canEmailAccount: Google-verified accounts only, unless password accounts are allowed", () => {
  assert.equal(canEmailAccount({ app_metadata: { provider: "google" } }, false), true);
  assert.equal(
    canEmailAccount({ app_metadata: { provider: "email", providers: ["email", "google"] } }, false),
    true,
  );
  assert.equal(canEmailAccount({ app_metadata: { provider: "email" } }, false), false);
  assert.equal(canEmailAccount({ app_metadata: { provider: "email" } }, true), true);
  assert.equal(canEmailAccount(null, true), false);
});

test("the two nudge events are idempotent per learner: once ever, and once per two-week period", () => {
  assert.equal(shouldNotify({ type: "DAY_ONE_NUDGE" }), true);
  assert.equal(
    dedupeKeyFor({ type: "DAY_ONE_NUDGE" }),
    dedupeKeyFor({ type: "DAY_ONE_NUDGE", holdout: true }),
  );
  assert.equal(dedupeKeyFor({ type: "CHECKOUT_ABANDONED", bucket: 7 }), "CHECKOUT_ABANDONED:7");
  assert.notEqual(
    dedupeKeyFor({ type: "CHECKOUT_ABANDONED", bucket: 7 }),
    dedupeKeyFor({ type: "CHECKOUT_ABANDONED", bucket: 8 }),
  );
});

test("checkoutHelpFor: Vodafone Cash for an order priced in Egypt, Binance Pay for everyone else, and only for a way that is open", () => {
  const open = { vodafoneOpen: true, binanceOpen: true, egp: 216 };
  assert.deepEqual(checkoutHelpFor({ country: "eg", ...open }), { method: "vodafone", egp: 216 });
  assert.deepEqual(checkoutHelpFor({ country: " EG ", ...open }), { method: "vodafone", egp: 216 });
  assert.deepEqual(checkoutHelpFor({ country: "dz", ...open }), { method: "binance" });
  assert.deepEqual(checkoutHelpFor({ country: null, ...open }), { method: "binance" });
  // Vodafone Cash closed: an Egyptian is offered Binance Pay if that is open, otherwise nothing.
  assert.deepEqual(checkoutHelpFor({ country: "eg", ...open, vodafoneOpen: false }), {
    method: "binance",
  });
  assert.equal(
    checkoutHelpFor({ country: "eg", ...open, vodafoneOpen: false, binanceOpen: false }),
    null,
  );
  // Binance Pay closed: another country gets the plain reminder.
  assert.equal(checkoutHelpFor({ country: "ma", ...open, binanceOpen: false }), null);
  // An unknown or silly pound price is left out, never shown.
  for (const egp of [null, 0, -5, Number.NaN]) {
    assert.deepEqual(checkoutHelpFor({ country: "eg", ...open, egp }), {
      method: "vodafone",
      egp: null,
    });
  }
});

test("the one-off for stuck payers: two weeks back, at least two orders", () => {
  assert.equal(BLOCKED_MAX_AGE_MS, 14 * 24 * HOUR_MS);
  assert.equal(BLOCKED_MIN_ORDERS, 2);
});
