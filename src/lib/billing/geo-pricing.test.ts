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

test("parseNetlifyGeoCountry: reads the country code and lowercases it", () => {
  const value = geoHeader({ city: "Baghdad", country: { code: "IQ", name: "Iraq" } });
  assert.equal(parseNetlifyGeoCountry(value), "iq");
});

test("parseNetlifyGeoCountry: rejects values that are not a two-letter code", () => {
  assert.equal(parseNetlifyGeoCountry(geoHeader({ country: { code: "IRQ" } })), null);
  assert.equal(parseNetlifyGeoCountry(geoHeader({ country: { code: "1Q" } })), null);
  assert.equal(parseNetlifyGeoCountry(geoHeader({ country: { code: 12 } })), null);
  assert.equal(parseNetlifyGeoCountry(geoHeader({ country: {} })), null);
  assert.equal(parseNetlifyGeoCountry(geoHeader({})), null);
  assert.equal(parseNetlifyGeoCountry(geoHeader(null)), null);
});

test("parseNetlifyGeoCountry: garbage is not a country", () => {
  assert.equal(parseNetlifyGeoCountry("not base64 json"), null);
  assert.equal(parseNetlifyGeoCountry(""), null);
  assert.equal(parseNetlifyGeoCountry(Buffer.from("{broken").toString("base64")), null);
});

test("resolvePricingCountry: uses the Netlify geo header", () => {
  const headers = headersOf({ "x-nf-geo": geoHeader({ country: { code: "EG" } }) });
  assert.deepEqual(resolvePricingCountry(headers), { country: "eg", source: "netlify_geo" });
});

test("resolvePricingCountry: no header means the default, with no country", () => {
  assert.deepEqual(resolvePricingCountry(headersOf({})), { country: null, source: "default" });
});

test("resolvePricingCountry: an unparseable header also falls back to the default", () => {
  assert.deepEqual(resolvePricingCountry(headersOf({ "x-nf-geo": "%%%" })), {
    country: null,
    source: "default",
  });
});

test("resolvePricingCountry: ignores headers the platform does not own, which a client could forge", () => {
  const headers = headersOf({
    "x-vercel-ip-country": "IQ",
    "cf-ipcountry": "IQ",
    "x-country": "IQ",
  });
  assert.deepEqual(resolvePricingCountry(headers), { country: null, source: "default" });
});
