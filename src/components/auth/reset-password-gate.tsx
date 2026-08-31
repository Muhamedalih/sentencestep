"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { createClient } from "@/lib/supabase/client";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type Status = "checking" | "ready" | "invalid";

/**
 * Establishes (or confirms) a recovery session before rendering the reset
 * form. A password-recovery email link delivers its session as a
 * `#access_token=...&refresh_token=...&type=recovery` URL fragment — the
 * *implicit*-grant shape — not the `?code=` query param
 * src/app/auth/callback/route.ts exchanges for signup confirmation.
 * Fragments are never sent to the server at all, so this can't be checked
 * server-side the way most pages check auth state (see
 * src/app/reset-password/page.tsx, which now renders this instead of
 * gating on getCurrentUser()).
 *
 * This deliberately does NOT rely on the Supabase browser client's own
 * automatic URL-session detection: src/lib/supabase/client.ts's
 * createClient() goes through @supabase/ssr's createBrowserClient, which
 * hardcodes `flowType: "pkce"` (see its source) so that its cookie-based
 * session storage stays consistent with the server client. That hardcoding
 * means its automatic detectSessionInUrl handling treats an implicit-grant
 * fragment as a MISMATCHED flow and actively rejects it rather than
 * quietly parsing it (see @supabase/auth-js's _getSessionFromURL, which
 * throws "Not a valid PKCE flow url." for exactly this shape) — so it can
 * never establish a session from this fragment on its own, regardless of
 * how long you wait for it.
 *
 * Reading the tokens out of the fragment directly and handing them to
 * setSession() sidesteps that flow-type check entirely: setSession()
 * validates and stores whatever tokens it's given, unconditionally, using
 * the exact same cookie storage every other signed-in session already
 * relies on — which is what lets updatePasswordAction succeed afterward
 * server-side with no changes of its own.
 */
export function ResetPasswordGate() {
  const [status, setStatus] = useState<Status>("checking");
  const { t } = useLocale();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function establishSession() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const isRecovery = hashParams.get("type") === "recovery";

      if (accessToken && refreshToken && isRecovery) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (!error) {
          // The tokens have done their job — clear them from the address
          // bar and history now rather than leave them sitting in a URL a
          // learner might copy, bookmark, or share.
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          setStatus("ready");
          return;
        }
      }

      // No usable fragment (or setSession rejected it, e.g. an expired
      // link) — fall back to whatever session already exists, covering a
      // reload after the fragment was already consumed once.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) setStatus(session ? "ready" : "invalid");
    }

    void establishSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") return null;

  if (status === "invalid") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t.auth.resetLinkInvalid}</CardTitle>
          <CardDescription>
            <Link href="/forgot-password" className="text-primary font-medium hover:underline">
              {t.auth.forgotPassword}
            </Link>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ResetPasswordForm />;
}
