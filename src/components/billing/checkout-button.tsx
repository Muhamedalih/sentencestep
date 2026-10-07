"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { startCheckout } from "@/lib/billing/checkout-actions";
import type { CheckoutActionState } from "@/lib/billing/checkout-actions";
import { PREMIUM_DAYS } from "@/lib/billing/pricing";

const initialState: CheckoutActionState = {};

/** Submits to startCheckout, which prices the order on the server and redirects to the provider's hosted payment page. `extend` relabels the same action for a learner who is already Premium. */
export function CheckoutButton({ extend = false }: { extend?: boolean }) {
  const [state, formAction, pending] = useActionState(startCheckout, initialState);
  const { t } = useLocale();

  const label = extend
    ? t.premium.extendCta.replace("{days}", String(PREMIUM_DAYS))
    : t.common.upgrade;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {!pending && <Lock aria-hidden="true" />}
        {pending ? t.premium.redirecting : label}
      </Button>
      {state?.error && (
        <p role="alert" className="text-muted-foreground text-center text-xs">
          {state.error}
        </p>
      )}
    </form>
  );
}
