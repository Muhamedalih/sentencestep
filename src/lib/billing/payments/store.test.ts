// Run with `npm run test:billing`. A real supabase-js client is pointed at a
// recording fetch, so these tests check the exact PostgREST requests the
// payment store sends (no database involved).

import { test } from "node:test";
import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { createPaymentStore } from "./store";
import { makeOrder } from "./test-support";

interface RecordedRequest {
  method: string;
  path: string;
  params: URLSearchParams;
  headers: Headers;
  body: unknown;
}

function setup(respond: (request: RecordedRequest) => Response) {
  const requests: RecordedRequest[] = [];
  const fetchStub = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    const request = {
      method: init?.method ?? "GET",
      path: url.pathname,
      params: url.searchParams,
      headers: new Headers(init?.headers),
      body,
    };
    requests.push(request);
    return respond(request);
  }) as typeof fetch;

  const client = createClient<Database>("http://localhost:54321", "service-role-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchStub },
  });
  return { store: createPaymentStore(client), requests };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

test("store.getOrderByReference: looks the order up by its reference id", async () => {
  const order = makeOrder();
  const { store, requests } = setup(() => json([order]));

  assert.deepEqual(await store.getOrderByReference("ss_abc"), order);

  assert.equal(requests[0]!.path, "/rest/v1/payment_orders");
  assert.equal(requests[0]!.params.get("reference_id"), "eq.ss_abc");
});

test("store.getOrderByReference: no row is null", async () => {
  const { store } = setup(() => json([]));
  assert.equal(await store.getOrderByReference("ss_none"), null);
});

test("store.getOrderForUser: the lookup is scoped to the signed-in learner", async () => {
  const { store, requests } = setup(() => json([]));

  await store.getOrderForUser("ss_abc", "user-1");

  assert.equal(requests[0]!.params.get("reference_id"), "eq.ss_abc");
  assert.equal(requests[0]!.params.get("user_id"), "eq.user-1");
});

test("store.getLatestOrderForUser: newest first, one row, this provider only", async () => {
  const { store, requests } = setup(() => json([]));

  await store.getLatestOrderForUser("user-1", "wayl");

  const params = requests[0]!.params;
  assert.equal(params.get("user_id"), "eq.user-1");
  assert.equal(params.get("provider"), "eq.wayl");
  assert.equal(params.get("order"), "created_at.desc");
  assert.equal(params.get("limit"), "1");
});

test("store.updateOrder: never touches a fulfilled order or one under review", async () => {
  const { store, requests } = setup(() => json([]));

  await store.updateOrder("order-1", { status: "expired", failure_reason: "link_expired" });

  const request = requests[0]!;
  assert.equal(request.method, "PATCH");
  assert.equal(request.params.get("id"), "eq.order-1");
  assert.deepEqual(request.params.getAll("status"), ["neq.fulfilled", "neq.needs_review"]);
  assert.deepEqual(request.body, { status: "expired", failure_reason: "link_expired" });
});

test("store.updateOrder: moving an order into review is still allowed from any open state", async () => {
  const { store, requests } = setup(() => json([]));

  await store.updateOrder("order-1", { status: "needs_review", failure_reason: "amount_mismatch" });

  assert.deepEqual(requests[0]!.params.getAll("status"), ["neq.fulfilled"]);
});

test("store.updateOrder: a database error is thrown, not swallowed", async () => {
  const { store } = setup(() => json({ message: "boom", code: "XX000" }, 500));
  await assert.rejects(store.updateOrder("order-1", { status: "failed" }));
});

test("store.fulfillOrder: calls the atomic database function with every verified detail", async () => {
  const { store, requests } = setup(() =>
    json({ result: "fulfilled", premium_period_end: "2026-11-03T00:00:00Z" }),
  );

  const result = await store.fulfillOrder({
    referenceId: "ss_abc",
    providerPaymentId: "link_1",
    chargeAmount: 3960,
    chargeCurrency: "IQD",
    paidAt: "2026-10-04T11:59:00.000Z",
    providerStatus: "Complete",
  });

  assert.deepEqual(result, { result: "fulfilled", premium_period_end: "2026-11-03T00:00:00Z" });
  assert.equal(requests[0]!.method, "POST");
  assert.equal(requests[0]!.path, "/rest/v1/rpc/fulfill_payment_order");
  assert.deepEqual(requests[0]!.body, {
    p_reference_id: "ss_abc",
    p_provider_payment_id: "link_1",
    p_charge_amount: 3960,
    p_charge_currency: "IQD",
    p_paid_at: "2026-10-04T11:59:00.000Z",
    p_provider_status: "Complete",
  });
});

