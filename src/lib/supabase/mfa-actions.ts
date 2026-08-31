"use server";

import { createClient } from "@/lib/supabase/server";

export interface MfaEnrollResult {
  factorId?: string;
  qrCode?: string;
  secret?: string;
  error?: string;
}

/**
 * Starts TOTP enrollment for the signed-in user — returns the QR code (an
 * SVG data URI, ready to render directly in an <img>) and the plain-text
 * secret as a manual-entry fallback. The factor exists but is `unverified`
 * until verifyMfaEnrollment succeeds; an abandoned enrollment left
 * unverified never grants any access and can simply be re-attempted (a
 * fresh call here replaces it — see unenrollMfaFactor's doc comment).
 */
export async function enrollMfaFactor(): Promise<MfaEnrollResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error) return { error: error.message };

  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export interface MfaActionResult {
  error?: string;
}

/**
 * Completes enrollment: challenges the just-created factor and verifies the
 * learner's first code against it in one round trip. Only after this
 * succeeds does the factor become `verified` and start being required at
 * sign-in (see verifyLoginMfaCode in mfa-login-actions.ts).
 */
export async function verifyMfaEnrollment(
  factorId: string,
  code: string,
): Promise<MfaActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
  if (error) return { error: error.message };
  return {};
}

export interface MfaFactorSummary {
  id: string;
  status: "verified" | "unverified";
}

/** The signed-in user's own TOTP factors — used to render "enabled"/"not enabled" in Settings. Never another user's; listFactors() is scoped to the caller's own session, same as every other mfa.* call here. */
export async function listMfaFactors(): Promise<MfaFactorSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return [];
  return data.totp.map((factor) => ({ id: factor.id, status: factor.status }));
}

/** Removes a TOTP factor — the Settings "Disable" action, and also how an abandoned/unverified enrollment gets cleaned up before retrying. */
export async function unenrollMfaFactor(factorId: string): Promise<MfaActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { error: error.message };
  return {};
}
