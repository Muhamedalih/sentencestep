// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { getEmailProvider, resolveReplyTo } from "./provider-registry";

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

test("getEmailProvider: an empty EMAIL_REPLY_TO_ADDRESS is treated as unset", () => {
  withEnv(
    {
      EMAIL_PROVIDER_API_KEY: "key",
      EMAIL_FROM_ADDRESS: "noreply@example.com",
      EMAIL_REPLY_TO_ADDRESS: "",
    },
    () => {
      assert.equal(getEmailProvider()?.name, "resend");
    },
  );
});

test("resolveReplyTo: accepts a bare or named address and trims it", () => {
  assert.equal(resolveReplyTo("support@x.resend.app"), "support@x.resend.app");
  assert.equal(resolveReplyTo("  support@x.resend.app \n"), "support@x.resend.app");
  assert.equal(
    resolveReplyTo("SentenceStep <support@x.resend.app>"),
    "SentenceStep <support@x.resend.app>",
  );
});

test("resolveReplyTo: unset or blank means none", () => {
  assert.equal(resolveReplyTo(undefined), undefined);
  assert.equal(resolveReplyTo("   "), undefined);
});

test("resolveReplyTo: a malformed value is dropped instead of breaking every send", () => {
  assert.equal(resolveReplyTo("<anything>@trenaaxuju.resend.app"), undefined);
  assert.equal(resolveReplyTo("not an address"), undefined);
  assert.equal(resolveReplyTo("two@@x.com"), undefined);
  assert.equal(resolveReplyTo("support@x"), undefined);
});

test("getEmailProvider: a malformed EMAIL_REPLY_TO_ADDRESS still yields a working provider that sends no reply_to", async () => {
  const original = {
    key: process.env.EMAIL_PROVIDER_API_KEY,
    from: process.env.EMAIL_FROM_ADDRESS,
    replyTo: process.env.EMAIL_REPLY_TO_ADDRESS,
    fetch: globalThis.fetch,
  };
  let sent: Record<string, unknown> = {};
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    sent = JSON.parse(init?.body as string);
    return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
  }) as typeof fetch;

  try {
    process.env.EMAIL_PROVIDER_API_KEY = "key";
    process.env.EMAIL_FROM_ADDRESS = "noreply@example.com";
    process.env.EMAIL_REPLY_TO_ADDRESS = "<anything>@x.resend.app";

    const provider = getEmailProvider();
    assert.ok(provider);
    await provider.sendEmail({ to: "a@example.com", subject: "s", html: "h", text: "t" });
    assert.ok(!("reply_to" in sent));
  } finally {
    for (const [name, value] of [
      ["EMAIL_PROVIDER_API_KEY", original.key],
      ["EMAIL_FROM_ADDRESS", original.from],
      ["EMAIL_REPLY_TO_ADDRESS", original.replyTo],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    globalThis.fetch = original.fetch;
  }
});
