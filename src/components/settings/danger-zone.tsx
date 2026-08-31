"use client";

import { useActionState, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/locale-provider";
import { deleteAccountAction } from "@/lib/supabase/account-actions";
import type { AccountActionState } from "@/lib/supabase/account-actions";

const initialState: AccountActionState = {};

function DeleteAccountConfirm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);
  const { t } = useLocale();

  return (
    <div className="border-danger/30 bg-danger/5 rounded-lg border p-4">
      <p className="text-sm font-semibold">{t.settings.deleteAccountConfirmHeading}</p>
      <p className="text-muted-foreground mt-1 text-sm">{t.settings.deleteAccountConfirmBody}</p>

      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <Input
          name="confirmation"
          placeholder={t.settings.deleteAccountConfirmPlaceholder}
          autoComplete="off"
          aria-invalid={Boolean(state?.error)}
          className="max-w-xs"
        />

        {state?.error && (
          <p role="alert" className="text-danger text-sm">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? t.settings.deletingAccount : t.settings.deleteAccountConfirmButton}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {t.common.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Destructive actions live in their own visually-separated Card
 * (danger-tinted border, no accidental adjacency to routine settings) —
 * data export first, account deletion behind an explicit typed confirmation
 * second. `canDeleteAccount` reflects whether SUPABASE_SERVICE_ROLE_KEY is
 * configured in this deployment (see deleteAccountAction's doc comment) —
 * export always works (it only ever reads this learner's own RLS-scoped
 * rows), but deletion is never offered as a button that would just fail if
 * the environment can't actually fulfill it.
 */
export function DangerZone({ canDeleteAccount }: { canDeleteAccount: boolean }) {
  const { t } = useLocale();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="border-danger/30">
      <CardHeader>
        <CardTitle className="text-danger text-xl">{t.settings.dangerZoneHeading}</CardTitle>
        <CardDescription>{t.settings.dangerZoneSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium">{t.settings.exportDataHeading}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t.settings.exportDataBody}</p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <a href="/api/account/export" download="sentencestep-account-data.json">
              <Download aria-hidden="true" />
              {t.settings.exportDataButton}
            </a>
          </Button>
        </div>

        {canDeleteAccount && (
          <div className="border-border border-t pt-6">
            <p className="text-sm font-medium">{t.settings.deleteAccountHeading}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t.settings.deleteAccountBody}</p>

            {confirmingDelete ? (
              <div className="mt-3">
                <DeleteAccountConfirm onCancel={() => setConfirmingDelete(false)} />
              </div>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={() => setConfirmingDelete(true)}
              >
                {t.settings.deleteAccountButton}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
