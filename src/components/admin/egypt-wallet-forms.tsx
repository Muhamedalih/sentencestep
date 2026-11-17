"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/content-actions";
import {
  closeEgyptOrder,
  ignoreEgyptMessage,
  linkEgyptMessage,
} from "@/lib/admin/egypt-wallet-actions";

type AdminAction = (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;

function Message({ state }: { state: ActionResult | null }) {
  if (state?.error) {
    return (
      <p role="alert" className="text-danger text-xs">
        {state.error}
      </p>
    );
  }
  if (state?.success) return <p className="text-success text-xs">{state.success}</p>;
  return null;
}

/** One button that runs one admin action with a few hidden values, and says what happened under itself. */
function ActionForm({
  action,
  fields,
  label,
  variant = "outline",
  confirmText,
}: {
  action: AdminAction;
  fields: Record<string, string>;
  label: string;
  variant?: "outline" | "default" | "ghost";
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
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "Working…" : label}
      </Button>
      <Message state={state} />
    </form>
  );
}

export function LinkMessageButton({
  messageId,
  orderId,
  label,
}: {
  messageId: string;
  orderId: string;
  label: string;
}) {
  return (
    <ActionForm
      action={linkEgyptMessage}
      fields={{ messageId, orderId }}
      label={label}
      variant="default"
      confirmText="Link this transfer to the order and activate Premium for the learner?"
    />
  );
}

export function IgnoreMessageButton({ messageId }: { messageId: string }) {
  return (
    <ActionForm
      action={ignoreEgyptMessage}
      fields={{ messageId }}
      label="Ignore"
      confirmText="Ignore this transfer? It leaves the list and never activates anything."
    />
  );
}

export function CloseOrderButton({ orderId }: { orderId: string }) {
  return (
    <ActionForm
      action={closeEgyptOrder}
      fields={{ orderId }}
      label="Close"
      variant="ghost"
      confirmText="Close this order? A transfer that arrives for it later can still be linked by hand."
    />
  );
}
