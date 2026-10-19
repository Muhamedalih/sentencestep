// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { signAwsRequest } from "./aws-sigv4";

// AWS's own published example ("get-vanilla" in the Signature Version 4 test suite): a GET of / with
// only the two headers every request carries. If this signature matches, the canonical request, the
// string to sign and the four-step key derivation are all right.
const KEY = {
  accessKeyId: "AKIDEXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
};
const NOW = new Date("2015-08-30T12:36:00.000Z");

test("signAwsRequest: reproduces AWS's published get-vanilla signature", () => {
  const out = signAwsRequest({
    method: "GET",
    url: "https://example.amazonaws.com/",
    region: "us-east-1",
    service: "service",
    now: NOW,
    ...KEY,
  });
  assert.equal(out.signature, "5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31");
  assert.equal(
    out.headers.authorization,
    "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=host;x-amz-date, Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31",
  );
  assert.equal(out.headers["x-amz-date"], "20150830T123600Z");
});

test("signAwsRequest: a body and a content-type header change the signature and are signed", () => {
  const plain = signAwsRequest({
    method: "POST",
    url: "https://example.amazonaws.com/",
    region: "us-east-1",
    service: "service",
    now: NOW,
    ...KEY,
  });
  const withBody = signAwsRequest({
    method: "POST",
    url: "https://example.amazonaws.com/",
    region: "us-east-1",
    service: "service",
    headers: { "Content-Type": "application/json" },
    body: '{"a":1}',
    now: NOW,
    ...KEY,
  });
  assert.notEqual(plain.signature, withBody.signature);
  assert.match(withBody.headers.authorization!, /SignedHeaders=content-type;host;x-amz-date,/);
});

test("signAwsRequest: query parameters are sorted before signing", () => {
  const a = signAwsRequest({
    method: "GET",
    url: "https://example.amazonaws.com/?b=2&a=1",
    region: "us-east-1",
    service: "service",
    now: NOW,
    ...KEY,
  });
  const b = signAwsRequest({
    method: "GET",
    url: "https://example.amazonaws.com/?a=1&b=2",
    region: "us-east-1",
    service: "service",
    now: NOW,
    ...KEY,
  });
  assert.equal(a.signature, b.signature);
});
