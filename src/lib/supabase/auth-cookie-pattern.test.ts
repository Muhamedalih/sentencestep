import assert from "node:assert/strict";
import { test } from "node:test";

import { SUPABASE_AUTH_COOKIE_PATTERN } from "@/lib/supabase/auth-cookie-pattern";

function matches(name: string): boolean {
  return SUPABASE_AUTH_COOKIE_PATTERN.test(name);
}

test("SUPABASE_AUTH_COOKIE_PATTERN: matches a real, unchunked session cookie", () => {
  assert.equal(matches("sb-kseqmehbtyxcrgauksom-auth-token"), true);
});

test("SUPABASE_AUTH_COOKIE_PATTERN: matches a chunked session cookie (large JWT)", () => {
  assert.equal(matches("sb-kseqmehbtyxcrgauksom-auth-token.0"), true);
  assert.equal(matches("sb-kseqmehbtyxcrgauksom-auth-token.1"), true);
});

test("SUPABASE_AUTH_COOKIE_PATTERN: rejects the plain PKCE code-verifier cookie", () => {
  assert.equal(matches("sb-kseqmehbtyxcrgauksom-auth-token-code-verifier"), false);
});

test("SUPABASE_AUTH_COOKIE_PATTERN: rejects the per-flow PKCE code-verifier cookie", () => {
  assert.equal(
    matches(
      "sb-kseqmehbtyxcrgauksom-auth-token-flow-ebe4a2e4f67126846680aec5daefddf3-code-verifier",
    ),
    false,
  );
});

test("SUPABASE_AUTH_COOKIE_PATTERN: rejects the flows-code-verifier cookie", () => {
  assert.equal(matches("sb-kseqmehbtyxcrgauksom-auth-token-flows-code-verifier"), false);
});

test("SUPABASE_AUTH_COOKIE_PATTERN: rejects unrelated cookies", () => {
  assert.equal(matches("ss_locale"), false);
  assert.equal(matches("_clck"), false);
  assert.equal(matches("sb-project-other-cookie"), false);
});
