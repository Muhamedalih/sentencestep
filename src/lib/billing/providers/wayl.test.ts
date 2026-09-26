// Run with `npm run test:billing`. No real Wayl account/credentials
// involved — signature tests compute the same HMAC the adapter does, and
// every network call (createCheckoutSession's POST, verifyWebhookSignature's
// authoritative GET) is exercised against a stubbed global.fetch.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { createWaylProvider, resolveWaylEnvironment } from "./wayl";
import { WAYL_PREMIUM_PRICE_IQD } from "@/lib/billing/pricing";

const WEBHOOK_SECRET = "test-webhook-secret";
const BASE_URL = "https://secure.wayl.example";

function sign(body: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

function stubFetch(handler: typeof fetch): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

function linkResponse(overrides: Partial<Record<string, unknown>> = {}): string {
  return JSON.stringify({
    message: "ok",
    data: {
      referenceId: "sentencestep-premium__user-abc__1700000000000",
      id: "link_123",
      total: WAYL_PREMIUM_PRICE_IQD,
      currency: "IQD",
      status: "Complete",
      url: "https://checkout.wayl.example/pay/abc",
      ...overrides,
    },
  });
}

function provider() {
  return createWaylProvider({
    apiKey: "test-api-key",
    webhookSecret: WEBHOOK_SECRET,
    environment: "test",
    baseUrl: BASE_URL,
  });
}

// --- resolveWaylEnvironment ---

test("resolveWaylEnvironment: production requires WAYL_ENV=live explicitly", () => {
  assert.equal(resolveWaylEnvironment(undefined, "production"), null);
  assert.equal(resolveWaylEnvironment("test", "production"), null);
  assert.equal(resolveWaylEnvironment("live", "production"), "live");
});

test("resolveWaylEnvironment: outside production, a missing value defaults to test", () => {
  assert.equal(resolveWaylEnvironment(undefined, "development"), "test");
  assert.equal(resolveWaylEnvironment(undefined, undefined), "test");
});

test("resolveWaylEnvironment: outside production, an explicit live is honored", () => {
  assert.equal(resolveWaylEnvironment("live", "development"), "live");
});

test("resolveWaylEnvironment: any value other than test/live is invalid everywhere", () => {
  assert.equal(resolveWaylEnvironment("production", "development"), null);
  assert.equal(resolveWaylEnvironment("LIVE!", "development"), null);
});

// --- verifyWebhookSignature ---

test("verifyWebhookSignature: a correctly signed body triggers an authoritative lookup and returns its state", async () => {
  const restore = stubFetch(async (url) => {
    assert.equal(
      String(url),
      `${BASE_URL}/api/v1/links/${encodeURIComponent("sentencestep-premium__user-abc__1700000000000")}`,
    );
    return new Response(linkResponse(), { status: 200 });
  });

  try {
    const body = JSON.stringify({ referenceId: "sentencestep-premium__user-abc__1700000000000" });
    const event = await provider().verifyWebhookSignature(body, sign(body));

    assert.equal(event.id, "link_123");
    assert.equal(event.type, "Complete");
  } finally {
    restore();
  }
});

test("verifyWebhookSignature: accepts a sha256=-prefixed, uppercase signature header", async () => {
  const restore = stubFetch(async () => new Response(linkResponse(), { status: 200 }));

  try {
    const body = JSON.stringify({ referenceId: "sentencestep-premium__user-abc__1700000000000" });
    const event = await provider().verifyWebhookSignature(
      body,
      `sha256=${sign(body).toUpperCase()}`,
    );
    assert.equal(event.id, "link_123");
  } finally {
    restore();
  }
});

test("verifyWebhookSignature: a tampered body is rejected even with the original signature", async () => {
  const originalBody = JSON.stringify({
    referenceId: "sentencestep-premium__user-abc__1700000000000",
  });
  const signature = sign(originalBody);
  const tamperedBody = JSON.stringify({
    referenceId: "sentencestep-premium__attacker__1700000000000",
  });

  await assert.rejects(
    () => provider().verifyWebhookSignature(tamperedBody, signature),
    /Invalid Wayl webhook signature/,
  );
});

test("verifyWebhookSignature: the wrong signature is rejected", async () => {
  const body = JSON.stringify({ referenceId: "sentencestep-premium__user-abc__1700000000000" });
  await assert.rejects(
    () => provider().verifyWebhookSignature(body, "0".repeat(64)),
    /Invalid Wayl webhook signature/,
  );
});

test("verifyWebhookSignature: a signature computed with the wrong secret is rejected", async () => {
  const body = JSON.stringify({ referenceId: "sentencestep-premium__user-abc__1700000000000" });
  const wrongSecretSignature = createHmac("sha256", "someone-elses-secret")
    .update(body)
    .digest("hex");
  await assert.rejects(
    () => provider().verifyWebhookSignature(body, wrongSecretSignature),
    /Invalid Wayl webhook signature/,
  );
});

test("verifyWebhookSignature: a missing signature header is rejected", async () => {
  const body = JSON.stringify({ referenceId: "sentencestep-premium__user-abc__1700000000000" });
  await assert.rejects(
    () => provider().verifyWebhookSignature(body, null),
    /Missing Wayl webhook signature/,
  );
});

test("verifyWebhookSignature: a body with no referenceId is rejected before any network call", async () => {
  const restore = stubFetch(async () => {
    throw new Error("should never be called");
  });
  try {
    const body = JSON.stringify({ foo: "bar" });
    await assert.rejects(
      () => provider().verifyWebhookSignature(body, sign(body)),
      /no referenceId/,
    );
  } finally {
    restore();
  }
});

test("verifyWebhookSignature: an authoritative lookup echoing a different referenceId is rejected", async () => {
  const restore = stubFetch(
    async () =>
      new Response(linkResponse({ referenceId: "sentencestep-premium__someone-else__1" }), {
        status: 200,
      }),
  );
  try {
    const body = JSON.stringify({ referenceId: "sentencestep-premium__user-abc__1700000000000" });
    await assert.rejects(
      () => provider().verifyWebhookSignature(body, sign(body)),
      /different referenceId/,
    );
  } finally {
    restore();
  }
});

// --- translateWebhookEvent ---

test("translateWebhookEvent: a Complete link at the expected price becomes checkout.completed", () => {
  const events = provider().translateWebhookEvent({
    id: "link_123",
    type: "Complete",
    data: {
      referenceId: "sentencestep-premium__user-abc__1700000000000",
      id: "link_123",
      total: WAYL_PREMIUM_PRICE_IQD,
      currency: "IQD",
      status: "Complete",
      url: "https://checkout.wayl.example/pay/abc",
    },
  });

  assert.equal(events.length, 1);
  const [first] = events;
  assert.ok(first);
  assert.equal(first.type, "checkout.completed");
  assert.equal(first.providerCustomerId, "user-abc");
  assert.equal(first.providerSubscriptionId, "link_123");
  assert.ok(first.currentPeriodEnd);
});

test("translateWebhookEvent: Complete with the wrong amount is never treated as a valid payment", () => {
  const events = provider().translateWebhookEvent({
    id: "link_123",
    type: "Complete",
    data: {
      referenceId: "sentencestep-premium__user-abc__1700000000000",
      id: "link_123",
      total: 1,
      currency: "IQD",
      status: "Complete",
      url: "https://checkout.wayl.example/pay/abc",
    },
  });
  assert.deepEqual(events, []);
});

test("translateWebhookEvent: Complete with the wrong currency is never treated as a valid payment", () => {
  const events = provider().translateWebhookEvent({
    id: "link_123",
    type: "Complete",
    data: {
      referenceId: "sentencestep-premium__user-abc__1700000000000",
      id: "link_123",
      total: WAYL_PREMIUM_PRICE_IQD,
      currency: "USD",
      status: "Complete",
      url: "https://checkout.wayl.example/pay/abc",
    },
  });
  assert.deepEqual(events, []);
});

for (const status of ["Cancelled", "Rejected"]) {
  test(`translateWebhookEvent: a ${status} link becomes payment.failed`, () => {
    const events = provider().translateWebhookEvent({
      id: "link_123",
      type: status,
      data: {
        referenceId: "sentencestep-premium__user-abc__1700000000000",
        id: "link_123",
        total: WAYL_PREMIUM_PRICE_IQD,
        currency: "IQD",
        status,
        url: "https://checkout.wayl.example/pay/abc",
      },
    });
    assert.equal(events.length, 1);
    assert.equal(events[0]?.type, "payment.failed");
  });
}

for (const status of ["Created", "Pending", "Processing", "Delivered", "Returned"]) {
  test(`translateWebhookEvent: a ${status} link produces no event — access is never granted before a confirmed Complete result`, () => {
    const events = provider().translateWebhookEvent({
      id: "link_123",
      type: status,
      data: {
        referenceId: "sentencestep-premium__user-abc__1700000000000",
        id: "link_123",
        total: WAYL_PREMIUM_PRICE_IQD,
        currency: "IQD",
        status,
        url: "https://checkout.wayl.example/pay/abc",
      },
    });
    assert.deepEqual(events, []);
  });
}

test("translateWebhookEvent: a referenceId this adapter didn't mint produces no event rather than guessing who to credit", () => {
  const events = provider().translateWebhookEvent({
    id: "link_123",
    type: "Complete",
    data: {
      referenceId: "some-other-systems-reference",
      id: "link_123",
      total: WAYL_PREMIUM_PRICE_IQD,
      currency: "IQD",
      status: "Complete",
      url: "https://checkout.wayl.example/pay/abc",
    },
  });
  assert.deepEqual(events, []);
});

// --- createCheckoutSession ---

test("createCheckoutSession: posts a link request with the user id round-tripped via referenceId, and returns the hosted url", async () => {
  let capturedUrl: string | undefined;
  let capturedBody: Record<string, unknown> | undefined;

  const restore = stubFetch(async (url, init) => {
    capturedUrl = String(url);
    capturedBody = JSON.parse(init?.body as string);
    return new Response(linkResponse({ referenceId: capturedBody?.referenceId }), { status: 201 });
  });

  try {
    const result = await provider().createCheckoutSession({
      userId: "user-abc",
      userEmail: "learner@example.com",
      successUrl: "https://sentencestep.example/upgrade?checkout=success",
      cancelUrl: "https://sentencestep.example/upgrade?checkout=cancelled",
    });

    assert.equal(result.url, "https://checkout.wayl.example/pay/abc");
    assert.equal(capturedUrl, `${BASE_URL}/api/v1/links`);
    assert.equal(capturedBody?.env, "test");
    assert.equal(capturedBody?.total, WAYL_PREMIUM_PRICE_IQD);
    assert.equal(capturedBody?.currency, "IQD");
    assert.equal(capturedBody?.webhookSecret, WEBHOOK_SECRET);
    assert.equal(capturedBody?.webhookUrl, "https://sentencestep.example/api/billing/webhook");
    assert.equal(
      capturedBody?.redirectionUrl,
      "https://sentencestep.example/upgrade?checkout=success",
    );
    assert.ok(String(capturedBody?.referenceId).startsWith("sentencestep-premium__user-abc__"));
  } finally {
    restore();
  }
});

test("createCheckoutSession: a non-2xx response throws rather than returning a fabricated checkout URL", async () => {
  const restore = stubFetch(async () => new Response("invalid api key", { status: 401 }));

  try {
    await assert.rejects(
      () =>
        provider().createCheckoutSession({
          userId: "user-abc",
          userEmail: "learner@example.com",
          successUrl: "https://sentencestep.example/upgrade?checkout=success",
          cancelUrl: "https://sentencestep.example/upgrade?checkout=cancelled",
        }),
      /Wayl \/api\/v1\/links failed \(401\)/,
    );
  } finally {
    restore();
  }
});

test("createCheckoutSession: a response echoing a different referenceId throws instead of claiming success", async () => {
  const restore = stubFetch(
    async () => new Response(linkResponse({ referenceId: "not-what-we-sent" }), { status: 201 }),
  );

  try {
    await assert.rejects(() =>
      provider().createCheckoutSession({
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

test("getSubscription: throws a clear, actionable error — Wayl has no recurring subscription object", async () => {
  await assert.rejects(() => provider().getSubscription("link_123"), /not implemented/);
});

test("cancelSubscription: throws a clear, actionable error — Wayl has no recurring subscription object", async () => {
  await assert.rejects(() => provider().cancelSubscription("link_123"), /not implemented/);
});
