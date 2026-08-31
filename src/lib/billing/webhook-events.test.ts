import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyExistingWebhookEvent } from "./webhook-events";

test("classifyExistingWebhookEvent: a row with processed_at set is a genuine duplicate — skip it", () => {
  assert.equal(classifyExistingWebhookEvent("2026-08-27T00:00:00.000Z"), "already-processed");
});

test("classifyExistingWebhookEvent: a row with processed_at still null means a prior delivery recorded it but never finished — retry", () => {
  assert.equal(classifyExistingWebhookEvent(null), "retry");
});
