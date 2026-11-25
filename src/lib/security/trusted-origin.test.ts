// Run with `npm run test:security`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { trustedOrigin } from "./trusted-origin";

function withSite<T>(site: string | undefined, run: () => T): T {
  const original = process.env.NEXT_PUBLIC_SITE_URL;
  if (site === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = site;
  try {
    return run();
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  }
}

test("trustedOrigin: the site's own origin, its www form and its subdomains are kept", () => {
  withSite("https://sentencestep.com", () => {
    assert.equal(trustedOrigin("https://sentencestep.com"), "https://sentencestep.com");
    assert.equal(trustedOrigin("https://www.sentencestep.com"), "https://www.sentencestep.com");
    assert.equal(
      trustedOrigin("https://staging.sentencestep.com"),
      "https://staging.sentencestep.com",
    );
  });
});

test("trustedOrigin: the visitor's own machine is kept (local development)", () => {
  withSite("https://sentencestep.com", () => {
    assert.equal(trustedOrigin("http://localhost:3000"), "http://localhost:3000");
    assert.equal(trustedOrigin("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  });
});

test("trustedOrigin: any other host is replaced by the configured site address", () => {
  withSite("https://sentencestep.com", () => {
    for (const candidate of [
      "https://evil.example",
      "https://sentencestep.com.evil.example",
      "https://evilsentencestep.com",
      "https://sentencestep.com@evil.example",
      "https://user:pw@sentencestep.com",
      "javascript:alert(1)",
      "not a url",
      "",
      null,
      undefined,
    ]) {
      assert.equal(trustedOrigin(candidate), "https://sentencestep.com", String(candidate));
    }
  });
});

test("trustedOrigin: with no configured address the built-in production one is the fallback", () => {
  withSite(undefined, () => {
    assert.equal(trustedOrigin("https://evil.example"), "https://sentencestep.com");
  });
});
