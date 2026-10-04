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
