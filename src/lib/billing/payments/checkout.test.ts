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

  const result = await createCheckout(deps, { userId: "user-1", country: iraq, origin: ORIGIN });

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

  await createCheckout(deps, { userId: "user-1", country: unknown, origin: ORIGIN });

  assert.equal(store.inserted[0]!.pricing_tier, "B");
  assert.equal(store.inserted[0]!.price_usd_cents, 300);
  assert.equal(store.inserted[0]!.pricing_country, null);
  assert.equal(store.inserted[0]!.pricing_country_source, "default");
  assert.equal(provider.created[0]!.amount, 3960);
});

test("createCheckout: the provider is asked for a link with our own callback URLs, a reference and a 1h expiry", async () => {
  const { provider, deps } = setup();

  await createCheckout(deps, { userId: "user-1", country: unknown, origin: `${ORIGIN}/` });

  assert.deepEqual(provider.created[0]!, {
    referenceId: "ss_123e4567e89b12d3a456426614174000",
    amount: 3960,
    currency: "IQD",
    description: "SentenceStep Premium (30 days)",
    webhookUrl: `${ORIGIN}/api/billing/webhook/wayl`,
    redirectUrl: `${ORIGIN}/billing/return`,
    expiresIn: "1h",
  });
});

test("createCheckout: the order is marked pending with the provider's link once it exists", async () => {
  const { store, deps } = setup();

  await createCheckout(deps, { userId: "user-1", country: unknown, origin: ORIGIN });

  const order = store.get("ss_123e4567e89b12d3a456426614174000");
  assert.equal(order.status, "pending");
  assert.equal(order.provider_payment_id, "link_new");
  assert.equal(order.checkout_url, "https://pay.example.com/link_new");
  assert.equal(order.link_expires_at, iso(60 * 60 * 1000));
});

test("createCheckout: a provider whose currency has no fixed rate is refused before any order is stored", async () => {
  const { store, deps } = setup({ settlementCurrency: "EUR" });

  await assert.rejects(
    createCheckout(deps, { userId: "user-1", country: iraq, origin: ORIGIN }),
    /No fixed exchange rate/,
  );
  assert.equal(store.inserted.length, 0);
});

test("createCheckout: clicking Pay again while a link is open reuses it instead of creating another order", async () => {
  const { store, provider, deps } = setup();
  store.reusable = makeOrder({ pricing_tier: "B", charge_amount: 3960 });

  const result = await createCheckout(deps, { userId: "user-1", country: unknown, origin: ORIGIN });

  assert.deepEqual(result, { ok: true, url: "https://pay.example.com/link_1", reused: true });
  assert.equal(store.inserted.length, 0);
  assert.equal(provider.created.length, 0);
});

test("createCheckout: an open link priced differently from today's price is not reused", async () => {
  const { store, provider, deps } = setup();
  store.reusable = makeOrder({ charge_amount: 5000 });

  const result = await createCheckout(deps, { userId: "user-1", country: unknown, origin: ORIGIN });

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

  const result = await createCheckout(deps, { userId: "user-1", country: iraq, origin: ORIGIN });

  assert.deepEqual(result, { ok: false, error: "provider_unavailable" });
  const order = store.get("ss_123e4567e89b12d3a456426614174000");
  assert.equal(order.status, "failed");
  assert.equal(order.failure_reason, "link_creation_failed: Wayl POST failed (503)");
  assert.equal(alerts[0]!.code, "checkout_link_creation_failed");
});
