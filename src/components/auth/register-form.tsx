"use client";

import Link from "next/link";
import Script from "next/script";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocale } from "@/components/providers/locale-provider";
import { signUp } from "@/lib/supabase/auth-actions";
import type { AuthActionState } from "@/lib/supabase/auth-actions";

const initialState: AuthActionState = {};

export function RegisterForm({ turnstileSiteKey }: { turnstileSiteKey: string | null }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const { t } = useLocale();

  if (state?.success) {
    return (
      <Card>
        <CardHeader>
          <div className="bg-success/15 text-success mb-2 flex size-11 items-center justify-center rounded-lg">
            <MailCheck className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">{t.auth.checkInbox}</CardTitle>
          <CardDescription>{state.success}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t.auth.registerHeading}</CardTitle>
        <CardDescription>{t.auth.registerSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="displayName" className="text-sm font-medium">
              {t.auth.displayNameLabel}{" "}
              <span className="text-muted-foreground font-normal">{t.auth.optional}</span>
            </label>
            <Input id="displayName" name="displayName" type="text" autoComplete="name" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              {t.auth.emailLabel}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(state?.error)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              {t.auth.passwordLabel}
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              aria-invalid={Boolean(state?.error)}
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
            <p className="text-muted-foreground text-xs">{t.auth.passwordHint}</p>
          </div>

          {turnstileSiteKey && (
            <>
              {/* No nonce needed: this is an external-src script, matched by
                  middleware.ts's CSP script-src allow-list (challenges.cloudflare.com),
                  not by nonce — the nonce requirement only applies to inline scripts. */}
              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              {/* Turnstile's own script auto-renders this into a real widget and
                  injects a hidden "cf-turnstile-response" input into this form —
                  signUp (auth-actions.ts) reads that field directly, no extra
                  client-side wiring needed. */}
              <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" />
            </>
          )}

          {state?.error && (
            <p role="alert" className="text-danger text-sm">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? t.auth.creatingAccount : t.nav.createAccount}
          </Button>
        </form>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          {t.auth.termsAgreementPrefix}{" "}
          <Link href="/terms" className="text-primary hover:underline">
            {t.footer.terms}
          </Link>{" "}
          {t.auth.termsAgreementAnd}{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            {t.footer.privacy}
          </Link>
          .
        </p>

        <p className="text-muted-foreground mt-4 text-center text-sm">
          {t.auth.hasAccount}{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t.common.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
