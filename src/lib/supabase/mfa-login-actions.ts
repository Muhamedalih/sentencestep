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

  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  const factor = factorsData?.totp.find((f) => f.status === "verified");
  if (factorsError || !factor) return { error: t.twoFactor.genericError };

  const { error, data } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { error: t.twoFactor.invalidCode };

  return completeSignIn(data.user?.id, next);
}
