import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/auth/not-configured-notice";
import { ResetPasswordGate } from "@/components/auth/reset-password-gate";
import { Logo } from "@/components/layout/logo";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Reset your password",
};

/**
 * A recovery link's session arrives as a URL fragment, which a Server
 * Component can never see (see ResetPasswordGate's doc comment) — so unlike
 * most pages, auth state here is checked entirely client-side, and this page
 * itself only ever renders the static shell around it.
 */
export default async function ResetPasswordPage() {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 self-start" aria-label={t.marketing.homeLinkAriaLabel}>
        <Logo />
      </Link>
      {isSupabaseConfigured() ? <ResetPasswordGate /> : <NotConfiguredNotice />}
    </div>
  );
}
