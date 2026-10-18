"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/admin/content-actions";
import type { BinancePaySettings } from "@/lib/billing/binance/settings";
import {
  closeBinanceOrder,
  ignoreBinanceTransfer,
  linkBinanceTransfer,
  saveBinancePaySettings,
} from "@/lib/admin/binance-pay-actions";

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

export function LinkTransferButton({
  transferId,
  orderId,
  label,
}: {
  transferId: string;
  orderId: string;
  label: string;
}) {
  return (
    <ActionForm
      action={linkBinanceTransfer}
      fields={{ transferId, orderId }}
      label={label}
      variant="default"
      confirmText="Link this transfer to the order and activate Premium for the learner?"
    />
  );
}

export function IgnoreTransferButton({ transferId }: { transferId: string }) {
  return (
    <ActionForm
      action={ignoreBinanceTransfer}
      fields={{ transferId }}
      label="Ignore"
      confirmText="Ignore this transfer? It leaves the list and never activates anything."
    />
  );
}

export function CloseOrderButton({ orderId }: { orderId: string }) {
  return (
    <ActionForm
      action={closeBinanceOrder}
      fields={{ orderId }}
      label="Close"
      confirmText="Close this order? A transfer that arrives later can still be linked by hand."
    />
  );
}

export function BinancePaySettingsForm({ settings }: { settings: BinancePaySettings }) {
  const [state, formAction, pending] = useActionState(saveBinancePaySettings, null);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Binance ID learners send to
        <Input
          name="binanceId"
          defaultValue={settings.binanceId}
          inputMode="numeric"
          autoComplete="off"
          required
        />
        <span className="text-muted-foreground text-xs font-normal">
          The number in Pay, next to your name. Digits only.
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Name Binance shows the sender
        <Input name="displayName" defaultValue={settings.displayName} maxLength={40} required />
        <span className="text-muted-foreground text-xs font-normal">
          Shown on the payment page so a learner can check they are paying the right account.
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Orders per day (0 pauses the button)
        <Input
          name="dailyOrderCap"
          type="number"
          min={0}
          max={200}
          defaultValue={settings.dailyOrderCap}
          required
        />
        <span className="text-muted-foreground text-xs font-normal">
          Counted over any rolling 24 hours.
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Late payments still accepted for (hours)
        <Input
          name="latePaymentHours"
          type="number"
          min={1}
          max={168}
          defaultValue={settings.latePaymentHours}
          required
        />
        <span className="text-muted-foreground text-xs font-normal">
          A transfer with the order&apos;s code that arrives after the order&apos;s hour still
          counts for this long.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="autoActivate"
          defaultChecked={settings.autoActivate}
          className="mt-1 size-4"
        />
        <span>
          <span className="font-medium">Activate Premium by itself</span>
          <span className="text-muted-foreground block text-xs">
            When a transfer carries an order&apos;s exact code and covers its price. Switch it off
            and every transfer waits here for you to link it.
          </span>
        </span>
      </label>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Saving…" : "Save settings"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}
