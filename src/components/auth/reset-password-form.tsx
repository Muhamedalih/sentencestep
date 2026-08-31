"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocale } from "@/components/providers/locale-provider";
import { updatePasswordAction } from "@/lib/supabase/auth-actions";
import type { AuthActionState } from "@/lib/supabase/auth-actions";

const initialState: AuthActionState = {};

/**
 * Submits to the same updatePasswordAction Settings' password form uses —
 * a hidden `context=reset` field only changes which success copy comes back
 * (see that action's doc comment). Only ever rendered once
 * src/app/reset-password/page.tsx has confirmed a live (recovery) session
 * exists, so there's no separate "not signed in" branch to handle here.
 */
export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);
  const { t } = useLocale();

  if (state?.success) {
    return (
      <Card>
        <CardHeader>
          <div className="bg-success/15 text-success mb-2 flex size-11 items-center justify-center rounded-lg">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">{t.auth.resetPasswordSuccess}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/learn">{t.premium.backToLearning}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t.auth.resetPasswordHeading}</CardTitle>
        <CardDescription>{t.auth.resetPasswordSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="context" value="reset" />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              {t.settings.newPasswordLabel}
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t.settings.confirmPasswordLabel}
            </label>
            <PasswordInput
              id="confirmPassword"
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

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? t.auth.resettingPassword : t.auth.resetPasswordButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
