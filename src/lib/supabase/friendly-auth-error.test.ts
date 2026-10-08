import { test } from "node:test";
import assert from "node:assert/strict";
import type { AuthError } from "@supabase/supabase-js";

import { friendlyAuthError } from "./friendly-auth-error";
import { en } from "@/lib/i18n/dictionary/en";

function authError(message: string): AuthError {
  return { message } as AuthError;
}

test("friendlyAuthError: an unconfirmed-email sign-in attempt gets the translated message, not Supabase's raw string", () => {
  assert.equal(
    friendlyAuthError(authError("Email not confirmed"), en),
    en.auth.errors.emailNotConfirmed,
  );
});

test("friendlyAuthError: is case-insensitive against Supabase's exact wording", () => {
  assert.equal(
    friendlyAuthError(authError("EMAIL NOT CONFIRMED"), en),
    en.auth.errors.emailNotConfirmed,
  );
});

test("friendlyAuthError: still maps the other known Supabase errors", () => {
  assert.equal(
    friendlyAuthError(authError("Invalid login credentials"), en),
    en.auth.errors.invalidCredentials,
  );
  assert.equal(
    friendlyAuthError(authError("User already registered"), en),
    en.auth.errors.accountExists,
  );
  assert.equal(
    friendlyAuthError(authError("Password should be at least 6 characters"), en),
    en.auth.errors.passwordTooShort,
  );
  assert.equal(
    friendlyAuthError(authError("Unable to validate email address"), en),
    en.auth.errors.invalidEmail,
  );
  assert.equal(
    friendlyAuthError(authError("Email rate limit exceeded"), en),
    en.auth.errors.emailRateLimited,
  );
});

test("friendlyAuthError: a failed confirmation-email send gets the translated message, not Supabase's raw string", () => {
  for (const raw of ["Error sending confirmation email", "Error sending recovery email"]) {
    assert.equal(friendlyAuthError(authError(raw), en), en.auth.errors.confirmationEmailFailed);
  }
});

test("friendlyAuthError: a weak or leaked password gets the translated message, whichever field Supabase fills", () => {
  const raw = "Password is known to be weak and easy to guess, please choose a different one.";
  assert.equal(friendlyAuthError(authError(raw), en), en.auth.errors.passwordWeak);
  assert.equal(
    friendlyAuthError({ message: "Unprocessable", code: "weak_password" } as AuthError, en),
    en.auth.errors.passwordWeak,
  );
});

test("friendlyAuthError: a too-short password is still reported as too short, even with the weak_password code", () => {
  assert.equal(
    friendlyAuthError(
      { message: "Password should be at least 6 characters", code: "weak_password" } as AuthError,
      en,
    ),
    en.auth.errors.passwordTooShort,
  );
});

test("friendlyAuthError: an unrecognized Supabase error still falls back to its own message", () => {
  assert.equal(
    friendlyAuthError(authError("Some new Supabase error"), en),
    "Some new Supabase error",
  );
});

test("friendlyAuthError: an empty message falls back to the generic translated error", () => {
  assert.equal(friendlyAuthError(authError(""), en), en.auth.errors.genericError);
});
