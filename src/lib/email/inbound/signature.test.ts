// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { verifyWebhookSignature, WEBHOOK_TOLERANCE_SECONDS } from "./signature";

const SECRET_BYTES = Buffer.from("a-test-signing-key-32-bytes-long!");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;
const NOW_MS = 1_760_000_000_000;
const TIMESTAMP = String(Math.floor(NOW_MS / 1000));
const BODY = JSON.stringify({ type: "email.received", data: { email_id: "e1" } });

function sign(id: string, timestamp: string, body: string, key = SECRET_BYTES): string {
  return `v1,${createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64")}`;
}

function verify(overrides: Partial<Parameters<typeof verifyWebhookSignature>[0]> = {}): boolean {
  return verifyWebhookSignature({
    body: BODY,
    id: "msg_1",
    timestamp: TIMESTAMP,
    signature: sign("msg_1", TIMESTAMP, BODY),
    secret: SECRET,
    now: NOW_MS,
    ...overrides,
  });
}

test("verifyWebhookSignature: accepts a correctly signed delivery", () => {
  assert.equal(verify(), true);
});

test("verifyWebhookSignature: rejects a tampered body", () => {
  assert.equal(verify({ body: BODY.replace("e1", "e2") }), false);
});

test("verifyWebhookSignature: rejects a signature made with a different secret", () => {
  const forged = sign("msg_1", TIMESTAMP, BODY, Buffer.from("some-other-signing-key-of-32-byte"));
  assert.equal(verify({ signature: forged }), false);
});

test("verifyWebhookSignature: accepts any one valid signature in a rotation list", () => {
  const stale = "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  assert.equal(verify({ signature: `${stale} ${sign("msg_1", TIMESTAMP, BODY)}` }), true);
});

test("verifyWebhookSignature: ignores signatures of an unknown version", () => {
  const v2 = sign("msg_1", TIMESTAMP, BODY).replace("v1,", "v2,");
  assert.equal(verify({ signature: v2 }), false);
});

test("verifyWebhookSignature: rejects a timestamp outside the replay window", () => {
  const old = String(Math.floor(NOW_MS / 1000) - WEBHOOK_TOLERANCE_SECONDS - 1);
  assert.equal(verify({ timestamp: old, signature: sign("msg_1", old, BODY) }), false);
});

test("verifyWebhookSignature: rejects missing headers and a missing secret", () => {
  assert.equal(verify({ id: null }), false);
  assert.equal(verify({ timestamp: null }), false);
  assert.equal(verify({ signature: null }), false);
  assert.equal(verify({ secret: "" }), false);
});

test("verifyWebhookSignature: rejects a non-numeric timestamp", () => {
  assert.equal(verify({ timestamp: "yesterday" }), false);
});
