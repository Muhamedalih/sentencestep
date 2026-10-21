import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";

import { signRolloutPreview, verifyRolloutPreview } from "./preview";

const original = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret-key";
});

afterEach(() => {
  if (original === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = original;
});

const NOW = Date.UTC(2026, 9, 21, 12, 0, 0);
const DAY = 86_400_000;

test("a cookie we signed verifies until it runs out", () => {
  const value = signRolloutPreview(NOW + 7 * DAY);
  assert.ok(value);
  assert.equal(verifyRolloutPreview(value, NOW), true);
  assert.equal(verifyRolloutPreview(value, NOW + 6 * DAY), true);
  assert.equal(verifyRolloutPreview(value, NOW + 7 * DAY), false);
  assert.equal(verifyRolloutPreview(value, NOW + 8 * DAY), false);
});

test("a cookie with a changed expiry or signature is rejected", () => {
  const value = signRolloutPreview(NOW + DAY)!;
  const [, signature] = value.split(".");
  assert.equal(verifyRolloutPreview(`${NOW + 30 * DAY}.${signature}`, NOW), false);
  assert.equal(verifyRolloutPreview(`${NOW + DAY}.${"0".repeat(64)}`, NOW), false);
  assert.equal(verifyRolloutPreview(`${NOW + DAY}.abc`, NOW), false);
});

test("anything that is not a signed cookie is rejected", () => {
  assert.equal(verifyRolloutPreview(undefined, NOW), false);
  assert.equal(verifyRolloutPreview(null, NOW), false);
  assert.equal(verifyRolloutPreview("", NOW), false);
  assert.equal(verifyRolloutPreview("true", NOW), false);
  assert.equal(verifyRolloutPreview(".abc", NOW), false);
  assert.equal(verifyRolloutPreview("x.abc", NOW), false);
});

test("a cookie signed with another key is rejected", () => {
  const value = signRolloutPreview(NOW + DAY)!;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "a-different-key";
  assert.equal(verifyRolloutPreview(value, NOW), false);
});
