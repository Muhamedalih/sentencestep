import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { NotConfiguredNotice } from "@/components/auth/not-configured-notice";
import { Logo } from "@/components/layout/logo";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { isConfirmationFailedError } from "@/lib/supabase/auth-errors";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const confirmationFailed = isConfirmationFailedError(error);
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 self-start" aria-label={t.marketing.homeLinkAriaLabel}>
        <Logo />
      </Link>
      {isSupabaseConfigured() ? (
        <LoginForm next={next} confirmationFailed={confirmationFailed} />
      ) : (
        <NotConfiguredNotice />
      )}
    </div>
  );
}
