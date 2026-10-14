// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { clientIpFrom } from "./client-ip";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";

function headersOf(entries: Record<string, string>) {
  return {
    get(name: string): string | null {
      return entries[name.toLowerCase()] ?? null;
    },
  };
}

function withSecret<T>(secret: string | undefined, run: () => T): T {
  const original = process.env.ORIGIN_AUTH_SECRET;
  try {
    if (secret === undefined) delete process.env.ORIGIN_AUTH_SECRET;
    else process.env.ORIGIN_AUTH_SECRET = secret;
    return run();
  } finally {
    if (original === undefined) delete process.env.ORIGIN_AUTH_SECRET;
    else process.env.ORIGIN_AUTH_SECRET = original;
  }
}

test("clientIpFrom: behind the proxy (secret stamp present) the cf-connecting-ip is used", () => {
  const headers = headersOf({
    "x-origin-auth": SECRET,
    "cf-connecting-ip": "203.0.113.7",
    "x-forwarded-for": "198.51.100.1, 172.70.0.1",
  });
  assert.equal(
    withSecret(SECRET, () => clientIpFrom(headers)),
    "203.0.113.7",
  );
});

test("clientIpFrom: a forged cf-connecting-ip without the stamp is ignored", () => {
  const headers = headersOf({
    "cf-connecting-ip": "203.0.113.7",
    "x-forwarded-for": "198.51.100.1",
  });
  assert.equal(
    withSecret(SECRET, () => clientIpFrom(headers)),
    "198.51.100.1",
  );
});

test("clientIpFrom: with no secret configured it is the first x-forwarded-for entry, as before", () => {
  const headers = headersOf({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" });
  assert.equal(
    withSecret(undefined, () => clientIpFrom(headers)),
    "198.51.100.1",
  );
});

test("clientIpFrom: a stamped request without cf-connecting-ip falls back to x-forwarded-for", () => {
  const headers = headersOf({ "x-origin-auth": SECRET, "x-forwarded-for": "198.51.100.1" });
  assert.equal(
    withSecret(SECRET, () => clientIpFrom(headers)),
    "198.51.100.1",
  );
});

test("clientIpFrom: no usable header at all is 'unknown'", () => {
  assert.equal(
    withSecret(SECRET, () => clientIpFrom(headersOf({}))),
    "unknown",
  );
  assert.equal(
    withSecret(SECRET, () => clientIpFrom(headersOf({ "x-forwarded-for": " " }))),
    "unknown",
  );
});
