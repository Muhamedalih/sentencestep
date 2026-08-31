import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { queueWelcomeEmail } from "@/lib/email/welcome-trigger";
import { track } from "@/lib/analytics/track";
import { CONFIRMATION_FAILED_ERROR } from "@/lib/supabase/auth-errors";
import { safeNextPath } from "@/lib/supabase/safe-redirect";

/**
 * Where Supabase sends the learner after they click the confirmation link
 * in their signup email — exchanges the one-time code for a real session
 * (the standard Supabase PKCE email-confirmation flow) before landing them
 * in the app.
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
