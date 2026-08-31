"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { startCheckout } from "@/lib/billing/checkout-actions";
import type { CheckoutActionState } from "@/lib/billing/checkout-actions";

const initialState: CheckoutActionState = {};

/** Submits to the real (currently inert) checkout action — see startCheckout for why this can't fake success. */
export function CheckoutButton() {
  const [state, formAction, pending] = useActionState(startCheckout, initialState);
  const { t } = useLocale();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.premium.redirecting : t.common.upgrade}
      </Button>
      {state?.error && (
        <p role="alert" className="text-muted-foreground text-center text-xs">
          {state.error}
        </p>
      )}
    </form>
  );
}
