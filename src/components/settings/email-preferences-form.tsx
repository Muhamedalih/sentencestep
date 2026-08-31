"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { updateEmailPreferencesAction } from "@/lib/email/preferences-actions";
import type { PreferencesActionState } from "@/lib/email/preferences-actions";
import type { EmailPreferences } from "@/lib/email/preferences";

const initialState: PreferencesActionState = {};

export function EmailPreferencesForm({ preferences }: { preferences: EmailPreferences }) {
  const [state, formAction, pending] = useActionState(updateEmailPreferencesAction, initialState);
  const timezoneRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (timezoneRef.current) {
      timezoneRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.emailPrefsHeading}</CardTitle>
        <CardDescription>{t.settings.emailPrefsSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="timezone" ref={timezoneRef} />

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="learningReminders"
              defaultChecked={preferences.learningReminders}
              className="accent-primary mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">{t.settings.learningReminders}</span>
              <span className="text-muted-foreground block text-sm">
                {t.settings.learningRemindersBody}
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="progressEmails"
              defaultChecked={preferences.progressEmails}
              className="accent-primary mt-1 size-4"
            />
            <span>
              <span className="block text-sm font-medium">{t.settings.progressEmails}</span>
              <span className="text-muted-foreground block text-sm">
                {t.settings.progressEmailsBody}
              </span>
            </span>
          </label>

          {state?.error && (
            <p role="alert" className="text-danger text-sm">
              {state.error}
            </p>
          )}
          {state?.success && <p className="text-success text-sm">{state.success}</p>}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? t.settings.savingPreferences : t.settings.savePreferences}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-xs">{t.settings.essentialEmailNotice}</p>
      </CardContent>
    </Card>
  );
}
