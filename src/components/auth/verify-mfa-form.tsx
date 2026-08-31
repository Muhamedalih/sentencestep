"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { verifyLoginMfaCode } from "@/lib/supabase/mfa-login-actions";
import type { AuthActionState } from "@/lib/supabase/auth-actions";

const initialState: AuthActionState = {};

export function VerifyMfaForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(verifyLoginMfaCode, initialState);
  const { t } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t.twoFactor.loginHeading}</CardTitle>
        <CardDescription>{t.twoFactor.loginSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next ?? "/learn"} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-medium">
              {t.twoFactor.codeLabel}
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              placeholder={t.twoFactor.codePlaceholder}
              aria-invalid={Boolean(state?.error)}
              className="border-input bg-background h-11 w-full rounded-lg border px-3 text-center text-lg tracking-widest"
            />
          </div>

          {state?.error && (
            <p role="alert" className="text-danger text-sm">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? t.twoFactor.verifying : t.twoFactor.loginSubmit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
