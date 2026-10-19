// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isUserId,
  unsubscribeLinks,
  unsubscribeToken,
  verifyUnsubscribeToken,
} from "./unsubscribe-token";

const USER = "3f0c2f6e-9a53-4d6e-8d1c-1b7d2d6f0a11";
const OTHER = "5a1d9c70-2b7e-4f0a-9b1e-7c3d4e5f6a22";
const SECRET = "test-secret-value";

test("unsubscribe: a token made for a learner verifies for that learner only", () => {
  const token = unsubscribeToken(USER, SECRET);
  assert.equal(verifyUnsubscribeToken(USER, token, SECRET), true);
  assert.equal(verifyUnsubscribeToken(OTHER, token, SECRET), false);
});

test("unsubscribe: a different secret, a changed token, or missing parts never verify", () => {
  const token = unsubscribeToken(USER, SECRET);
  assert.equal(verifyUnsubscribeToken(USER, token, "another-secret"), false);
  assert.equal(verifyUnsubscribeToken(USER, `${token.slice(0, -1)}x`, SECRET), false);
  assert.equal(verifyUnsubscribeToken(USER, "", SECRET), false);
  assert.equal(verifyUnsubscribeToken(USER, null, SECRET), false);
  assert.equal(verifyUnsubscribeToken(null, token, SECRET), false);
  assert.equal(verifyUnsubscribeToken(USER, token, undefined), false);
  assert.equal(verifyUnsubscribeToken("not-a-uuid", token, SECRET), false);
});

test("unsubscribe: the id is case-insensitive and only ids are accepted", () => {
  const token = unsubscribeToken(USER, SECRET);
  assert.equal(verifyUnsubscribeToken(USER.toUpperCase(), token, SECRET), true);
  assert.equal(isUserId(USER), true);
  assert.equal(isUserId("../../etc"), false);
  assert.equal(isUserId(""), false);
});

test("unsubscribe: the links point at this site and carry the one-click headers", () => {
  const links = unsubscribeLinks("https://sentencestep.com", USER, SECRET);
  assert.ok(links);
  assert.match(links.pageUrl, /^https:\/\/sentencestep\.com\/unsubscribe\?u=3f0c2f6e-/);
  assert.match(
    links.headers["List-Unsubscribe"]!,
    /^<https:\/\/sentencestep\.com\/api\/email\/unsubscribe\?u=/,
  );
  assert.equal(links.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.equal(unsubscribeLinks("https://sentencestep.com", USER, undefined), null);
});
