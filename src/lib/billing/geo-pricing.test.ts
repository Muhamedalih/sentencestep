// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseNetlifyGeoCountry, resolvePricingCountry } from "./geo-pricing";

function geoHeader(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

function headersOf(entries: Record<string, string>) {
  return {
    get(name: string): string | null {
      return entries[name.toLowerCase()] ?? null;
    },
  };
}

const NO_HEADERS = headersOf({});
const FORGED_HEADERS = headersOf({
  "x-nf-geo": geoHeader({ country: { code: "IQ" } }),
  "x-vercel-ip-country": "IQ",
  "cf-ipcountry": "IQ",
  "x-country": "IQ",
});

test("resolvePricingCountry: on Netlify the country comes from Netlify.context.geo, lowercased", () => {
  const context = { geo: { country: { code: "IQ", name: "Iraq" } } };
  assert.deepEqual(resolvePricingCountry(NO_HEADERS, { context }), {
    country: "iq",
    source: "netlify_geo",
  });
});

test("resolvePricingCountry: on Netlify every request header is ignored, even when no country is known", () => {
  assert.deepEqual(resolvePricingCountry(FORGED_HEADERS, { context: {} }), {
    country: null,
    source: "default",
  });
  assert.deepEqual(
    resolvePricingCountry(FORGED_HEADERS, { context: { geo: null }, allowHeaderFallback: true }),
    { country: null, source: "default" },
  );
});

test("resolvePricingCountry: a real Netlify country beats whatever a client sends", () => {
  const context = { geo: { country: { code: "US" } } };
  assert.deepEqual(resolvePricingCountry(FORGED_HEADERS, { context, allowHeaderFallback: true }), {
    country: "us",
    source: "netlify_geo",
  });
});

test("resolvePricingCountry: an unusable Netlify country code falls back to the default", () => {
  for (const code of ["IRQ", "1Q", "", 12, null, undefined]) {
    assert.deepEqual(
      resolvePricingCountry(NO_HEADERS, { context: { geo: { country: { code } } } }),
      {
        country: null,
        source: "default",
      },
    );
  }
});

test("resolvePricingCountry: in production, outside Netlify, headers are never trusted", () => {
  assert.deepEqual(
    resolvePricingCountry(FORGED_HEADERS, { context: null, allowHeaderFallback: false }),
    { country: null, source: "default" },
  );
});

test("resolvePricingCountry: outside production the x-nf-geo header lets tiers be tried locally, and only that header", () => {
  const options = { context: null, allowHeaderFallback: true };
  assert.deepEqual(
    resolvePricingCountry(
      headersOf({ "x-nf-geo": geoHeader({ country: { code: "EG" } }) }),
      options,
    ),
    { country: "eg", source: "netlify_geo" },
  );
  assert.deepEqual(
    resolvePricingCountry(
      headersOf({ "x-vercel-ip-country": "IQ", "cf-ipcountry": "IQ", "x-country": "IQ" }),
      options,
    ),
    { country: null, source: "default" },
  );
});

test("resolvePricingCountry: no context and no header means the default", () => {
  assert.deepEqual(
    resolvePricingCountry(NO_HEADERS, { context: null, allowHeaderFallback: true }),
    {
      country: null,
      source: "default",
    },
  );
});

test("resolvePricingCountry: with no options it reads the real global, which does not exist outside Netlify", () => {
  const original = (globalThis as { Netlify?: unknown }).Netlify;
  delete (globalThis as { Netlify?: unknown }).Netlify;
  try {
    assert.deepEqual(resolvePricingCountry(NO_HEADERS), { country: null, source: "default" });

    (globalThis as { Netlify?: unknown }).Netlify = {
      context: { geo: { country: { code: "SD" } } },
    };
    assert.deepEqual(resolvePricingCountry(FORGED_HEADERS), {
      country: "sd",
      source: "netlify_geo",
    });
  } finally {
    if (original === undefined) delete (globalThis as { Netlify?: unknown }).Netlify;
    else (globalThis as { Netlify?: unknown }).Netlify = original;
  }
});

test("parseNetlifyGeoCountry: reads the country code of the development header and rejects junk", () => {
  assert.equal(parseNetlifyGeoCountry(geoHeader({ country: { code: "IQ" } })), "iq");
  assert.equal(parseNetlifyGeoCountry(geoHeader({ country: { code: "IRQ" } })), null);
  assert.equal(parseNetlifyGeoCountry(geoHeader({})), null);
  assert.equal(parseNetlifyGeoCountry(geoHeader(null)), null);
  assert.equal(parseNetlifyGeoCountry("not base64 json"), null);
  assert.equal(parseNetlifyGeoCountry(""), null);
});

// --- Behind our own Cloudflare zone (the self-hosted server) -----------------

const ORIGIN_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";
const CF_HEADERS = headersOf({ "x-origin-auth": ORIGIN_SECRET, "cf-ipcountry": "IQ" });

test("resolvePricingCountry: behind Cloudflare, with the secret stamp, the cf-ipcountry country is used (lowercased)", () => {
  assert.deepEqual(
    resolvePricingCountry(CF_HEADERS, { context: null, originSecret: ORIGIN_SECRET }),
    { country: "iq", source: "cloudflare_geo" },
  );
});

test("resolvePricingCountry: cf-ipcountry WITHOUT the secret stamp is forged input and is ignored, even in production", () => {
  const forged = headersOf({ "cf-ipcountry": "IQ" });
  assert.deepEqual(
    resolvePricingCountry(forged, {
      context: null,
      originSecret: ORIGIN_SECRET,
      allowHeaderFallback: false,
    }),
    { country: null, source: "default" },
  );
});

test("resolvePricingCountry: a WRONG secret stamp does not unlock cf-ipcountry", () => {
  const wrong = headersOf({
    "x-origin-auth": "f".repeat(ORIGIN_SECRET.length),
    "cf-ipcountry": "IQ",
  });
  assert.deepEqual(resolvePricingCountry(wrong, { context: null, originSecret: ORIGIN_SECRET }), {
    country: null,
    source: "default",
  });
});

test("resolvePricingCountry: with no secret configured on the server, Cloudflare headers are never trusted", () => {
  for (const originSecret of [null, "", "short"]) {
    assert.deepEqual(resolvePricingCountry(CF_HEADERS, { context: null, originSecret }), {
      country: null,
      source: "default",
    });
  }
});

test("resolvePricingCountry: Cloudflare's placeholders (XX unknown, T1 Tor) and junk select no tier", () => {
  for (const value of ["XX", "xx", "T1", "t1", "IRQ", "1Q", "", " "]) {
    const headers = headersOf({ "x-origin-auth": ORIGIN_SECRET, "cf-ipcountry": value });
    assert.deepEqual(
      resolvePricingCountry(headers, { context: null, originSecret: ORIGIN_SECRET }),
      {
        country: null,
        source: "default",
      },
    );
  }
});

test("resolvePricingCountry: a stamped request with no cf-ipcountry at all falls back to the default", () => {
  const headers = headersOf({ "x-origin-auth": ORIGIN_SECRET });
  assert.deepEqual(resolvePricingCountry(headers, { context: null, originSecret: ORIGIN_SECRET }), {
    country: null,
    source: "default",
  });
});

test("resolvePricingCountry: on Netlify the platform geo wins over Cloudflare headers, stamped or not", () => {
  const context = { geo: { country: { code: "US" } } };
  assert.deepEqual(resolvePricingCountry(CF_HEADERS, { context, originSecret: ORIGIN_SECRET }), {
    country: "us",
    source: "netlify_geo",
  });
  assert.deepEqual(
    resolvePricingCountry(CF_HEADERS, { context: {}, originSecret: ORIGIN_SECRET }),
    { country: null, source: "default" },
  );
});

test("resolvePricingCountry: the secret is read from ORIGIN_AUTH_SECRET when not passed explicitly", () => {
  const original = process.env.ORIGIN_AUTH_SECRET;
  try {
    process.env.ORIGIN_AUTH_SECRET = ORIGIN_SECRET;
    assert.deepEqual(resolvePricingCountry(CF_HEADERS, { context: null }), {
      country: "iq",
      source: "cloudflare_geo",
    });
    delete process.env.ORIGIN_AUTH_SECRET;
    assert.deepEqual(
      resolvePricingCountry(CF_HEADERS, { context: null, allowHeaderFallback: false }),
      {
        country: null,
        source: "default",
      },
    );
  } finally {
    if (original === undefined) delete process.env.ORIGIN_AUTH_SECRET;
    else process.env.ORIGIN_AUTH_SECRET = original;
  }
});
