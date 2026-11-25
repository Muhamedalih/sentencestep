// Run with `npm run test:security`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { safeFilterTerm } from "./filter-text";

test("safeFilterTerm: an ordinary search is unchanged", () => {
  assert.equal(safeFilterTerm("Atomic Habits"), "Atomic Habits");
  assert.equal(safeFilterTerm("  the  alchemist "), "the alchemist");
});

test("safeFilterTerm: characters that start another filter condition are removed", () => {
  const out = safeFilterTerm("x%,id.not.is.null,title.ilike.(a)");
  assert.equal(/[,()%"'*\\]/.test(out), false, out);
});

test("safeFilterTerm: the search is bounded", () => {
  assert.equal(safeFilterTerm("a".repeat(500)).length, 100);
});
