// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseAmountUnits, wholeToUnits } from "./amount";

test("parseAmountUnits: reads Binance's decimal strings exactly", () => {
  assert.equal(parseAmountUnits("6"), 600_000_000n);
  assert.equal(parseAmountUnits("6.00000000"), 600_000_000n);
  assert.equal(parseAmountUnits("6.5"), 650_000_000n);
  assert.equal(parseAmountUnits("0.00000001"), 1n);
  assert.equal(parseAmountUnits("1.037"), 103_700_000n);
  assert.equal(parseAmountUnits(" 12.25 "), 1_225_000_000n);
});

test("parseAmountUnits: a number is read through its text, never as floating-point maths", () => {
  assert.equal(parseAmountUnits(6), 600_000_000n);
  assert.equal(parseAmountUnits(2.1), 210_000_000n);
});

test("parseAmountUnits: nothing that is not a plain non-negative decimal", () => {
  for (const bad of [
    "",
    "-1",
    "+1",
    "1e3",
    "1,5",
    "abc",
    "1.123456789",
    ".5",
    "5.",
    null,
    undefined,
    {},
  ]) {
    assert.equal(parseAmountUnits(bad), null, String(bad));
  }
  assert.equal(parseAmountUnits(Number.NaN), null);
  assert.equal(parseAmountUnits(Number.POSITIVE_INFINITY), null);
});

test("wholeToUnits: a price in whole coins, in the same units", () => {
  assert.equal(wholeToUnits(3), 300_000_000n);
  assert.equal(wholeToUnits(10), 1_000_000_000n);
});

test("comparing amounts as units is exact where floating point is not", () => {
  // 0.1 + 0.2 is 0.30000000000000004 as a float; as units it is exactly 0.3.
  const sum = parseAmountUnits("0.1")! + parseAmountUnits("0.2")!;
  assert.equal(sum, parseAmountUnits("0.3"));
});
