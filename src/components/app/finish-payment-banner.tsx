"use client";

import { useEffect, useState } from "react";
import { CreditCard, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "sentencestep:finishPaymentDismissed:v1";

function readDismissedFor(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function markDismissedFor(reference: string): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, reference);
  } catch {
    // Best-effort only: worst case the note shows again on the next visit.
  }
}

/**
 * A quiet, dismissible note on Home for a learner who started paying and left
 * with the payment link still open: one tap goes straight back to it. The server
 * only mounts it for a learner without Premium who has such a link. Dismissal is
 * remembered for that one link, so a later payment attempt is offered again.
 * Starts hidden and decides after mount, so the server render and the browser agree.
 */
export function FinishPaymentBanner({
  reference,
  url,
  className,
}: {
  reference: string;
  url: string;
  className?: string;
}) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readDismissedFor() !== reference);
  }, [reference]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={cn(
        "border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-brand-muted text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
          <CreditCard className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t.premium.finishPaymentTitle}</p>
          <p className="text-muted-foreground text-xs">{t.premium.finishPaymentBody}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" asChild>
          <a href={url}>{t.premium.finishPaymentCta}</a>
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t.premium.expiryBannerDismiss}
          onClick={() => {
            markDismissedFor(reference);
            setVisible(false);
          }}
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
