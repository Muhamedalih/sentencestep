// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { getBillingProvider } from "./provider-registry";

const PAYTABS_ENV_KEYS = ["PAYTABS_PROFILE_ID", "PAYTABS_SERVER_KEY", "PAYTABS_BASE_URL"] as const;

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

test("getBillingProvider: returns null with no PayTabs env vars set (the honest default in this environment)", () => {
  withEnv(Object.fromEntries(PAYTABS_ENV_KEYS.map((k) => [k, undefined])), () => {
    assert.equal(getBillingProvider(), null);
  });
});

test("getBillingProvider: returns null when only some PayTabs env vars are set", () => {
  withEnv(
    {
      PAYTABS_PROFILE_ID: "p1",
      PAYTABS_SERVER_KEY: undefined,
      PAYTABS_BASE_URL: "https://secure.paytabs.example",
    },
    () => {
      assert.equal(getBillingProvider(), null);
    },
  );
});

test("getBillingProvider: returns a PayTabs-backed provider once all three are set", () => {
  withEnv(
    {
      PAYTABS_PROFILE_ID: "p1",
      PAYTABS_SERVER_KEY: "key",
      PAYTABS_BASE_URL: "https://secure.paytabs.example",
    },
    () => {
      const provider = getBillingProvider();
      assert.ok(provider);
      assert.equal(provider?.name, "paytabs");
    },
  );
});
