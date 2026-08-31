import { test } from "node:test";
import assert from "node:assert/strict";

import { ar } from "./ar";
import { en } from "./en";
import { es } from "./es";
import { tr } from "./tr";

/**
 * The static, automatable half of the "no missing Spanish translations"
 * requirement — TypeScript's Dictionary interface already forces every
 * dictionary to declare the same keys at compile time (see types.ts), but
 * this additionally catches what the type system can't: a key present with
 * an empty string, or a whole section accidentally left as `{}`. Runs as
 * part of `npm test`, unlike the DB-content coverage check (which needs a
 * live Supabase project and stays a manual script — see
 * scripts/check-content-integrity.ts's doc comment for why).
 */
function collectLeafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      collectLeafPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

test("dictionary parity: ar, es, and tr declare exactly the same keys as en", () => {
  const enPaths = collectLeafPaths(en).sort();
  assert.deepEqual(collectLeafPaths(ar).sort(), enPaths);
  assert.deepEqual(collectLeafPaths(es).sort(), enPaths);
  assert.deepEqual(collectLeafPaths(tr).sort(), enPaths);
});

test("dictionary completeness: no empty-string translations in ar, es, or tr", () => {
  for (const [locale, dictionary] of [
    ["ar", ar],
    ["es", es],
    ["tr", tr],
  ] as const) {
    for (const path of collectLeafPaths(dictionary)) {
      const value = path
        .split(".")
        .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], dictionary);
      assert.notEqual(value, "", `${locale}.${path} is an empty string`);
    }
  }
});
