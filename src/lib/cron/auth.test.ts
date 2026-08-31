import { test } from "node:test";
import assert from "node:assert/strict";

import { isValidCronAuth } from "./auth";

test("isValidCronAuth: the exact matching bearer token is accepted", () => {
  assert.equal(isValidCronAuth("Bearer real-secret", "real-secret"), true);
});

test("isValidCronAuth: the wrong token is rejected", () => {
  assert.equal(isValidCronAuth("Bearer wrong-secret", "real-secret"), false);
});

test("isValidCronAuth: a missing Authorization header is rejected", () => {
  assert.equal(isValidCronAuth("", "real-secret"), false);
});

test("isValidCronAuth: missing the Bearer prefix is rejected", () => {
  assert.equal(isValidCronAuth("real-secret", "real-secret"), false);
});

test("isValidCronAuth: a header that's merely a prefix or suffix of the real value is rejected", () => {
  // Exercises the length-mismatch short-circuit before timingSafeEqual runs,
  // which would otherwise throw on unequal buffer lengths.
  assert.equal(isValidCronAuth("Bearer real-secre", "real-secret"), false);
  assert.equal(isValidCronAuth("Bearer real-secrets", "real-secret"), false);
});

test("isValidCronAuth: case-sensitive — a differently-cased secret is rejected", () => {
  assert.equal(isValidCronAuth("Bearer Real-Secret", "real-secret"), false);
});
