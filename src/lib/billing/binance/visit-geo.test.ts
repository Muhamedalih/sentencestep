// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { placeFromHeaders } from "./visit-geo";

const SECRET = "s".repeat(32);

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

test("placeFromHeaders: Cloudflare's country, region and city are believed only with the secret stamp", () => {
  const original = process.env.ORIGIN_AUTH_SECRET;
  process.env.ORIGIN_AUTH_SECRET = SECRET;
  try {
    assert.deepEqual(
      placeFromHeaders(
        headers({
          "x-origin-auth": SECRET,
          "cf-ipcountry": "IQ",
          "cf-region": "Baghdad Governorate",
          "cf-ipcity": "Baghdad",
        }),
      ),
      { country: "iq", region: "Baghdad Governorate", city: "Baghdad" },
    );
    // A request that did not come through our proxy can claim anything: it is ignored.
    assert.deepEqual(
      placeFromHeaders(
        headers({ "cf-ipcountry": "IQ", "cf-region": "Anywhere", "cf-ipcity": "Nowhere" }),
      ),
      { country: null, region: null, city: null },
    );
  } finally {
    if (original === undefined) delete process.env.ORIGIN_AUTH_SECRET;
    else process.env.ORIGIN_AUTH_SECRET = original;
  }
});

test("placeFromHeaders: behind the proxy but without the location options on, only the country is known", () => {
  const original = process.env.ORIGIN_AUTH_SECRET;
  process.env.ORIGIN_AUTH_SECRET = SECRET;
  try {
    assert.deepEqual(placeFromHeaders(headers({ "x-origin-auth": SECRET, "cf-ipcountry": "EG" })), {
      country: "eg",
      region: null,
      city: null,
    });
  } finally {
    if (original === undefined) delete process.env.ORIGIN_AUTH_SECRET;
    else process.env.ORIGIN_AUTH_SECRET = original;
  }
});
