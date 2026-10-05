// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { freeForAllAppliesTo, parseExcludedEmails } from "./free-access";

test("parseExcludedEmails: nothing set means an empty list", () => {
  assert.equal(parseExcludedEmails(undefined).size, 0);
  assert.equal(parseExcludedEmails("").size, 0);
  assert.equal(parseExcludedEmails(" , ;\n ").size, 0);
});

test("parseExcludedEmails: splits on commas, semicolons and whitespace and lowercases", () => {
  const parsed = parseExcludedEmails(
    " Tester@Example.com,second@example.com;\nthird@example.com  ",
  );
  assert.deepEqual([...parsed].sort(), [
    "second@example.com",
    "tester@example.com",
    "third@example.com",
  ]);
});

test("freeForAllAppliesTo: with the promotion off it never applies", () => {
  assert.equal(freeForAllAppliesTo(false, "tester@example.com", undefined), false);
  assert.equal(freeForAllAppliesTo(false, null, "tester@example.com"), false);
});

test("freeForAllAppliesTo: with the promotion on and no list it applies to everyone", () => {
  assert.equal(freeForAllAppliesTo(true, "tester@example.com", undefined), true);
  assert.equal(freeForAllAppliesTo(true, "tester@example.com", ""), true);
  assert.equal(freeForAllAppliesTo(true, null, undefined), true);
});

test("freeForAllAppliesTo: a listed email is exempt, whatever its case or surrounding space", () => {
  const list = "tester@example.com, other@example.com";
  assert.equal(freeForAllAppliesTo(true, "tester@example.com", list), false);
  assert.equal(freeForAllAppliesTo(true, "TESTER@Example.COM", list), false);
  assert.equal(freeForAllAppliesTo(true, "  other@example.com ", list), false);
});

test("freeForAllAppliesTo: only an exact match is exempt, so everyone else keeps the promotion", () => {
  const list = "tester@example.com";
  assert.equal(freeForAllAppliesTo(true, "someone@example.com", list), true);
  assert.equal(freeForAllAppliesTo(true, "atester@example.com", list), true);
  assert.equal(freeForAllAppliesTo(true, "tester@example.com.evil.test", list), true);
  assert.equal(freeForAllAppliesTo(true, "tester+1@example.com", list), true);
});

test("freeForAllAppliesTo: a signed-out visitor, or one with no email, keeps the promotion", () => {
  const list = "tester@example.com";
  assert.equal(freeForAllAppliesTo(true, null, list), true);
  assert.equal(freeForAllAppliesTo(true, undefined, list), true);
  assert.equal(freeForAllAppliesTo(true, "", list), true);
  assert.equal(freeForAllAppliesTo(true, "   ", list), true);
});
