import assert from "node:assert/strict";
import test from "node:test";

import { isMissingTableError } from "@/lib/sentence-bank/errors";

test("a table that is not there yet is told apart from every other failure", () => {
  assert.equal(
    isMissingTableError({ code: "PGRST205", message: "Could not find the table" }),
    true,
  );
  assert.equal(isMissingTableError({ code: "42P01" }), true);
  assert.equal(isMissingTableError({ code: "PGRST202" }), false); // a missing FUNCTION is another matter
  assert.equal(isMissingTableError({ code: "23503" }), false);
  assert.equal(isMissingTableError(new Error("boom")), false);
  assert.equal(isMissingTableError(null), false);
  assert.equal(isMissingTableError("PGRST205"), false);
  assert.equal(isMissingTableError(undefined), false);
});
