// Run with `npm run test:billing` (also part of `npm test`).

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseGateSource, withGateSource } from "./gate-source";

test("the link keeps the lesson it leads back to and adds where the button was", () => {
  assert.equal(
    withGateSource("/upgrade?next=%2Flearn%2Fnormal%2Fnormal-3", {
      from: "lesson",
      at: "gate",
      v: "lean",
    }),
    "/upgrade?next=%2Flearn%2Fnormal%2Fnormal-3&from=lesson&at=gate&v=lean",
  );
});

test("a link without a query string starts one", () => {
  assert.equal(
    withGateSource("/upgrade", { from: "passage", at: "bar", v: "classic" }),
    "/upgrade?from=passage&at=bar&v=classic",
  );
});

test("the plans page reads back exactly what the link wrote", () => {
  for (const from of ["lesson", "word_group", "passage"] as const) {
    for (const at of ["gate", "bar"] as const) {
      for (const v of ["classic", "lean"] as const) {
        const href = withGateSource("/upgrade?next=%2Flearn", { from, at, v });
        const params = Object.fromEntries(new URL(href, "https://example.com").searchParams);
        assert.deepEqual(parseGateSource(params), { from, at, v });
      }
    }
  }
});

test("a repeated parameter counts once, as the first value", () => {
  assert.deepEqual(parseGateSource({ from: ["lesson", "passage"], at: ["bar"], v: "lean" }), {
    from: "lesson",
    at: "bar",
    v: "lean",
  });
});

test("nothing is stored unless all three words are known ones", () => {
  assert.equal(parseGateSource({}), null);
  assert.equal(parseGateSource({ from: "lesson", at: "gate" }), null);
  assert.equal(parseGateSource({ from: "lesson", at: "gate", v: "new" }), null);
  assert.equal(parseGateSource({ from: "<script>", at: "gate", v: "lean" }), null);
  assert.equal(parseGateSource({ from: "LESSON", at: "gate", v: "lean" }), null);
});