test("store.fulfillOrder: a database error is thrown so the webhook can be retried", async () => {
  const { store } = setup(() => json({ message: "deadlock detected", code: "40P01" }, 500));
  await assert.rejects(
    store.fulfillOrder({
      referenceId: "ss_abc",
      providerPaymentId: "link_1",
      chargeAmount: 3960,
      chargeCurrency: "IQD",
      paidAt: "2026-10-04T11:59:00.000Z",
      providerStatus: "Complete",
    }),
  );
});

test("store.findReusableOrder: only an open, unexpired link of the same tier for this learner", async () => {
  const { store, requests } = setup(() => json([]));
  const expiringAfter = new Date("2026-10-04T12:02:00.000Z");

  await store.findReusableOrder({
    userId: "user-1",
    provider: "wayl",
    providerEnv: "test",
    pricingTier: "A",
    expiringAfter,
  });

  const params = requests[0]!.params;
  assert.equal(params.get("user_id"), "eq.user-1");
  assert.equal(params.get("provider"), "eq.wayl");
  assert.equal(params.get("provider_env"), "eq.test");
  assert.equal(params.get("pricing_tier"), "eq.A");
  assert.equal(params.get("status"), "in.(created,pending)");
  assert.equal(params.get("checkout_url"), "not.is.null");
  assert.equal(params.get("link_expires_at"), `gt.${expiringAfter.toISOString()}`);
  assert.equal(params.get("order"), "created_at.desc");
  assert.equal(params.get("limit"), "1");
});

test("store.countRecentOrders: counts this learner's orders since the cutoff", async () => {
  const { store, requests } = setup(() => json([], 200, { "Content-Range": "*/3" }));
  const since = new Date("2026-10-04T11:00:00.000Z");

  assert.equal(await store.countRecentOrders("user-1", since), 3);

  assert.equal(requests[0]!.method, "HEAD");
  assert.equal(requests[0]!.params.get("user_id"), "eq.user-1");
  assert.equal(requests[0]!.params.get("created_at"), `gte.${since.toISOString()}`);
  assert.match(requests[0]!.headers.get("Prefer") ?? "", /count=exact/);
});

test("store.insertOrder: stores the snapshot and returns the created row", async () => {
  const row = makeOrder({ status: "created" });
  const { store, requests } = setup(() => json(row, 201));

  const inserted = await store.insertOrder({
    id: row.id,
    user_id: row.user_id,
    reference_id: row.reference_id,
    provider: "wayl",
    provider_env: "test",
    pricing_tier: "B",
    pricing_country_source: "default",
    price_usd_cents: 300,
    fx_rate_per_usd: 1320,
    charge_amount: 3960,
    charge_currency: "IQD",
    premium_days: 30,
  });

  assert.deepEqual(inserted, row);
  assert.equal(requests[0]!.method, "POST");
  assert.equal(requests[0]!.path, "/rest/v1/payment_orders");
  assert.equal((requests[0]!.body as { charge_amount: number }).charge_amount, 3960);
  assert.match(requests[0]!.headers.get("Prefer") ?? "", /return=representation/);
});

test("store.listReconcilableOrders: open orders of this provider and environment, least recently verified first", async () => {
  const { store, requests } = setup(() => json([]));
  const olderThan = new Date("2026-10-04T11:58:00.000Z");

  await store.listReconcilableOrders({
    provider: "wayl",
    providerEnv: "test",
    olderThan,
    limit: 25,
  });

  const params = requests[0]!.params;
  assert.equal(params.get("provider"), "eq.wayl");
  assert.equal(params.get("provider_env"), "eq.test");
  assert.equal(params.get("status"), "in.(created,pending)");
  assert.equal(params.get("created_at"), `lt.${olderThan.toISOString()}`);
  assert.equal(params.get("order"), "last_verified_at.asc.nullsfirst");
  assert.equal(params.get("limit"), "25");
});
