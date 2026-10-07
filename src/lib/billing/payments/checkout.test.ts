// Run with `npm run test:billing`. Fakes only — no database, no network.

import { test } from "node:test";
import assert from "node:assert/strict";

import { PaymentProviderError } from "@/lib/billing/payment-provider";

import { createCheckout } from "./checkout";
import {
  InMemoryPaymentStore,
  NOW,
  collectAlerts,
  iso,
  makeFakeProvider,
  makeOrder,
} from "./test-support";

const ORIGIN = "https://sentencestep.example";
const ID = "123e4567-e89b-12d3-a456-426614174000";

function setup(options: Parameters<typeof makeFakeProvider>[0] = {}) {
  const store = new InMemoryPaymentStore();
  const provider = makeFakeProvider(options);
  const { alerts, report } = collectAlerts();
  const deps = { provider, store, report, now: () => new Date(NOW), newId: () => ID };
  return { store, provider, alerts, deps };
}

const iraq = { country: "iq", source: "netlify_geo" } as const;
const unknown = { country: null, source: "default" } as const;

test("createCheckout: a Tier A country is priced $2 and charged 2640 IQD, with the full snapshot stored", async () => {
  const { store, provider, deps } = setup();

  const result = await createCheckout(deps, {
    userId: "user-1",
    country: iraq,
    origin: ORIGIN,
    plan: "1m",
  });

  assert.deepEqual(result, { ok: true, url: "https://pay.example.com/link_new", reused: false });
  assert.equal(store.inserted.length, 1);
  assert.deepEqual(store.inserted[0]!, {
    id: ID,
    user_id: "user-1",
    reference_id: "ss_123e4567e89b12d3a456426614174000",
    provider: "wayl",
    provider_env: "test",
    pricing_tier: "A",
    pricing_country: "iq",
    pricing_country_source: "netlify_geo",
    price_usd_cents: 200,
    fx_rate_per_usd: 1320,
    charge_amount: 2640,
    charge_currency: "IQD",
    premium_days: 30,
    status: "created",
  });
  assert.equal(provider.created[0]!.amount, 2640);
  assert.equal(provider.created[0]!.currency, "IQD");
});

test("createCheckout: an unknown country is priced $3 and charged 3960 IQD", async () => {
  const { store, provider, deps } = setup();

  await createCheckout(deps, { userId: "user-1", country: unknown, origin: ORIGIN, plan: "1m" });

  assert.equal(store.inserted[0]!.pricing_tier, "B");
  assert.equal(store.inserted[0]!.price_usd_cents, 300);
  assert.equal(store.inserted[0]!.pricing_country, null);
  assert.equal(store.inserted[0]!.pricing_country_source, "default");
  assert.equal(provider.created[0]!.amount, 3960);
});

test("createCheckout: the provider is asked for a link with our own callback URLs, a reference and a 1h expiry", async () => {
  const { provider, deps } = setup();

  await createCheckout(deps, {
    userId: "user-1",
    country: unknown,
    origin: `${ORIGIN}/`,
    plan: "1m",
  });

  assert.deepEqual(provider.created[0]!, {
    referenceId: "ss_123e4567e89b12d3a456426614174000",
    amount: 3960,
    currency: "IQD",
    description: "SentenceStep Premium (30 days) - $3",
    webhookUrl: `${ORIGIN}/api/billing/webhook/wayl`,
    redirectUrl: `${ORIGIN}/billing/return`,
    expiresIn: "1h",
  });
});

test("createCheckout: the product line names the dollar price of the buyer's tier", async () => {
  const tierA = setup();
  await createCheckout(tierA.deps, { userId: "user-1", country: iraq, origin: ORIGIN, plan: "1m" });
  assert.equal(tierA.provider.created[0]!.amount, 2640);
  assert.equal(tierA.provider.created[0]!.description, "SentenceStep Premium (30 days) - $2");

  const tierB = setup();
  await createCheckout(tierB.deps, {
    userId: "user-1",
    country: unknown,
    origin: ORIGIN,
    plan: "1m",
  });
  assert.equal(tierB.provider.created[0]!.amount, 3960);
  assert.equal(tierB.provider.created[0]!.description, "SentenceStep Premium (30 days) - $3");
});

test("createCheckout: each plan is priced from the server's table and stores its own days", async () => {
  const expected = [
    { plan: "1m", cents: 200, days: 30, amount: 2640, label: "30 days) - $2" },
    { plan: "3m", cents: 400, days: 90, amount: 5280, label: "90 days) - $4" },
    { plan: "6m", cents: 700, days: 180, amount: 9240, label: "180 days) - $7" },
  ] as const;

  for (const { plan, cents, days, amount, label } of expected) {
    const { store, provider, deps } = setup();
    await createCheckout(deps, { userId: "user-1", country: iraq, origin: ORIGIN, plan });

    const order = store.inserted[0]!;
    assert.equal(order.price_usd_cents, cents, plan);
    assert.equal(order.premium_days, days, plan);
    assert.equal(order.charge_amount, amount, plan);
    assert.equal(provider.created[0]!.amount, amount, plan);
    assert.ok(provider.created[0]!.description.endsWith(label), plan);
  }
});

test("createCheckout: launch-offer bonus days go into the order's days and the product line, never the price", async () => {
  const { store, provider, deps } = setup();

  await createCheckout(deps, {
    userId: "user-1",
    country: iraq,
    origin: ORIGIN,
    plan: "3m",
    bonusDays: 7,
  });

  const order = store.inserted[0]!;
  assert.equal(order.premium_days, 97);
  assert.equal(order.price_usd_cents, 400);
  assert.equal(order.charge_amount, 5280);
  assert.equal(provider.created[0]!.amount, 5280);
  assert.ok(provider.created[0]!.description.endsWith("(97 days) - $4"));
  assert.equal(store.reusableQueries[0]!.premiumDays, 97);
});

