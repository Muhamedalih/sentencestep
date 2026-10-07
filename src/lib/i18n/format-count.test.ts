import { test } from "node:test";
import assert from "node:assert/strict";

import { formatCount } from "./format-count";

test("formatCount: groups thousands the way each language writes them, with Latin digits in Arabic", () => {
  assert.equal(formatCount(5200, null), "5,200");
  assert.equal(formatCount(5200, "ar"), "5,200");
  assert.equal(formatCount(61000, "tr"), "61.000");
  assert.equal(formatCount(1200000, null), "1,200,000");
});

test("formatCount: spanish leaves four-digit numbers ungrouped and groups from five digits", () => {
  assert.equal(formatCount(5200, "es"), "5200");
  assert.equal(formatCount(61000, "es"), "61.000");
});
