// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { adminMessageEmail } from "./admin-message";

const ORIGIN = "https://sentencestep.example";

test("adminMessageEmail: uses the subject as both the email subject and heading", () => {
  const email = adminMessageEmail({
    origin: ORIGIN,
    subject: "Re: your report",
    message: "Fixed.",
  });
  assert.equal(email.subject, "Re: your report");
  assert.ok(email.html.includes("<h1"));
  assert.ok(email.html.includes("Re: your report"));
});

test("adminMessageEmail: HTML in the message is escaped, never rendered", () => {
  const email = adminMessageEmail({
    origin: ORIGIN,
    subject: "s",
    message: `<script>alert(1)</script> & "quoted"`,
  });
  assert.ok(!email.html.includes("<script>"));
  assert.ok(email.html.includes("&lt;script&gt;"));
  assert.ok(email.html.includes("&amp;"));
});

test("adminMessageEmail: blank lines become paragraphs and single newlines become <br />", () => {
  const email = adminMessageEmail({
    origin: ORIGIN,
    subject: "s",
    message: "First line\nsecond line\n\nNew paragraph",
  });
  assert.equal((email.html.match(/<p dir="auto"/g) ?? []).length, 2);
  assert.ok(email.html.includes("First line<br />second line"));
});

test("adminMessageEmail: Windows line endings are treated like Unix ones", () => {
  const email = adminMessageEmail({ origin: ORIGIN, subject: "s", message: "A\r\n\r\nB" });
  assert.equal((email.html.match(/<p dir="auto"/g) ?? []).length, 2);
});

test("adminMessageEmail: an Arabic message keeps dir=auto so it renders right-to-left", () => {
  const email = adminMessageEmail({
    origin: ORIGIN,
    subject: "رد على تبليغك",
    message: "مرحباً، تم حل المشكلة.",
  });
  assert.ok(email.html.includes("مرحباً، تم حل المشكلة."));
  assert.ok(email.html.includes('<h1 dir="auto"'));
  assert.ok(email.html.includes('<p dir="auto"'));
});

test("adminMessageEmail: has no call-to-action button, and the plain-text part carries the message", () => {
  const email = adminMessageEmail({ origin: ORIGIN, subject: "s", message: "Hello there" });
  assert.ok(
    !email.html.includes(
      "display:inline-block;background-color:#5b45e0;color:#ffffff;text-decoration:none",
    ),
  );
  assert.ok(email.text.startsWith("Hello there"));
  assert.ok(email.text.includes(`${ORIGIN}/learn/settings`));
});
