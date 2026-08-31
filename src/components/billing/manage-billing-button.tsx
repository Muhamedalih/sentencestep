"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { startCustomerPortal } from "@/lib/billing/checkout-actions";
import type { CheckoutActionState } from "@/lib/billing/checkout-actions";

const initialState: CheckoutActionState = {};

/** Submits to the real (currently inert) customer-portal action — see startCustomerPortal. */
export function ManageBillingButton() {
  const [state, formAction, pending] = useActionState(startCustomerPortal, initialState);
  const { t } = useLocale();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? t.premium.opening : t.premium.manageBilling}
      </Button>
      {state?.error && <p className="text-muted-foreground text-xs">{state.error}</p>}
    </form>
  );
}
