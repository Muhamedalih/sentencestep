// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSesProvider } from "./ses";

const CONFIG = {
  accessKeyId: "AKIDEXAMPLE",
  secretAccessKey: "secret",
  region: "us-east-1",
  from: "SentenceStep <hello@sentencestep.com>",
  replyTo: "help@sentencestep.com",
};

function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

test("createSesProvider: one signed POST to the regional v2 endpoint, and the message id comes back", async () => {
  const { impl, calls } = fakeFetch(200, { MessageId: "abc-123" });
  const result = await createSesProvider(CONFIG, impl).sendEmail({
    to: "learner@example.com",
    subject: "درسك التالي",
    html: "<p>مرحبا</p>",
    text: "مرحبا",
  });
  assert.deepEqual(result, { status: "sent", providerMessageId: "abc-123" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "https://email.us-east-1.amazonaws.com/v2/email/outbound-emails");
  const headers = calls[0]!.init.headers as Record<string, string>;
  assert.match(
    headers.authorization!,
    /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/\d{8}\/us-east-1\/ses\/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=[0-9a-f]{64}$/,
  );

  const sent = JSON.parse(calls[0]!.init.body as string);
  assert.equal(sent.FromEmailAddress, CONFIG.from);
  assert.deepEqual(sent.Destination, { ToAddresses: ["learner@example.com"] });
  assert.deepEqual(sent.ReplyToAddresses, ["help@sentencestep.com"]);
  assert.equal(sent.Content.Simple.Subject.Data, "درسك التالي");
  assert.equal(sent.Content.Simple.Subject.Charset, "UTF-8");
});

test("createSesProvider: replyTo null sends with none, a string replaces the default", async () => {
  const none = fakeFetch(200, { MessageId: "1" });
  await createSesProvider(CONFIG, none.impl).sendEmail({
    to: "a@b.co",
    subject: "s",
    html: "h",
    text: "t",
    replyTo: null,
  });
  assert.equal("ReplyToAddresses" in JSON.parse(none.calls[0]!.init.body as string), false);

  const own = fakeFetch(200, { MessageId: "2" });
  await createSesProvider(CONFIG, own.impl).sendEmail({
    to: "a@b.co",
    subject: "s",
    html: "h",
    text: "t",
    replyTo: "x@y.co",
  });
  assert.deepEqual(JSON.parse(own.calls[0]!.init.body as string).ReplyToAddresses, ["x@y.co"]);
});

test("createSesProvider: a refusal is thrown with its status, never reported as sent", async () => {
  const { impl } = fakeFetch(400, { message: "Email address is not verified." });
  await assert.rejects(
    createSesProvider(CONFIG, impl).sendEmail({ to: "a@b.co", subject: "s", html: "h", text: "t" }),
    /Amazon SES error \(400\)/,
  );
  const noId = fakeFetch(200, {});
  await assert.rejects(
    createSesProvider(CONFIG, noId.impl).sendEmail({
      to: "a@b.co",
      subject: "s",
      html: "h",
      text: "t",
    }),
    /no message id/,
  );
});
