// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { getEmailProvider } from "./provider-registry";

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

test("getEmailProvider: returns null when EMAIL_PROVIDER_API_KEY is unset", () => {
  withEnv({ EMAIL_PROVIDER_API_KEY: undefined, EMAIL_FROM_ADDRESS: "noreply@example.com" }, () => {
    assert.equal(getEmailProvider(), null);
  });
});

test("getEmailProvider: returns null when EMAIL_FROM_ADDRESS is unset", () => {
  withEnv({ EMAIL_PROVIDER_API_KEY: "key", EMAIL_FROM_ADDRESS: undefined }, () => {
    assert.equal(getEmailProvider(), null);
  });
});

test("getEmailProvider: returns a Resend-backed provider once both are set", () => {
  withEnv({ EMAIL_PROVIDER_API_KEY: "key", EMAIL_FROM_ADDRESS: "noreply@example.com" }, () => {
    const provider = getEmailProvider();
    assert.ok(provider);
    assert.equal(provider?.name, "resend");
  });
});
