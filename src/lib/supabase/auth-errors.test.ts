import { test } from "node:test";
import assert from "node:assert/strict";

import { isConfirmationFailedError } from "./auth-errors";

test("isConfirmationFailedError: the exact value the callback route sets is recognized", () => {
  assert.equal(isConfirmationFailedError("confirmation-failed"), true);
});

test("isConfirmationFailedError: no error param at all is not treated as a failure", () => {
  assert.equal(isConfirmationFailedError(undefined), false);
});

test("isConfirmationFailedError: an unrelated or attacker-supplied value is not reflected as a real error", () => {
  assert.equal(isConfirmationFailedError("something-else"), false);
  assert.equal(isConfirmationFailedError("<script>alert(1)</script>"), false);
});
