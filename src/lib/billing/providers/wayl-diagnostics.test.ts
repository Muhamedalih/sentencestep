// Run with `npm run test:billing`.

import { createHmac } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";

import { summarizeWaylWebhookAttempt } from "./wayl-diagnostics";

const SECRET = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

const BODY = JSON.stringify({
  verb: "POST",
  event: "order.created",
  referenceId: "ss_123",
  paymentStatus: "Complete",
  paymentMethod: "card",
  total: 2640,
  customer: { name: "Test Person", phone: "+9647700000000", city: "Kirkuk" },
});

function sign(message: string, key: string | Buffer, encoding: "hex" | "base64"): string {
  return createHmac("sha256", key).update(message).digest(encoding);
}

function summarize(body: string, signature: string | null, status = 200) {
  const headers = new Headers({ "content-type": "text/plain", "user-agent": "wayl-test" });
  if (signature !== null) headers.set("x-wayl-signature-256", signature);
  return summarizeWaylWebhookAttempt({
    status,
    rawBody: new TextEncoder().encode(body),
    headers,
    secret: SECRET,
  });
}

test("a signature over the raw body, in hex, is recognised", () => {
  const summary = summarize(BODY, sign(BODY, SECRET, "hex"));
  assert.equal(summary.signatureMatch, "key=utf8 message=raw encoding=hex");
  assert.deepEqual(summary.signature, {
    present: true,
    length: 64,
    hex: true,
    base64: true,
    prefixed: false,
  });
});

test("a base64 signature with a sha256= prefix is recognised", () => {
  const summary = summarize(BODY, `sha256=${sign(BODY, SECRET, "base64")}`);
  assert.equal(summary.signatureMatch, "key=utf8 message=raw encoding=base64");
  assert.equal(summary.signature.prefixed, true);
});

test("a signature over the re-serialised JSON is recognised, so a different body layout can be spotted", () => {
  const pretty = JSON.stringify(JSON.parse(BODY), null, 2);
  const summary = summarize(pretty, sign(BODY, SECRET, "hex"));
  assert.equal(summary.signatureMatch, "key=utf8 message=reserialized encoding=hex");
});

test("a signature made with the secret decoded from hex is recognised", () => {
  const summary = summarize(BODY, sign(BODY, Buffer.from(SECRET, "hex"), "hex"));
  assert.equal(summary.signatureMatch, "key=hexbytes message=raw encoding=hex");
});

test("a signature that no scheme reproduces matches nothing", () => {
  const summary = summarize(BODY, "deadbeef".repeat(8));
  assert.equal(summary.signatureMatch, null);
  assert.equal(summary.signature.present, true);
});

test("a delivery with no signature header is reported as such", () => {
  const summary = summarize(BODY, null);
  assert.equal(summary.signature.present, false);
  assert.equal(summary.signatureMatch, null);
  assert.ok(summary.headerNames.includes("content-type"));
});

test("the summary names the body's fields but keeps no secret, signature or personal value", () => {
  const signature = sign(BODY, SECRET, "hex");
  const summary = summarize(BODY, signature, 401);
  const text = JSON.stringify(summary);

  assert.equal(summary.status, 401);
  assert.deepEqual(summary.body.customerKeys, ["city", "name", "phone"]);
  assert.ok(summary.body.keys.includes("customer"));
  assert.deepEqual(summary.body.values, {
    verb: "POST",
    event: "order.created",
    paymentStatus: "Complete",
    paymentMethod: "card",
  });
  for (const secretValue of [SECRET, signature, "Test Person", "+9647700000000", "Kirkuk"]) {
    assert.equal(text.includes(secretValue), false, secretValue);
  }
});

test("a body that is not a JSON object is reported without keys", () => {
  const summary = summarize("not json", sign("not json", SECRET, "hex"));
  assert.equal(summary.body.json, false);
  assert.deepEqual(summary.body.keys, []);
  assert.equal(summary.signatureMatch, "key=utf8 message=raw encoding=hex");
});
