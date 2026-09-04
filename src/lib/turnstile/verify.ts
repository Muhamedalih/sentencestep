/**
 * Server-side verification for Cloudflare Turnstile — the bot-protection
 * check added to sign-up after an audit flagged that account creation had
 * no defense against scripted/automated signups at all (only sign-in had a
 * lockout — see login-rate-limit.ts). Turnstile over reCAPTCHA/hCaptcha:
 * free, privacy-respecting (no third-party ad tracking), and its widget's
 * script is already the one non-Supabase, non-font external host this
 * app's CSP allows (see middleware.ts's buildCsp).
 *
 * Gated on NEXT_PUBLIC_TURNSTILE_SITE_KEY/TURNSTILE_SECRET_KEY exactly like
 * every other optional integration in this codebase (ElevenLabs, Gemini,
 * Sentry): unconfigured means the check is skipped entirely, not that
 * sign-up breaks for every deployment that hasn't set this up yet.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

/**
 * True only on a real, positive verification from Cloudflare. Fails CLOSED
 * (returns false) on a missing token, a missing secret, or any
 * network/parsing failure — the opposite default of this app's other
 * "fail open when unconfigured" integrations, since this one's entire job
 * is to refuse suspicious sign-ups; a silent pass-through on error would
 * defeat the point. Callers only reach this after isTurnstileConfigured()
 * is already true (see signUp), so "secret missing" here would only ever
 * mean a genuine misconfiguration, not the common unconfigured-deployment
 * case.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    if (!response.ok) return false;

    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[turnstile] verification request failed", error);
    return false;
  }
}