test("createCheckout: an open link for the same plan without the bonus is not reused once the offer applies", async () => {
  const { store, provider, deps } = setup();
  store.reusable = makeOrder({ pricing_tier: "A", charge_amount: 5280, premium_days: 90 });

  const result = await createCheckout(deps, {
    userId: "user-1",
    country: iraq,
    origin: ORIGIN,
    plan: "3m",
    bonusDays: 7,
  });

  assert.equal(result.ok && result.reused, false);
  assert.equal(provider.created.length, 1);
});

test("createCheckout: Tier B plans cost $3, $6 and $10", async () => {
  const cents: number[] = [];
  for (const plan of ["1m", "3m", "6m"] as const) {
    const { store, deps } = setup();
    await createCheckout(deps, { userId: "user-1", country: unknown, origin: ORIGIN, plan });
    cents.push(store.inserted[0]!.price_usd_cents);
  }
  assert.deepEqual(cents, [300, 600, 1000]);
});

test("createCheckout: an open link for another plan is asked for by length and never reused for this one", async () => {
  const { store, provider, deps } = setup();
  // The store hands back a still-open one-month order (30 days, $2).
  store.reusable = makeOrder({ pricing_tier: "A", charge_amount: 2640, premium_days: 30 });

  const result = await createCheckout(deps, {
    userId: "user-1",
    country: iraq,
    origin: ORIGIN,
    plan: "3m",
  });

  assert.equal(store.reusableQueries[0]!.premiumDays, 90);
  assert.equal(result.ok && result.reused, false);
  assert.equal(provider.created.length, 1);
  assert.equal(store.inserted[0]!.premium_days, 90);
});

test("createCheckout: the order is marked pending with the provider's link once it exists", async () => {
  const { store, deps } = setup();

  await createCheckout(deps, { userId: "user-1", country: unknown, origin: ORIGIN, plan: "1m" });

  const order = store.get("ss_123e4567e89b12d3a456426614174000");
  assert.equal(order.status, "pending");
  assert.equal(order.provider_payment_id, "link_new");
  assert.equal(order.checkout_url, "https://pay.example.com/link_new");
  assert.equal(order.link_expires_at, iso(60 * 60 * 1000));
});

test("createCheckout: a provider whose currency has no fixed rate is refused before any order is stored", async () => {
  const { store, deps } = setup({ settlementCurrency: "EUR" });

  await assert.rejects(
    createCheckout(deps, { userId: "user-1", country: iraq, origin: ORIGIN, plan: "1m" }),
    /No fixed exchange rate/,
  );
  assert.equal(store.inserted.length, 0);
});

test("createCheckout: clicking Pay again while a link is open reuses it instead of creating another order", async () => {
  const { store, provider, deps } = setup();
  store.reusable = makeOrder({ pricing_tier: "B", charge_amount: 3960 });

  const result = await createCheckout(deps, {
    userId: "user-1",
    country: unknown,
    origin: ORIGIN,
    plan: "1m",
  });

  assert.deepEqual(result, { ok: true, url: "https://pay.example.com/link_1", reused: true });
  assert.equal(store.inserted.length, 0);
  assert.equal(provider.created.length, 0);
});

test("createCheckout: an open link priced differently from today's price is not reused", async () => {
  const { store, provider, deps } = setup();
  store.reusable = makeOrder({ charge_amount: 5000 });

  const result = await createCheckout(deps, {
    userId: "user-1",
    country: unknown,
    origin: ORIGIN,
    plan: "1m",
  });

  assert.equal(result.ok && result.reused, false);
  assert.equal(provider.created.length, 1);
});

test("createCheckout: too many recent attempts are rate limited, but reusing an open link still works", async () => {
  const limited = setup();
  limited.store.recentOrderCount = 5;
  const blocked = await createCheckout(limited.deps, {
    userId: "user-1",
    country: unknown,
    origin: ORIGIN,
    plan: "1m",
  });
  assert.deepEqual(blocked, { ok: false, error: "rate_limited" });
  assert.equal(limited.store.inserted.length, 0);
  assert.equal(limited.provider.created.length, 0);

  const reuse = setup();
  reuse.store.recentOrderCount = 5;
  reuse.store.reusable = makeOrder();
  const reused = await createCheckout(reuse.deps, {
    userId: "user-1",
    country: unknown,
    origin: ORIGIN,
    plan: "1m",
  });
  assert.equal(reused.ok, true);
});

test("createCheckout: when the provider cannot create the link the order is failed, an alert is raised and no URL is returned", async () => {
  const { store, alerts, deps } = setup({
    createResult: new PaymentProviderError("Wayl POST failed (503)", {
      retryable: true,
      status: 503,
    }),
  });

  const result = await createCheckout(deps, {
    userId: "user-1",
    country: iraq,
    origin: ORIGIN,
    plan: "1m",
  });

  assert.deepEqual(result, { ok: false, error: "provider_unavailable" });
  const order = store.get("ss_123e4567e89b12d3a456426614174000");
  assert.equal(order.status, "failed");
  assert.equal(order.failure_reason, "link_creation_failed: Wayl POST failed (503)");
  assert.equal(alerts[0]!.code, "checkout_link_creation_failed");
});
