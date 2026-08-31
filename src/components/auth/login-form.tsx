"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocale } from "@/components/providers/locale-provider";
import { signIn } from "@/lib/supabase/auth-actions";
import type { AuthActionState } from "@/lib/supabase/auth-actions";

const initialState: AuthActionState = {};

export function LoginForm({
  next,
  confirmationFailed,
}: {
  next?: string;
  /** Set when src/app/auth/callback/route.ts couldn't exchange the email confirmation code. */
  confirmationFailed?: boolean;
}) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const { t } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t.auth.loginHeading}</CardTitle>
        <CardDescription>{t.auth.loginSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {confirmationFailed && !state?.error && (
          <p role="alert" className="text-danger mb-4 text-sm">
            {t.auth.confirmationFailed}
          </p>
        )}

        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next ?? "/learn"} />

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
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t.auth.passwordLabel}
              </label>
              <Link
                href="/forgot-password"
                className="text-primary text-xs font-medium hover:underline"
              >
                {t.auth.forgotPassword}
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={6}
              aria-invalid={Boolean(state?.error)}
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
          </div>

          {state?.error && (
            <p role="alert" className="text-danger text-sm">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? t.auth.signingIn : t.common.signIn}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          {t.auth.noAccount}{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            {t.auth.createOne}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
