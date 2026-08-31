"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/locale-provider";
import { updateDailyGoalAction } from "@/lib/supabase/profile-actions";
import type { ProfileActionState } from "@/lib/supabase/profile-actions";

const initialState: ProfileActionState = {};

export function DailyGoalForm({ dailyGoal }: { dailyGoal: number }) {
  const [state, formAction, pending] = useActionState(updateDailyGoalAction, initialState);
  const { t } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.dailyGoalHeading}</CardTitle>
        <CardDescription>{t.settings.dailyGoalSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dailyGoal" className="text-sm font-medium">
              {t.settings.dailyGoalInputLabel}
            </label>
            <Input
              id="dailyGoal"
              name="dailyGoal"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              step={1}
              defaultValue={dailyGoal}
              className="max-w-32"
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
            {pending ? t.settings.savingDailyGoal : t.settings.saveDailyGoal}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
