"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AuthError } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { queueWelcomeEmail } from "@/lib/email/welcome-trigger";
import { getSiteUrl } from "@/lib/site-url";
import { track } from "@/lib/analytics/track";
import { safeNextPath } from "@/lib/supabase/safe-redirect";
import { getPreferredLanguageForUser } from "@/lib/i18n/locale-actions";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/locale-cookie";
import { DEFAULT_LOCALE, isSupportLocale } from "@/lib/i18n/locales";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { friendlyAuthError } from "@/lib/supabase/friendly-auth-error";
import { isLoginLockedOut, recordLoginAttempt } from "@/lib/supabase/login-rate-limit";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile/verify";

export interface AuthActionState {
  error?: string;
  success?: string;
}

/**
 * The post-auth tail shared by signIn (no MFA pending) and
 * verifyLoginMfaCode (MFA just completed) — analytics + locale sync +
 * the final redirect. Kept in one place so the two entry points can't drift
 * on what "actually finishing sign-in" means.
 */
export async function completeSignIn(userId: string | undefined, next: string): Promise<never> {
  if (userId) {
    await track({ name: "USER_SIGNED_IN", category: "AUTH", properties: {} }, userId);

    // DB wins for a returning user — overwrites whatever this browser's
    // cookie currently holds, including an incidental guest choice made
    // before signing in. See locale-actions.ts's doc comment for the full
    // sync policy.
    const savedLocale = await getPreferredLanguageForUser(userId);
    if (savedLocale) {
      const cookieStore = await cookies();
      cookieStore.set(LOCALE_COOKIE, savedLocale, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
      });
    }
  }

  redirect(next);
}

export async function signIn(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  if (!email || !password) return { error: t.auth.errors.missingFields };

  // Checked BEFORE ever calling signInWithPassword — a locked-out email
  // never even reaches Supabase Auth for this attempt, on top of whatever
  // rate limit Supabase's own endpoint already enforces project-wide (see
  // login-rate-limit.ts's own doc comment for why this fails open rather
  // than blocking sign-in when unconfigured).
  if (await isLoginLockedOut(email)) return { error: t.auth.errors.tooManyAttempts };

  const supabase = await createClient();
  let error: AuthError | null;
  let userId: string | undefined;
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    error = result.error;
    userId = result.data.user?.id;
  } catch {
    return { error: t.auth.errors.networkError };
  }

  void recordLoginAttempt(email, !error);

  if (error) return { error: friendlyAuthError(error, t) };

  // signInWithPassword always succeeds at aal1, regardless of whether this
  // account has a verified TOTP factor — Supabase's model deliberately
  // leaves it to the app to require the second step. A pending aal2 upgrade
  // means a factor exists and is verified, so the learner must enter their
  // code before reaching anything beyond this — see mfa-login-actions.ts
  // and middleware.ts's identical check for every subsequent request in the
  // meantime (a direct navigation to /learn can't skip this either).
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/login/verify-mfa?next=${encodeURIComponent(next)}`);
  }

  return completeSignIn(userId, next);
}

export async function signUp(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  if (!email || !password) return { error: t.auth.errors.missingFields };
  if (password.length < 6) return { error: t.auth.errors.passwordTooShort };

  // Bot-signup protection — see verify.ts's own doc comment for why this
  // fails CLOSED (unlike most optional integrations here) and why
  // Turnstile specifically. A no-op entirely until
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY/TURNSTILE_SECRET_KEY are configured, so
  // this never blocks sign-up on a deployment that hasn't set it up yet.
  // "cf-turnstile-response" is the field name Turnstile's own widget script
  // auto-injects into this form — see register-form.tsx, no manual wiring
  // needed on the client side.
  if (isTurnstileConfigured()) {
    const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
    if (!(await verifyTurnstileToken(turnstileToken))) {
      return { error: t.auth.errors.captchaFailed };
    }
  }

  // Falls back to the configured production origin, not an empty string —
  // a missing Origin header (uncommon, but not guaranteed absent) must never
  // produce a host-less link in a confirmation/reset email actually
  // delivered to a real user. Mirrors notification-triggers.ts's origin
  // fallback. See getSiteUrl's doc comment for how that origin gets set.
  const origin = (await headers()).get("origin") ?? getSiteUrl();

  let signUpResult;
  try {
    const supabase = await createClient();
    signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(displayName ? { data: { display_name: displayName } } : {}),
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
  } catch (err) {
    // Never silently swallowed — this is the one place a confirmation-email
    // failure would otherwise vanish with no trace. Logged server-side only;
    // the learner still gets the generic, non-leaky message below.
    console.error("[auth] signUp threw before Supabase responded:", err);
    return { error: t.auth.errors.networkError };
  }
  const { data, error } = signUpResult;

  if (error) {
    // Same reasoning as above — e.g. a rate-limited or misconfigured mailer
    // returns a normal {error} here, not a thrown exception, so this is the
    // path that actually catches "the confirmation email silently failed to
    // send" in server logs.
    console.error("[auth] signUp returned an error:", error.status, error.message);
    return { error: friendlyAuthError(error, t) };
  }

  if (data.session) {
    await track({ name: "USER_SIGNED_UP", category: "AUTH", properties: {} }, data.session.user.id);
    await queueWelcomeEmail({ email, displayName: displayName || null }, origin);

    // The new profile row defaults preferred_language to 'ar' (see
    // supabase/migrations/20250101000000_init_schema.sql's handle_new_user
    // trigger) — copy over whatever this guest actually chose in the
    // first-time picker so it isn't silently reset. Falls back to the
    // default only if, unexpectedly, no cookie was ever set.
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    const chosenLocale = isSupportLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
    const profileClient = await createClient();
    await profileClient
      .from("profiles")
      .update({ preferred_language: chosenLocale })
      .eq("id", data.session.user.id);

    redirect("/learn");
  }

  return { success: t.auth.checkInboxBody };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Requests a Supabase Auth password-reset email. Deliberately points
 * `redirectTo` straight at /reset-password rather than through
 * src/app/auth/callback/route.ts: that route only ever reads a `?code=`
 * query param (the PKCE flow signup-confirmation links use), but a recovery
 * link delivers its session as a `#access_token=...&type=recovery` URL
 * fragment instead — fragments are never sent to the server at all, so a
 * server Route Handler can never see or exchange one. /reset-password's own
 * client-side gate (see reset-password-gate.tsx) is what actually consumes
 * that fragment, via the browser Supabase client's built-in
 * detectSessionInUrl behavior. Signup confirmation is untouched and keeps
 * using the callback route exactly as before. Deliberately never reveals
 * whether the email exists: the success message is identical either way,
 * matching Supabase's own resetPasswordForEmail behavior (it never errors
 * for an unknown address).
 */
