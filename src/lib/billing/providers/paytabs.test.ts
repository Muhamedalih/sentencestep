// Run with `npm run test:billing`. No real PayTabs account/credentials
// involved — signature tests compute the same HMAC the adapter does, and
// createCheckoutSession is exercised against a stubbed global.fetch.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { createPaytabsProvider } from "./paytabs";

const SERVER_KEY = "test-server-key";

function sign(body: string): string {
  return createHmac("sha256", SERVER_KEY).update(body).digest("hex");
}

function stubFetch(handler: typeof fetch): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

// --- verifyWebhookSignature ---

test("verifyWebhookSignature: a correctly signed body is accepted and parsed", () => {
  const provider = createPaytabsProvider({
    profileId: "p1",
    serverKey: SERVER_KEY,
    baseUrl: "https://secure.paytabs.example",
  });
  const body = JSON.stringify({ tran_ref: "TST123", respStatus: "A" });

  const event = provider.verifyWebhookSignature(body, sign(body));

  assert.equal(event.id, "TST123");
  assert.equal(event.type, "A");
});

test("verifyWebhookSignature: a tampered body is rejected even with the original signature", () => {
  const provider = createPaytabsProvider({
    profileId: "p1",
    serverKey: SERVER_KEY,
    baseUrl: "https://secure.paytabs.example",
  });
  const originalBody = JSON.stringify({ tran_ref: "TST123", respStatus: "A" });
  const signature = sign(originalBody);
  const tamperedBody = JSON.stringify({ tran_ref: "TST123", respStatus: "A", cart_amount: 0.01 });

  assert.throws(
    () => provider.verifyWebhookSignature(tamperedBody, signature),
    /Invalid PayTabs webhook signature/,
  );
});

test("verifyWebhookSignature: the wrong signature is rejected", () => {
  const provider = createPaytabsProvider({
    profileId: "p1",
    serverKey: SERVER_KEY,
    baseUrl: "https://secure.paytabs.example",
  });
  const body = JSON.stringify({ tran_ref: "TST123", respStatus: "A" });

  assert.throws(
    () => provider.verifyWebhookSignature(body, "0".repeat(64)),
    /Invalid PayTabs webhook signature/,
  );
});

test("verifyWebhookSignature: a missing signature header is rejected", () => {
  const provider = createPaytabsProvider({
    profileId: "p1",
    serverKey: SERVER_KEY,
    baseUrl: "https://secure.paytabs.example",
  });
  const body = JSON.stringify({ tran_ref: "TST123", respStatus: "A" });

  assert.throws(
    () => provider.verifyWebhookSignature(body, null),
    /Missing PayTabs webhook signature/,
  );
});

test("verifyWebhookSignature: a signature computed with the wrong key is rejected (signed with someone else's server key can't pass)", () => {
  const provider = createPaytabsProvider({
    profileId: "p1",
    serverKey: SERVER_KEY,
    baseUrl: "https://secure.paytabs.example",
  });
  const body = JSON.stringify({ tran_ref: "TST123", respStatus: "A" });
  const wrongKeySignature = createHmac("sha256", "someone-elses-key").update(body).digest("hex");

  assert.throws(
    () => provider.verifyWebhookSignature(body, wrongKeySignature),
    /Invalid PayTabs webhook signature/,
  );
});

// --- translateWebhookEvent ---

const provider = createPaytabsProvider({
  profileId: "p1",
  serverKey: SERVER_KEY,
  baseUrl: "https://secure.paytabs.example",
});

test("translateWebhookEvent: an Authorised (A) sale becomes checkout.completed, keyed by the round-tripped user id", () => {
  const events = provider.translateWebhookEvent({
    id: "TST123",
    type: "A",
    data: { tran_ref: "TST123", user_defined: { udf1: "user-abc" } },
  });

  assert.equal(events.length, 1);
  const [first] = events;
  assert.ok(first);
  assert.equal(first.type, "checkout.completed");
  assert.equal(first.providerCustomerId, "user-abc");
  assert.equal(first.providerSubscriptionId, "TST123");
  assert.ok(first.currentPeriodEnd);
});

