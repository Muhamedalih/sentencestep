// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { getBillingProvider } from "./provider-registry";

const PAYTABS_ENV_KEYS = ["PAYTABS_PROFILE_ID", "PAYTABS_SERVER_KEY", "PAYTABS_BASE_URL"] as const;
const WAYL_ENV_KEYS = [
  "WAYL_API_KEY",
  "WAYL_WEBHOOK_SECRET",
  "WAYL_ENV",
  "WAYL_API_BASE_URL",
] as const;
const ALL_PROVIDER_ENV_KEYS = [...PAYTABS_ENV_KEYS, ...WAYL_ENV_KEYS] as const;

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

function clearedEnv(
  overrides: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return { ...Object.fromEntries(ALL_PROVIDER_ENV_KEYS.map((k) => [k, undefined])), ...overrides };
}

test("getBillingProvider: returns null with no provider env vars set (the honest default in this environment)", () => {
  withEnv(clearedEnv(), () => {
    assert.equal(getBillingProvider(), null);
  });
});

test("getBillingProvider: returns null when only some PayTabs env vars are set", () => {
  withEnv(
    clearedEnv({
      PAYTABS_PROFILE_ID: "p1",
      PAYTABS_BASE_URL: "https://secure.paytabs.example",
    }),
    () => {
      assert.equal(getBillingProvider(), null);
    },
  );
});

test("getBillingProvider: returns a PayTabs-backed provider once all three are set", () => {
  withEnv(
    clearedEnv({
      PAYTABS_PROFILE_ID: "p1",
      PAYTABS_SERVER_KEY: "key",
      PAYTABS_BASE_URL: "https://secure.paytabs.example",
    }),
    () => {
      const provider = getBillingProvider();
      assert.ok(provider);
      assert.equal(provider?.name, "paytabs");
    },
  );
});

test("getBillingProvider: returns null when only some Wayl env vars are set", () => {
  withEnv(
    clearedEnv({
      WAYL_API_KEY: "key",
      WAYL_ENV: "test",
    }),
    () => {
      assert.equal(getBillingProvider(), null);
    },
  );
});

test("getBillingProvider: returns null when Wayl is otherwise configured but WAYL_ENV is invalid", () => {
  withEnv(
    clearedEnv({
      WAYL_API_KEY: "key",
      WAYL_WEBHOOK_SECRET: "secret",
      WAYL_ENV: "production",
    }),
    () => {
      assert.equal(getBillingProvider(), null);
    },
  );
});

test("getBillingProvider: returns a Wayl-backed provider once the required env vars are set", () => {
  withEnv(
    clearedEnv({
      WAYL_API_KEY: "key",
      WAYL_WEBHOOK_SECRET: "secret",
      WAYL_ENV: "test",
    }),
    () => {
      const provider = getBillingProvider();
      assert.ok(provider);
      assert.equal(provider?.name, "wayl");
    },
  );
});

test("getBillingProvider: prefers Wayl over PayTabs when both happen to be configured", () => {
  withEnv(
    clearedEnv({
      WAYL_API_KEY: "key",
      WAYL_WEBHOOK_SECRET: "secret",
      WAYL_ENV: "test",
      PAYTABS_PROFILE_ID: "p1",
      PAYTABS_SERVER_KEY: "key",
      PAYTABS_BASE_URL: "https://secure.paytabs.example",
    }),
    () => {
      const provider = getBillingProvider();
      assert.ok(provider);
      assert.equal(provider?.name, "wayl");
    },
  );
});
