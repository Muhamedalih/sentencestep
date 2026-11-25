import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { track } from "@/lib/analytics/track";
import { getPreferredLanguageForUser } from "@/lib/i18n/locale-actions";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/locale-cookie";
import { safeNextPath } from "@/lib/supabase/safe-redirect";

/**
 * The post-auth tail shared by signIn (no MFA pending) and verifyLoginMfaCode (MFA just completed) -
 * analytics + locale sync + the final redirect. Kept in one place so the two entry points can't
 * drift on what "actually finishing sign-in" means.
 *
 * Deliberately NOT in a "use server" file: every export of such a file is a public endpoint anyone
 * can call with any arguments, and this one takes a user id and a redirect target. Here it can only
 * be reached from the two server actions that have just authenticated the visitor. The target is
 * passed through safeNextPath again, so even a future caller cannot make it leave the site.
 */
export async function completeSignIn(userId: string | undefined, next: string): Promise<never> {
  if (userId) {
    await track({ name: "USER_SIGNED_IN", category: "AUTH", properties: {} }, userId);

    // DB wins for a returning user - overwrites whatever this browser's cookie currently holds,
    // including an incidental guest choice made before signing in. See locale-actions.ts's doc
    // comment for the full sync policy.
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

  redirect(safeNextPath(next));
}