for (const status of ["D", "E", "V"]) {
  test(`translateWebhookEvent: a ${status} result becomes payment.failed`, () => {
    const events = provider.translateWebhookEvent({
      id: "TST123",
      type: status,
      data: { tran_ref: "TST123", user_defined: { udf1: "user-abc" } },
    });

    assert.equal(events.length, 1);
    const [first] = events;
    assert.ok(first);
    assert.equal(first.type, "payment.failed");
  });
}

for (const status of ["H", "P"]) {
  test(`translateWebhookEvent: a still-pending result (${status}) produces no event — access is never granted before a confirmed Authorised result`, () => {
    const events = provider.translateWebhookEvent({
      id: "TST123",
      type: status,
      data: { tran_ref: "TST123", user_defined: { udf1: "user-abc" } },
    });

    assert.deepEqual(events, []);
  });
}

test("translateWebhookEvent: an Authorised result with no round-tripped user id produces no event rather than guessing who to credit", () => {
  const events = provider.translateWebhookEvent({
    id: "TST123",
    type: "A",
    data: { tran_ref: "TST123" },
  });

  assert.deepEqual(events, []);
});

// --- createCheckoutSession ---

test("createCheckoutSession: posts a sale request with the user id round-tripped via user_defined.udf1, and returns the hosted redirect_url", async () => {
  let capturedUrl: string | undefined;
  let capturedBody: Record<string, unknown> | undefined;

  const restore = stubFetch(async (url, init) => {
    capturedUrl = String(url);
    capturedBody = JSON.parse(init?.body as string);
    return new Response(
      JSON.stringify({
        tran_ref: "TST999",
        redirect_url: "https://secure.paytabs.example/payment/page/abc",
      }),
      {
        status: 200,
      },
    );
  });

  try {
    const result = await provider.createCheckoutSession({
      userId: "user-abc",
      userEmail: "learner@example.com",
      successUrl: "https://sentencestep.example/upgrade?checkout=success",
      cancelUrl: "https://sentencestep.example/upgrade?checkout=cancelled",
    });

    assert.equal(result.url, "https://secure.paytabs.example/payment/page/abc");
    assert.equal(capturedUrl, "https://secure.paytabs.example/payment/request");
    assert.equal(capturedBody?.profile_id, "p1");
    assert.equal(capturedBody?.tran_type, "sale");
    assert.equal(capturedBody?.return, "https://sentencestep.example/upgrade?checkout=success");
    assert.equal(capturedBody?.callback, "https://sentencestep.example/api/billing/webhook");
    assert.deepEqual(capturedBody?.user_defined, { udf1: "user-abc" });
  } finally {
    restore();
  }
});

test("createCheckoutSession: a non-2xx response throws rather than returning a fabricated checkout URL", async () => {
  const restore = stubFetch(async () => new Response("invalid profile_id", { status: 422 }));

  try {
    await assert.rejects(
      () =>
        provider.createCheckoutSession({
          userId: "user-abc",
          userEmail: "learner@example.com",
          successUrl: "https://sentencestep.example/upgrade?checkout=success",
          cancelUrl: "https://sentencestep.example/upgrade?checkout=cancelled",
        }),
      /PayTabs payment\/request failed \(422\)/,
    );
  } finally {
    restore();
  }
});

test("createCheckoutSession: a success response missing redirect_url throws instead of claiming success", async () => {
  const restore = stubFetch(
    async () => new Response(JSON.stringify({ tran_ref: "TST999" }), { status: 200 }),
  );

  try {
    await assert.rejects(() =>
      provider.createCheckoutSession({
        userId: "user-abc",
        userEmail: "learner@example.com",
        successUrl: "https://sentencestep.example/upgrade?checkout=success",
        cancelUrl: "https://sentencestep.example/upgrade?checkout=cancelled",
      }),
    );
  } finally {
    restore();
  }
});

// --- getSubscription / cancelSubscription: honest stubs, not guesses ---

test("getSubscription: throws a clear, actionable error rather than guessing an unconfirmed endpoint", async () => {
  await assert.rejects(() => provider.getSubscription("TST123"), /not implemented/);
});

test("cancelSubscription: throws a clear, actionable error rather than guessing an unconfirmed endpoint", async () => {
  await assert.rejects(() => provider.cancelSubscription("TST123"), /not implemented/);
});
