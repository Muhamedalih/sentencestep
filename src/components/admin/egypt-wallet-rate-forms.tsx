"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/content-actions";
import {
  refreshEgyptRate,
  resumeAutomaticEgyptRate,
  setEgyptRateByHand,
} from "@/lib/admin/egypt-wallet-rate-actions";

type AdminAction = (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;

function Message({ state }: { state: ActionResult | null }) {
  if (state?.error) {
    return (
      <p role="alert" className="text-danger max-w-xs text-xs">
        {state.error}
      </p>
    );
  }
  if (state?.success) return <p className="text-success max-w-xs text-xs">{state.success}</p>;
  return null;
}

function OneButton({
  action,
  label,
  variant = "outline",
  confirmText,
}: {
  action: AdminAction;
  label: string;
  variant?: "outline" | "default";
  confirmText?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className="flex flex-col gap-1"
      onSubmit={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "Working…" : label}
      </Button>
      <Message state={state} />
    </form>
  );
}

export function RefreshRateButton() {
  return <OneButton action={refreshEgyptRate} label="Refresh now" />;
}

export function AutomaticRateButton() {
  return (
    <OneButton
      action={resumeAutomaticEgyptRate}
      label="Switch back to automatic"
      variant="default"
      confirmText="Give the rate back to the daily automatic update and read it now?"
    />
  );
}

/** Sets the rate by hand; the automatic update stops until it is given back. */
export function SetRateForm({ current }: { current: number }) {
  const [state, formAction, pending] = useActionState(setEgyptRateByHand, null);
  return (
    <form
      action={formAction}
      className="flex flex-col gap-1"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Use this rate for every new Vodafone Cash order until you switch back to automatic?",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <input
          name="rate"
          type="text"
          inputMode="decimal"
          dir="ltr"
          defaultValue={String(current)}
          aria-label="EGP per USD"
          className="border-border bg-background h-9 w-28 rounded-lg border px-3 text-sm tabular-nums"
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Set by hand"}
        </Button>
      </div>
      <Message state={state} />
    </form>
  );
}
