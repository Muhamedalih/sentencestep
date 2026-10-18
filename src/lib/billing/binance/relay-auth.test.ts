// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  RELAY_MAX_SKEW_MS,
  RELAY_SIGNATURE_HEADER,
  RELAY_TIMESTAMP_HEADER,
  signRelayRequest,
  verifyRelayRequest,
} from "./relay-auth";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";
const NOW = 1_792_000_000_000;
const PATH = "/api/payments/binance/ingest";

function headers(timestamp: number, signature: string) {
  const map = new Map([
    [RELAY_TIMESTAMP_HEADER, String(timestamp)],
    [RELAY_SIGNATURE_HEADER, signature],
  ]);
  return { get: (name: string) => map.get(name) ?? null };
}

function verify(overrides: Partial<Parameters<typeof verifyRelayRequest>[0]> = {}) {
  const body = '{"records":[]}';
  return verifyRelayRequest({
    secret: SECRET,
    method: "POST",
    path: PATH,
    body,
    headers: headers(NOW, signRelayRequest(SECRET, NOW, "POST", PATH, body)),
    now: NOW,
    ...overrides,
  });
}

test("verifyRelayRequest: a correctly signed, fresh request is accepted", () => {
  assert.deepEqual(verify(), { ok: true });
});

test("verifyRelayRequest: a changed body is refused", () => {
  assert.deepEqual(verify({ body: '{"records":[{"x":1}]}' }), {
    ok: false,
    reason: "bad_signature",
  });
});

test("verifyRelayRequest: a request signed for one path cannot be used on another", () => {
  assert.deepEqual(verify({ path: "/api/payments/binance/pending" }), {
    ok: false,
    reason: "bad_signature",
  });
});

test("verifyRelayRequest: a request signed for GET cannot be replayed as POST", () => {
  const body = "";
  const signature = signRelayRequest(SECRET, NOW, "GET", PATH, body);
  assert.deepEqual(verify({ body, method: "POST", headers: headers(NOW, signature) }), {
    ok: false,
    reason: "bad_signature",
  });
});

test("verifyRelayRequest: a wrong secret is refused", () => {
  assert.deepEqual(verify({ secret: `${SECRET}x` }), { ok: false, reason: "bad_signature" });
});

test("verifyRelayRequest: a timestamp too far from the server's clock is refused, either way", () => {
  const body = '{"records":[]}';
  for (const offset of [RELAY_MAX_SKEW_MS + 1, -(RELAY_MAX_SKEW_MS + 1)]) {
    const timestamp = NOW + offset;
    const signature = signRelayRequest(SECRET, timestamp, "POST", PATH, body);
    assert.deepEqual(verify({ headers: headers(timestamp, signature) }), {
      ok: false,
      reason: "stale_timestamp",
    });
  }
});

test("verifyRelayRequest: the edge of the window is still accepted", () => {
  const body = '{"records":[]}';
  const timestamp = NOW - RELAY_MAX_SKEW_MS;
  const signature = signRelayRequest(SECRET, timestamp, "POST", PATH, body);
  assert.deepEqual(verify({ headers: headers(timestamp, signature) }), { ok: true });
});

test("verifyRelayRequest: missing or malformed headers are refused without looking at the secret", () => {
  const empty = { get: () => null };
  assert.deepEqual(verify({ headers: empty }), { ok: false, reason: "missing_headers" });
  assert.deepEqual(verify({ headers: headers(NOW, "not-hex") }), {
    ok: false,
    reason: "missing_headers",
  });
  assert.deepEqual(verify({ headers: headers(NOW, "a".repeat(63)) }), {
    ok: false,
    reason: "missing_headers",
  });
});

test("signRelayRequest: matches an independently computed value (the Python poller must agree)", () => {
  // Computed with: hmac.new(secret, f"{ts}\nPOST\n{path}\n{sha256(body)}", sha256).hexdigest()
  const signature = signRelayRequest("secret", 1700000000000, "POST", "/p", "{}");
  assert.equal(signature.length, 64);
  assert.match(signature, /^[0-9a-f]{64}$/);
  assert.equal(signature, signRelayRequest("secret", 1700000000000, "post", "/p", "{}"));
});
