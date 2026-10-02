// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildInboundEmailRow,
  htmlToText,
  MAX_BODY_LENGTH,
  parseAddress,
  parseInboundWebhook,
} from "./parse";

const NOW = "2026-10-02T20:00:00.000Z";

function webhook(data: Record<string, unknown>, type = "email.received"): string {
  return JSON.stringify({ type, created_at: NOW, data });
}

test("parseAddress: reads 'Name <address>' and a bare address, lower-casing the address", () => {
  assert.deepEqual(parseAddress("Sara Ali <Sara@Example.com>"), {
    email: "sara@example.com",
    name: "Sara Ali",
  });
  assert.deepEqual(parseAddress('"Ali, Sara" <sara@example.com>'), {
    email: "sara@example.com",
    name: "Ali, Sara",
  });
  assert.deepEqual(parseAddress("sara@example.com"), { email: "sara@example.com", name: null });
});

test("parseAddress: rejects anything that isn't an address", () => {
  assert.equal(parseAddress("not an address"), null);
  assert.equal(parseAddress("Sara <nope>"), null);
  assert.equal(parseAddress(""), null);
});

test("parseInboundWebhook: reads an email.received event", () => {
  const event = parseInboundWebhook(
    webhook({ email_id: "e1", from: "a@b.co", to: ["support@x.com"], subject: "Hi" }),
  );
  assert.deepEqual(event, {
    emailId: "e1",
    from: "a@b.co",
    to: ["support@x.com"],
    subject: "Hi",
  });
});

test("parseInboundWebhook: ignores other event types, bad JSON and incomplete payloads", () => {
  assert.equal(
    parseInboundWebhook(webhook({ email_id: "e1", from: "a@b.co" }, "email.sent")),
    null,
  );
  assert.equal(parseInboundWebhook("{not json"), null);
  assert.equal(parseInboundWebhook(webhook({ from: "a@b.co" })), null);
  assert.equal(parseInboundWebhook(webhook({ email_id: "e1" })), null);
  assert.equal(parseInboundWebhook("null"), null);
});

test("parseInboundWebhook: tolerates a missing subject and a string `to`", () => {
  const event = parseInboundWebhook(webhook({ email_id: "e1", from: "a@b.co", to: "s@x.com" }));
  assert.deepEqual(event?.to, ["s@x.com"]);
  assert.equal(event?.subject, "");
});

test("htmlToText: strips tags and scripts, keeps line breaks and decodes basic entities", () => {
  const text = htmlToText(
    "<style>p{color:red}</style><p>Hello &amp; welcome</p><p>Line<br>two</p><script>alert(1)</script>",
  );
  assert.equal(text, "Hello & welcome\nLine\ntwo");
  assert.ok(!text.includes("alert"));
  assert.ok(!text.includes("<"));
});

test("buildInboundEmailRow: prefers the plain-text body and normalises the sender", () => {
  const row = buildInboundEmailRow(
    {
      emailId: "e1",
      from: "Sara <SARA@Example.com>",
      to: ["Support <help@x.com>"],
      subject: "Re: hi",
    },
    { text: "  Thanks!  ", html: "<p>ignored</p>", message_id: "<m1@x>", created_at: NOW },
    "fallback",
  );
  assert.deepEqual(row, {
    provider_email_id: "e1",
    message_id: "<m1@x>",
    from_email: "sara@example.com",
    from_name: "Sara",
    to_email: "help@x.com",
    subject: "Re: hi",
    body_text: "Thanks!",
    attachment_names: [],
    received_at: NOW,
  });
});

test("buildInboundEmailRow: falls back to flattened HTML, the webhook subject and the fallback time", () => {
  const row = buildInboundEmailRow(
    { emailId: "e1", from: "a@b.co", to: [], subject: "Subject\r\nBcc: x" },
    {
      html: "<p>Only html</p>",
      created_at: "not a date",
      attachments: [{ filename: "a.pdf" }, {}],
    },
    "2026-01-01T00:00:00.000Z",
  );
  assert.equal(row?.body_text, "Only html");
  assert.equal(row?.subject, "Subject Bcc: x");
  assert.equal(row?.received_at, "2026-01-01T00:00:00.000Z");
  assert.deepEqual(row?.attachment_names, ["a.pdf"]);
  assert.equal(row?.to_email, "");
});

test("buildInboundEmailRow: caps an oversized body and rejects an unusable sender", () => {
  const long = buildInboundEmailRow(
    { emailId: "e1", from: "a@b.co", to: [], subject: "s" },
    { text: "x".repeat(MAX_BODY_LENGTH + 500) },
    NOW,
  );
  assert.equal(long?.body_text.length, MAX_BODY_LENGTH);

  assert.equal(
    buildInboundEmailRow(
      { emailId: "e1", from: "garbage", to: [], subject: "s" },
      { text: "t" },
      NOW,
    ),
    null,
  );
});
