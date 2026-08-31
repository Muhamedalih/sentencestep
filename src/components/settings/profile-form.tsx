"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/locale-provider";
import { updateDisplayNameAction } from "@/lib/supabase/auth-actions";
import type { AuthActionState } from "@/lib/supabase/auth-actions";

const initialState: AuthActionState = {};

export function ProfileForm({ displayName }: { displayName: string | null }) {
  const [state, formAction, pending] = useActionState(updateDisplayNameAction, initialState);
  const { t } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.profileHeading}</CardTitle>
        <CardDescription>{t.settings.profileSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="displayName" className="text-sm font-medium">
              {t.settings.displayNameLabel}
            </label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              maxLength={50}
              defaultValue={displayName ?? ""}
              aria-invalid={Boolean(state?.error)}
            />
          </div>

          {state?.error && (
            <p role="alert" className="text-danger text-sm">
              {state.error}
            </p>
          )}
          {state?.success && <p className="text-success text-sm">{state.success}</p>}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? t.settings.savingDisplayName : t.settings.saveDisplayName}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
