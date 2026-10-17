"use server";

import { createClient } from "@/lib/supabase/server";
import { completeSignIn } from "@/lib/supabase/auth-actions";
import { safeNextPath } from "@/lib/supabase/safe-redirect";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import type { AuthActionState } from "@/lib/supabase/auth-actions";

/**
 * The second step of sign-in for an account with a verified TOTP factor —
 * reached only after signIn's own AAL check redirected here (see that
 * function's doc comment). Requires an already-established aal1 session
 * (this page is unreachable without one — see middleware.ts), so this only
 * ever has to challenge the SAME session's own factor, never re-authenticate
 * with a password.
 */
export async function verifyLoginMfaCode(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const code = String(formData.get("code") ?? "").trim();
  const next = safeNextPath(formData.get("next"));

  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  if (!/^\d{6}$/.test(code)) return { error: t.twoFactor.invalidCode };

  const supabase = await createClient();

  // A plain read, so one retry is safe — a single dropped request to Supabase must not
  // turn into "something went wrong" on the learner's one chance at typing the code.
  let factors = await supabase.auth.mfa.listFactors();
  if (factors.error) factors = await supabase.auth.mfa.listFactors();
  if (factors.error) return { error: t.twoFactor.genericError };

  const factor = factors.data.totp.find((f) => f.status === "verified");
  if (!factor) {
    // The account has no verified factor any more (two-factor was switched off after this
    // session started), yet this session still carries the old user record that lists it —
    // which is the only reason the proxy sent the learner here, and every request keeps
    // sending them back here until the record refreshes on its own. There is nothing left
    // to verify, so refresh the session now (that re-reads the user, factor list included)
    // and finish signing in, instead of trapping them on a page that can only fail.
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) return { error: t.twoFactor.genericError };
    return completeSignIn(refreshed.data.user?.id, next);
  }

  const { error, data } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) {
    // A wrong or expired code is the learner's to retry; a dropped connection or a 5xx from
    // Supabase is not, and must not tell them their (correct) code was wrong.
    const isOutage = error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500;
    return { error: isOutage ? t.twoFactor.genericError : t.twoFactor.invalidCode };
  }

  return completeSignIn(data.user?.id, next);
}
