import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { queueWelcomeEmail } from "@/lib/email/welcome-trigger";
import { track } from "@/lib/analytics/track";
import { CONFIRMATION_FAILED_ERROR } from "@/lib/supabase/auth-errors";
import { safeNextPath } from "@/lib/supabase/safe-redirect";

/**
 * Where the "Confirm sign up" email template's link points (token_hash +
 * type, verified via verifyOtp) instead of auth/callback's code exchange
 * (exchangeCodeForSession). The code-exchange flow requires the PKCE code
 * verifier cookie that was set in the browser at signup time to still be
 * present when the link is clicked — which fails whenever the confirmation
 * email is opened in a different browser/app than the one used to sign up
 * (common on mobile: Gmail/Outlook's in-app browser vs. the browser that
 * submitted the signup form). verifyOtp needs nothing from that original
 * browser, so it works from any device. See auth/callback/route.ts, kept
 * around only so any already-sent confirmation email (old template format)
 * still works.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const displayName = (data.user?.user_metadata?.display_name as string | undefined) ?? null;
      if (data.user?.id) {
        await track({ name: "USER_SIGNED_UP", category: "AUTH", properties: {} }, data.user.id);
      }
      if (data.user?.email) {
        await queueWelcomeEmail({ email: data.user.email, displayName }, origin);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${CONFIRMATION_FAILED_ERROR}`);
}
