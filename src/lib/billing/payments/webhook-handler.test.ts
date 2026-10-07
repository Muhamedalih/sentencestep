// Run with `npm run test:billing`. The real Wayl adapter verifies real HMAC
// signatures here; only the HTTP calls it makes and the database are faked.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";

import { createWaylProvider } from "@/lib/billing/providers/wayl";

import { MAX_WEBHOOK_BYTES, handleProviderWebhook } from "./webhook-handler";
import type { WebhookDeps } from "./webhook-handler";
import { InMemoryPaymentStore, NOW, collectAlerts, makeOrder } from "./test-support";

const SECRET = "0123456789abcdef0123456789abcdef";

type LinkOverrides = Record<string, unknown>;

function waylLink(overrides: LinkOverrides = {}) {
  return {
    id: "link_1",
    referenceId: "ss_abc",
    total: "4560",
    currency: "IQD",
    status: "Complete",
    completedAt: "2026-10-04T11:59:00.000Z",
    url: "https://pay.example.com/link_1",
    ...overrides,
  };
}

function setup(
  options: {
    link?: LinkOverrides | "outage";
    recordResult?: "recorded" | "already-processed" | "retry" | Error;
  } = {},
) {
  const lookups: string[] = [];
  const fetchStub = (async (url: string | URL | Request) => {
    lookups.push(String(url));
    if (options.link === "outage") return new Response("down", { status: 503 });
    return new Response(JSON.stringify({ data: waylLink(options.link) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const provider = createWaylProvider({
    apiKey: "key",
    webhookSecret: SECRET,
    environment: "test",
    fetch: fetchStub,
  });
  const store = new InMemoryPaymentStore([makeOrder()]);
  const { alerts, report } = collectAlerts();
  const recorded: string[] = [];
  const processed: string[] = [];

  const deps: WebhookDeps = {
    provider,
    store,
    report,
    now: () => new Date(NOW),
    async recordEvent(event) {
      recorded.push(event.id);
      const result = options.recordResult ?? "recorded";
      if (result instanceof Error) throw result;
      return result;
    },
    async markEventProcessed(id) {
      processed.push(id);
    },
  };
  return { deps, store, lookups, recorded, processed, alerts };
}

function delivery(payload: unknown, secret = SECRET) {
  const raw = Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(raw).digest("hex");
  return {
    raw,
    headers: {
      get: (name: string) => (name.toLowerCase() === "x-wayl-signature-256" ? signature : null),
    },
  };
}

const completeEvent = { id: "evt_1", referenceId: "ss_abc", status: "Complete" };

test("webhook: a valid delivery for a paid order grants premium and is marked processed", async () => {
  const { deps, store, processed, recorded } = setup();
  const { raw, headers } = delivery(completeEvent);

  const response = await handleProviderWebhook(deps, raw, headers);

  assert.deepEqual(response, { status: 200, body: { received: true } });
  assert.equal(store.get("ss_abc").status, "fulfilled");
  assert.equal(store.premiumGrants.length, 1);
  assert.deepEqual(recorded, ["wayl:evt_1:Complete"]);
  assert.deepEqual(processed, ["wayl:evt_1:Complete"]);
});

test("webhook: a bad signature is rejected with 401 before the order or the provider is touched", async () => {
  const { deps, store, lookups, recorded } = setup();
  const { raw } = delivery(completeEvent);
  const forged = delivery(completeEvent, "an-attackers-guess-an-attackers-guess");

  const response = await handleProviderWebhook(deps, raw, forged.headers);

  assert.equal(response.status, 401);
  assert.equal(lookups.length, 0);
  assert.equal(recorded.length, 0);
  assert.equal(store.premiumGrants.length, 0);
});

test("webhook: a missing signature header is rejected with 401", async () => {
  const { deps, lookups } = setup();
  const { raw } = delivery(completeEvent);

  const response = await handleProviderWebhook(deps, raw, { get: () => null });

  assert.equal(response.status, 401);
  assert.equal(lookups.length, 0);
});

test("webhook: a body altered after signing is rejected", async () => {
  const { deps, store } = setup();
  const { headers } = delivery(completeEvent);
  const altered = Buffer.from(JSON.stringify({ ...completeEvent, referenceId: "ss_someone_else" }));

  const response = await handleProviderWebhook(deps, altered, headers);

  assert.equal(response.status, 401);
  assert.equal(store.premiumGrants.length, 0);
});

test("webhook: a correctly signed but malformed payload is a 400 and changes nothing", async () => {
  for (const payload of ["not json at all", { id: "evt_1", status: "Complete" }]) {
    const { deps, lookups, store } = setup();
    const { raw, headers } = delivery(payload);

    const response = await handleProviderWebhook(deps, raw, headers);

    assert.equal(response.status, 400, JSON.stringify(payload));
    assert.equal(lookups.length, 0);
    assert.equal(store.premiumGrants.length, 0);
  }
});

test("webhook: an oversized body is refused outright", async () => {
  const { deps, lookups } = setup();
  const raw = Buffer.alloc(MAX_WEBHOOK_BYTES + 1, "a");

  const response = await handleProviderWebhook(deps, raw, { get: () => null });

  assert.equal(response.status, 413);
  assert.equal(lookups.length, 0);
});

test("webhook: a signed 'Complete' event does not grant premium when Wayl itself says the link is unpaid", async () => {
  const { deps, store, processed } = setup({
    link: { status: "Created", completedAt: null },
  });
  const { raw, headers } = delivery(completeEvent);

  const response = await handleProviderWebhook(deps, raw, headers);

  assert.equal(response.status, 200);
  assert.equal(store.premiumGrants.length, 0);
  assert.equal(store.get("ss_abc").status, "pending");
  assert.deepEqual(processed, [], "an unsettled order must stay retryable");
});

test("webhook: a payment for a different amount is never granted and raises an alert", async () => {
  const { deps, store, alerts } = setup({ link: { total: "100" } });
  const { raw, headers } = delivery(completeEvent);

  const response = await handleProviderWebhook(deps, raw, headers);

  assert.equal(response.status, 200);
  assert.equal(store.premiumGrants.length, 0);
  assert.equal(store.get("ss_abc").status, "needs_review");
  assert.equal(alerts[0]!.code, "amount_mismatch");
});

test("webhook: a payment in a different currency is never granted", async () => {
  const { deps, store } = setup({ link: { currency: "USD" } });
  const { raw, headers } = delivery(completeEvent);

  await handleProviderWebhook(deps, raw, headers);

  assert.equal(store.premiumGrants.length, 0);
  assert.equal(store.get("ss_abc").status, "needs_review");
});

test("webhook: a reference that is not one of our orders gets 200 so it is not retried forever", async () => {
  const { deps, lookups, store } = setup();
  const { raw, headers } = delivery({
    id: "evt_9",
    referenceId: "manually_created_link",
    status: "Complete",
  });

  const response = await handleProviderWebhook(deps, raw, headers);

  assert.equal(response.status, 200);
  assert.equal(lookups.length, 0);
  assert.equal(store.premiumGrants.length, 0);
});

test("webhook: a replay of an event that was already fully processed is acknowledged without any work", async () => {
  const { deps, lookups, store } = setup({ recordResult: "already-processed" });
  const { raw, headers } = delivery(completeEvent);

  const response = await handleProviderWebhook(deps, raw, headers);

  assert.deepEqual(response, { status: 200, body: { received: true, duplicate: true } });
  assert.equal(lookups.length, 0);
  assert.equal(store.premiumGrants.length, 0);
});

test("webhook: a redelivery of an event that was recorded but never finished is processed", async () => {
  const { deps, store } = setup({ recordResult: "retry" });
  const { raw, headers } = delivery(completeEvent);

  const response = await handleProviderWebhook(deps, raw, headers);

  assert.equal(response.status, 200);
  assert.equal(store.premiumGrants.length, 1);
});

test("webhook: delivering the same event twice grants premium once", async () => {
  const { deps, store } = setup();
  const { raw, headers } = delivery(completeEvent);

  await handleProviderWebhook(deps, raw, headers);
  await handleProviderWebhook(deps, raw, headers);

  assert.equal(store.premiumGrants.length, 1);
});

test("webhook: a Wayl outage while verifying returns 503 so Wayl retries, and nothing is marked processed", async () => {
  const { deps, store, processed } = setup({ link: "outage" });
  const { raw, headers } = delivery(completeEvent);

  const response = await handleProviderWebhook(deps, raw, headers);

  assert.equal(response.status, 503);
  assert.equal(store.premiumGrants.length, 0);
  assert.deepEqual(processed, []);
});

test("webhook: a failure to write the audit log never blocks the payment", async () => {
  const { deps, store } = setup({ recordResult: new Error("audit table unavailable") });
  const { raw, headers } = delivery(completeEvent);

  const response = await handleProviderWebhook(deps, raw, headers);

  assert.equal(response.status, 200);
  assert.equal(store.premiumGrants.length, 1);
});

test("webhook: a payload without an id is audited under a hash of its exact bytes", async () => {
  const { deps, recorded } = setup();
  const { raw, headers } = delivery({ referenceId: "ss_abc", status: "Complete" });

  await handleProviderWebhook(deps, raw, headers);

  const expected = `wayl:sha256:${createHash("sha256").update(raw).digest("hex")}`;
  assert.deepEqual(recorded, [expected]);
});
