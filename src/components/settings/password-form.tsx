"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocale } from "@/components/providers/locale-provider";
import { updatePasswordAction } from "@/lib/supabase/auth-actions";
import type { AuthActionState } from "@/lib/supabase/auth-actions";

const initialState: AuthActionState = {};

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);
  const { t } = useLocale();
  const formRef = useRef<HTMLFormElement>(null);

  // Never leave a just-set password sitting in the fields after success —
  // especially relevant here since PasswordInput lets it be toggled visible.
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.passwordHeading}</CardTitle>
        <CardDescription>{t.settings.passwordSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="context" value="settings" />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-sm font-medium">
              {t.settings.newPasswordLabel}
            </label>
            <PasswordInput
              id="new-password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              aria-invalid={Boolean(state?.error)}
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              {t.settings.confirmPasswordLabel}
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
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
          {state?.success && <p className="text-success text-sm">{state.success}</p>}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? t.settings.updatingPassword : t.settings.updatePassword}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
