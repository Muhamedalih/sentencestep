// Run with `npm run test:admin`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_EMAIL_MESSAGE_MAX_LENGTH,
  ADMIN_EMAIL_SUBJECT_MAX_LENGTH,
  isPlausibleEmail,
  validateAdminEmailInput,
} from "./email-validation";

test("validateAdminEmailInput: trims the subject and message", () => {
  const result = validateAdminEmailInput({ subject: "  Hello  ", message: "  Hi there \n" });
  assert.deepEqual(result, { ok: true, value: { subject: "Hello", message: "Hi there" } });
});

test("validateAdminEmailInput: line breaks in the subject collapse so they can't reach a mail header", () => {
  const result = validateAdminEmailInput({ subject: "Hi\r\nBcc: x@evil.test", message: "m" });
  assert.ok(result.ok);
  assert.equal(result.value.subject, "Hi Bcc: x@evil.test");
});

test("validateAdminEmailInput: a blank subject or message is rejected", () => {
  assert.equal(validateAdminEmailInput({ subject: "  ", message: "m" }).ok, false);
  assert.equal(validateAdminEmailInput({ subject: "s", message: " \n " }).ok, false);
});

test("validateAdminEmailInput: enforces the length limits", () => {
  assert.equal(
    validateAdminEmailInput({ subject: "a".repeat(ADMIN_EMAIL_SUBJECT_MAX_LENGTH), message: "m" })
      .ok,
    true,
  );
  assert.equal(
    validateAdminEmailInput({
      subject: "a".repeat(ADMIN_EMAIL_SUBJECT_MAX_LENGTH + 1),
      message: "m",
    }).ok,
    false,
  );
  assert.equal(
    validateAdminEmailInput({
      subject: "s",
      message: "a".repeat(ADMIN_EMAIL_MESSAGE_MAX_LENGTH + 1),
    }).ok,
    false,
  );
});

test("isPlausibleEmail: accepts ordinary addresses and rejects obvious non-addresses", () => {
  assert.equal(isPlausibleEmail("learner@example.com"), true);
  assert.equal(isPlausibleEmail("a.b+tag@sub.example.co"), true);
  assert.equal(isPlausibleEmail("no-at-sign"), false);
  assert.equal(isPlausibleEmail("two@@example.com"), false);
  assert.equal(isPlausibleEmail("space in@example.com"), false);
  assert.equal(isPlausibleEmail("a@b"), false);
});
