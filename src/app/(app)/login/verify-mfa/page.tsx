import type { Metadata } from "next";
import Link from "next/link";

import { VerifyMfaForm } from "@/components/auth/verify-mfa-form";
import { Logo } from "@/components/layout/logo";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

export const metadata: Metadata = {
  title: "Verify your identity",
};

/**
 * Reached only mid-sign-in, from signIn's own AAL redirect (see
 * auth-actions.ts) or middleware's identical enforcement for any other
 * request while aal2 is pending — never a standalone entry point a signed-
 * out visitor could land on directly (no session, no pending upgrade, no
 * reason to be here; middleware sends anyone else back to /login).
 */
export default async function VerifyMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 self-start" aria-label={t.marketing.homeLinkAriaLabel}>
        <Logo />
      </Link>
      <VerifyMfaForm next={next} />
    </div>
  );
}