export async function requestPasswordResetAction(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  if (!email) return { error: t.auth.errors.missingFields };

  // Falls back to the configured production origin, not an empty string —
  // a missing Origin header (uncommon, but not guaranteed absent) must never
  // produce a host-less link in a confirmation/reset email actually
  // delivered to a real user. Mirrors notification-triggers.ts's origin
  // fallback. See getSiteUrl's doc comment for how that origin gets set.
  const origin = (await headers()).get("origin") ?? getSiteUrl();

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    if (error) return { error: friendlyAuthError(error, t) };
  } catch {
    return { error: t.auth.errors.networkError };
  }

  return { success: t.auth.resetLinkSent };
}

/**
 * Sets a new password for whichever session is currently live — a signed-in
 * learner changing their password from Settings, or a visitor who just
 * followed a reset-password email link (both are equally valid Supabase Auth
 * sessions; supabase.auth.updateUser() doesn't need or accept the OLD
 * password, only a live session, so there's no separate "verify current
 * password" step to build). `context` picks which success copy to show,
 * since the two forms that call this need different confirmation text.
 */
export async function updatePasswordAction(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const context = formData.get("context") === "reset" ? "reset" : "settings";

  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  if (!password || !confirmPassword) return { error: t.auth.errors.missingFields };
  if (password.length < 6) return { error: t.auth.errors.passwordTooShort };
  if (password !== confirmPassword) return { error: t.auth.errors.passwordMismatch };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: friendlyAuthError(error, t) };
  } catch {
    return { error: t.auth.errors.networkError };
  }

  if (context === "settings") revalidatePath("/learn/settings");
  return {
    success: context === "reset" ? t.auth.resetPasswordSuccess : t.settings.passwordUpdated,
  };
}

/** Updates the learner's Supabase Auth display name (user_metadata.display_name) — the same field getCurrentUser() and every email template already read, so nothing else needs to change to pick this up. */
export async function updateDisplayNameAction(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();

  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  if (displayName.length === 0 || displayName.length > 50) {
    return { error: t.settings.displayNameInvalid };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
    if (error) return { error: friendlyAuthError(error, t) };
  } catch {
    return { error: t.auth.errors.networkError };
  }

  revalidatePath("/learn/settings");
  return { success: t.settings.displayNameSaved };
}
