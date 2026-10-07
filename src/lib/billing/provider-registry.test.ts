// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { getPaymentProvider } from "./provider-registry";

const SECRET = "0123456789abcdef0123456789abcdef";

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const original: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    original[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(original)) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
}

test("getPaymentProvider: returns null with no Wayl env vars set (the honest default)", () => {
  withEnv({ WAYL_API_KEY: undefined, WAYL_WEBHOOK_SECRET: undefined, WAYL_ENV: undefined }, () =>
    assert.equal(getPaymentProvider(), null),
  );
});

test("getPaymentProvider: returns null when any one of the three is missing", () => {
  const complete = { WAYL_API_KEY: "k", WAYL_WEBHOOK_SECRET: SECRET, WAYL_ENV: "test" };
  for (const missing of Object.keys(complete)) {
    withEnv({ ...complete, [missing]: undefined }, () => assert.equal(getPaymentProvider(), null));
  }
});

test("getPaymentProvider: rejects a webhook secret that is too short to be safe", () => {
  withEnv({ WAYL_API_KEY: "k", WAYL_WEBHOOK_SECRET: "short", WAYL_ENV: "test" }, () =>
    assert.equal(getPaymentProvider(), null),
  );
});

test("getPaymentProvider: WAYL_ENV must be exactly live or test", () => {
  withEnv({ WAYL_API_KEY: "k", WAYL_WEBHOOK_SECRET: SECRET, WAYL_ENV: "staging" }, () =>
    assert.equal(getPaymentProvider(), null),
  );
});

test("getPaymentProvider: test environment returns a Wayl provider", () => {
  withEnv({ WAYL_API_KEY: "k", WAYL_WEBHOOK_SECRET: SECRET, WAYL_ENV: "test" }, () => {
    const provider = getPaymentProvider();
    assert.equal(provider?.name, "wayl");
    assert.equal(provider?.environment, "test");
    assert.equal(provider?.settlementCurrency, "IQD");
  });
});

test("getPaymentProvider: live is refused outside a production build", () => {
  withEnv(
    { WAYL_API_KEY: "k", WAYL_WEBHOOK_SECRET: SECRET, WAYL_ENV: "live", NODE_ENV: "development" },
    () => assert.equal(getPaymentProvider(), null),
  );
});

test("getPaymentProvider: live works in a production build", () => {
  withEnv(
    { WAYL_API_KEY: "k", WAYL_WEBHOOK_SECRET: SECRET, WAYL_ENV: "live", NODE_ENV: "production" },
    () => {
      const provider = getPaymentProvider();
      assert.equal(provider?.name, "wayl");
      assert.equal(provider?.environment, "live");
    },
  );
});

async function checkoutUrlWith(showUsd: string | undefined): Promise<string> {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        data: {
          id: "link_1",
          referenceId: "ss_ref",
          total: "3040",
          currency: "IQD",
          status: "Created",
          url: "https://pay.example.com/link_1",
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;

  let url = "";
  const vars = {
    WAYL_API_KEY: "k",
    WAYL_WEBHOOK_SECRET: SECRET,
    WAYL_ENV: "test",
    WAYL_SHOW_USD: showUsd,
  };
  const original: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    original[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    const provider = getPaymentProvider();
    assert.ok(provider);
    const result = await provider.createPayment({
      referenceId: "ss_ref",
      amount: 3040,
      currency: "IQD",
      description: "SentenceStep Premium (30 days) - $2",
      webhookUrl: "https://sentencestep.example/api/billing/webhook/wayl",
      redirectUrl: "https://sentencestep.example/billing/return",
      expiresIn: "1h",
    });
    url = result.checkoutUrl;
  } finally {
    globalThis.fetch = realFetch;
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  return url;
}

test("getPaymentProvider: Wayl's page is asked to show dollars unless WAYL_SHOW_USD says otherwise", async () => {
  const asked = "https://pay.example.com/link_1?currency=usd";
  assert.equal(await checkoutUrlWith(undefined), asked);
  assert.equal(await checkoutUrlWith(""), asked);
  assert.equal(await checkoutUrlWith("true"), asked);
});

test("getPaymentProvider: WAYL_SHOW_USD=false (or 0, no, off, any case) leaves Wayl's page in dinars", async () => {
  for (const value of ["false", "FALSE", " false ", "0", "no", "off"]) {
    assert.equal(await checkoutUrlWith(value), "https://pay.example.com/link_1", value);
  }
});
