// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { describeProviderError } from "./provider-error";

test("describeProviderError: shows Resend's status, error name and message", () => {
  const error = new Error(
    `Resend API error (422): ${JSON.stringify({ statusCode: 422, name: "validation_error", message: "Invalid `reply_to` field." })}`,
  );
  assert.equal(
    describeProviderError(error),
    "Resend rejected the message (422 validation_error): Invalid `reply_to` field.",
  );
});

test("describeProviderError: handles a non-JSON error body", () => {
  assert.equal(
    describeProviderError(new Error("Resend API error (401): invalid api key")),
    "Resend rejected the message (401): invalid api key",
  );
});

test("describeProviderError: a long provider message is cut short", () => {
  const long = "x".repeat(500);
  const text = describeProviderError(new Error(`Resend API error (500): ${long}`));
  assert.ok(text.length < 300);
  assert.ok(text.endsWith("…"));
});

test("describeProviderError: a network failure gets a generic line, not a stack trace", () => {
  const text = describeProviderError(new TypeError("fetch failed"));
  assert.equal(text, "The email couldn't be sent: fetch failed");
});

test("describeProviderError: copes with a thrown non-Error", () => {
  assert.equal(describeProviderError("boom"), "The email couldn't be sent: boom");
});
