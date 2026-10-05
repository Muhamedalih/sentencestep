// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { inboxAlertEmail, senderLabel } from "./inbox-alert";

const ORIGIN = "https://sentencestep.example";

function alert(overrides: Partial<Parameters<typeof inboxAlertEmail>[0]> = {}) {
  return inboxAlertEmail({
    origin: ORIGIN,
    fromEmail: "sara@example.com",
    fromName: "Sara",
    subject: "Re: your report",
    bodyText: "Thanks, it works now.",
    ...overrides,
  });
}

test("senderLabel: includes the name when there is one", () => {
  assert.equal(senderLabel("a@b.co", "Sara"), "Sara (a@b.co)");
  assert.equal(senderLabel("a@b.co", null), "a@b.co");
});

test("inboxAlertEmail: names the sender and subject and links to the Inbox", () => {
  const email = alert();
  assert.equal(email.subject, "New reply from Sara (sara@example.com): Re: your report");
  assert.ok(email.html.includes(`${ORIGIN}/admin/inbox`));
  assert.ok(email.html.includes("Open Inbox"));
  assert.ok(email.text.includes(`${ORIGIN}/admin/inbox`));
});

test("inboxAlertEmail: learner-supplied text is escaped, never rendered as HTML", () => {
  const email = alert({
    fromName: `<b>Eve</b>`,
    subject: `<script>alert(1)</script>`,
    bodyText: `<img src=x onerror=alert(1)>`,
  });
  assert.ok(!email.html.includes("<script>"));
  assert.ok(!email.html.includes("<img src=x"));
  assert.ok(!email.html.includes("<b>Eve</b>"));
  assert.ok(email.html.includes("&lt;script&gt;"));
});

test("inboxAlertEmail: only an excerpt of a long body is included", () => {
  const email = alert({ bodyText: "word ".repeat(500) });
  assert.ok(email.text.length < 700);
  assert.ok(email.html.includes("…"));
});

test("inboxAlertEmail: falls back for a missing subject and an empty body", () => {
  const email = alert({ subject: "  ", bodyText: "" });
  assert.ok(email.subject.endsWith("(no subject)"));
  assert.ok(email.html.includes("(empty message)"));
});

test("inboxAlertEmail: an admin notice has no 'manage email preferences' link", () => {
  const email = alert();
  assert.ok(!email.html.includes("Manage email preferences"));
  assert.ok(email.html.includes("you're a SentenceStep admin"));
});

test("inboxAlertEmail: Arabic text keeps dir=auto for right-to-left rendering", () => {
  const email = alert({ subject: "رد على تبليغك", bodyText: "شكراً، اشتغلت." });
  assert.ok(email.html.includes('dir="auto"'));
  assert.ok(email.html.includes("شكراً، اشتغلت."));
});
