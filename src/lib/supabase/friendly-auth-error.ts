import type { AuthError } from "@supabase/supabase-js";

import type { Dictionary } from "@/lib/i18n/dictionary";

/**
 * Maps known Supabase Auth error messages to a translated, user-facing
 * string. Pulled out of auth-actions.ts (a "use server" file) so it stays a
 * plain, directly testable function rather than an implicit server action.
 * Anything not recognized here falls through to the raw Supabase message —
 * keep this list in sync with every Supabase Auth error actually reachable
 * from signIn/signUp, since a gap here means the user sees is a raw,
 * untranslated English string even on a fully localized page (see
 * `friendly-auth-error.test.ts` for a real example that was missed:
 * "Email not confirmed").
 */
export function friendlyAuthError(error: AuthError, t: Dictionary): string {
  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials")) return t.auth.errors.invalidCredentials;
  if (message.includes("already registered")) return t.auth.errors.accountExists;
  if (message.includes("password should be at least")) return t.auth.errors.passwordTooShort;
  if (message.includes("unable to validate email")) return t.auth.errors.invalidEmail;
  if (message.includes("email rate limit exceeded")) return t.auth.errors.emailRateLimited;
  if (message.includes("email not confirmed")) return t.auth.errors.emailNotConfirmed;
  return error.message || t.auth.errors.genericError;
}
