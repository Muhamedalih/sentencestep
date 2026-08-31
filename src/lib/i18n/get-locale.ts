import { cookies } from "next/headers";

import { LOCALE_COOKIE } from "@/lib/i18n/locale-cookie";
import { isSupportLocale, type SupportLocale } from "@/lib/i18n/locales";

/**
 * The current request's learner-support locale, or null if this visitor has
 * never made a choice (no cookie — the first-time picker should show; see
 * FirstTimeLanguagePicker). Deliberately does NOT fall back to reading
 * profiles.preferred_language here: that reconciliation only happens at the
 * two auth transitions (signIn/signUp, see locale-actions.ts) so every
 * ordinary page render stays a single fast cookie read, never a DB query —
 * see that file's doc comment for the full sync policy.
 */
export async function getLocale(): Promise<SupportLocale | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isSupportLocale(value) ? value : null;
}
