// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { ORIGIN_AUTH_HEADER, isViaTrustedProxy } from "./trusted-proxy";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";

function headersOf(entries: Record<string, string>) {
  return {
    get(name: string): string | null {
      return entries[name.toLowerCase()] ?? null;
    },
  };
}

test("isViaTrustedProxy: the exact secret in x-origin-auth is trusted", () => {
  assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: SECRET }), SECRET), true);
});

test("isViaTrustedProxy: a missing header is never trusted", () => {
  assert.equal(isViaTrustedProxy(headersOf({}), SECRET), false);
});

test("isViaTrustedProxy: a wrong secret of the same length is not trusted", () => {
  const wrong = "f".repeat(SECRET.length);
  assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: wrong }), SECRET), false);
});

test("isViaTrustedProxy: a different length (prefix, suffix, empty) is not trusted and does not throw", () => {
  for (const presented of [SECRET.slice(0, -1), `${SECRET}x`, "", " "]) {
    assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: presented }), SECRET), false);
  }
});

test("isViaTrustedProxy: with no secret configured nothing is ever trusted, even a matching empty header", () => {
  for (const secret of [undefined, null, ""]) {
    assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: "" }), secret), false);
    assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: "anything" }), secret), false);
  }
});

test("isViaTrustedProxy: a short (guessable) secret is treated as not configured", () => {
  assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: "short" }), "short"), false);
});

test("isViaTrustedProxy: reads the secret from ORIGIN_AUTH_SECRET by default", () => {
  const original = process.env.ORIGIN_AUTH_SECRET;
  try {
    process.env.ORIGIN_AUTH_SECRET = SECRET;
    assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: SECRET })), true);
    assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: "nope" })), false);
    delete process.env.ORIGIN_AUTH_SECRET;
    assert.equal(isViaTrustedProxy(headersOf({ [ORIGIN_AUTH_HEADER]: SECRET })), false);
  } finally {
    if (original === undefined) delete process.env.ORIGIN_AUTH_SECRET;
    else process.env.ORIGIN_AUTH_SECRET = original;
  }
});
