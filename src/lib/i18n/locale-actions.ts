"use server";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/locale-cookie";
import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * Sync policy for the two sources of truth (cookie = fast per-request read
 * for everyone; profiles.preferred_language = durable, cross-device read
 * for signed-in learners), chosen to avoid a per-request DB read on every
 * page view:
 *
 * - Every explicit language-switcher use (this action) writes BOTH at once.
 * - A guest's cookie choice is copied into their new profile row at signup
 *   (see src/lib/supabase/auth-actions.ts's signUp) — a guest who picked
 *   Spanish before creating an account doesn't get silently reset to the
 *   profiles table's 'ar' default.
 * - An existing account's saved preference overwrites the browser's cookie
 *   at sign-in (see signIn) — DB wins for returning users, so a stale or
 *   incidental guest-browsing cookie on a shared/new device never shadows
 *   what they actually saved last time.
 *
 * Between those three points cookie and DB are always consistent, so
 * ordinary page renders (getLocale) never need to query the database.
 */
export async function setPreferredLanguageAction(locale: SupportLocale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ preferred_language: locale }).eq("id", user.id);
}

/** Used only at the signIn/signUp transitions described above — never on an ordinary page render. */
export async function getPreferredLanguageForUser(userId: string): Promise<SupportLocale | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", userId)
    .maybeSingle();
  return data?.preferred_language ?? null;
}
