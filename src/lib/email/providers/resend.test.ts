// Exercises the Resend adapter's request shape and error handling against a
// stubbed global.fetch — no real network call, no real API key. Run with
// `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createResendProvider } from "./resend";

function stubFetch(handler: typeof fetch): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

test("sendEmail: posts to the Resend API with the configured from address and the input fields", async () => {
  let capturedUrl: string | undefined;
  let capturedInit: RequestInit | undefined;

  const restore = stubFetch(async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(JSON.stringify({ id: "msg_123" }), { status: 200 });
  });

  try {
    const provider = createResendProvider("test-api-key", "SentenceStep <noreply@example.com>");
    const result = await provider.sendEmail({
      to: "learner@example.com",
      subject: "Hi",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    assert.equal(result.status, "sent");
    assert.equal(result.providerMessageId, "msg_123");
    assert.equal(capturedUrl, "https://api.resend.com/emails");
    assert.equal(capturedInit?.method, "POST");

    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer test-api-key");

    const body = JSON.parse(capturedInit?.body as string);
    assert.deepEqual(body, {
      from: "SentenceStep <noreply@example.com>",
      to: "learner@example.com",
      subject: "Hi",
      html: "<p>Hi</p>",
      text: "Hi",
    });
  } finally {
    restore();
  }
});

test("sendEmail: a non-2xx response throws rather than returning a fabricated 'sent' result", async () => {
  const restore = stubFetch(async () => new Response("invalid api key", { status: 401 }));

  try {
    const provider = createResendProvider("bad-key", "noreply@example.com");
    await assert.rejects(
      () => provider.sendEmail({ to: "a@example.com", subject: "s", html: "h", text: "t" }),
      /Resend API error \(401\)/,
    );
  } finally {
    restore();
  }
});

test("sendEmail: a success response missing a message id throws instead of claiming success", async () => {
  const restore = stubFetch(async () => new Response(JSON.stringify({}), { status: 200 }));

  try {
    const provider = createResendProvider("test-api-key", "noreply@example.com");
    await assert.rejects(() =>
      provider.sendEmail({ to: "a@example.com", subject: "s", html: "h", text: "t" }),
    );
  } finally {
    restore();
  }
});
