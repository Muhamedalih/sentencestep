import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/auth/not-configured-notice";
import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/layout/logo";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/supabase/safe-redirect";

export const metadata: Metadata = {
  title: "Create your account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: requestedNext } = await searchParams;
  // Only a real same-origin destination other than the default is carried on.
  const safeNext = safeNextPath(requestedNext ?? null);
  const next = safeNext === "/learn" ? undefined : safeNext;
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-flex min-h-11 items-center self-start"
        aria-label={t.marketing.homeLinkAriaLabel}
      >
        <Logo />
      </Link>
      {isSupabaseConfigured() ? (
        <RegisterForm
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
          next={next}
        />
      ) : (
        <NotConfiguredNotice />
      )}
    </div>
  );
}
