import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { queueWelcomeEmail } from "@/lib/email/welcome-trigger";
import { track } from "@/lib/analytics/track";
import { CONFIRMATION_FAILED_ERROR, OAUTH_FAILED_ERROR } from "@/lib/supabase/auth-errors";
import { safeNextPath } from "@/lib/supabase/safe-redirect";

/**
 * Where Supabase sends the learner back after either (a) they click the
 * confirmation link in their signup email, or (b) they complete the Google
 * OAuth consent screen (see signInWithGoogle in auth-actions.ts) — both are
 * the same Supabase PKCE flow, landing here with a one-time `?code=` to
 * exchange for a real session.
 *
 * Unlike the email-confirmation case, an OAuth code exchange doesn't imply a
 * brand-new account — a returning Google user hits this same route on every
 * sign-in. `created_at`/`last_sign_in_at` land within milliseconds of each
 * other only the very first time a user is created, so that's used to tell
 * "new account" (signup analytics + welcome email) apart from "returning
 * sign-in" (sign-in analytics only) rather than re-sending the welcome email
 * and mis-tracking every later Google login as a signup.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const displayName = (data.user?.user_metadata?.display_name as string | undefined) ?? null;
      const createdAt = data.user?.created_at ? new Date(data.user.created_at).getTime() : null;
      const lastSignInAt = data.user?.last_sign_in_at
        ? new Date(data.user.last_sign_in_at).getTime()
        : null;
      const isNewUser =
        createdAt !== null && lastSignInAt !== null && Math.abs(lastSignInAt - createdAt) < 5000;

      if (data.user?.id) {
        await track(
          {
            name: isNewUser ? "USER_SIGNED_UP" : "USER_SIGNED_IN",
            category: "AUTH",
            properties: {},
          },
          data.user.id,
        );
      }
      if (isNewUser && data.user?.email) {
        await queueWelcomeEmail({ email: data.user.email, displayName }, origin);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code at all (rather than a failed exchange) means Google itself sent
  // the learner back — most commonly `?error=access_denied` because they
  // cancelled the consent screen — not a broken/expired confirmation link,
  // so that's given its own message instead of the confirmation-specific one.
  const failedError = code === null ? OAUTH_FAILED_ERROR : CONFIRMATION_FAILED_ERROR;
  return NextResponse.redirect(`${origin}/login?error=${failedError}`);
}
