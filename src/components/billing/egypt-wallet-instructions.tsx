"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Clock, Copy, Info, Loader2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  claimPaid,
  savePayerPhone,
  submitOperationNumber,
} from "@/lib/billing/egypt-wallet/actions";
import type { EgyptActionState } from "@/lib/billing/egypt-wallet/actions";
import { egyptStrings } from "@/lib/billing/egypt-wallet/strings";
import { cn } from "@/lib/utils";

interface EgyptWalletInstructionsProps {
  /** The order's reference: sent with each form so the server finds the learner's own order. */
  reference: string;
  /** The Vodafone Cash number learners send to. */
  walletNumber: string;
  /** Whole pounds the order costs. */
  amount: number;
  /** The number the learner wrote, or null before they wrote it. */
  payerPhone: string | null;
  /** True once the learner pressed "I sent the money". */
  claimedPaid: boolean;
  /** ISO time the order's hour ends. */
  expiresAt: string | null;
  /** True once that hour has passed (a late transfer from the saved number still counts). */
  expired: boolean;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Copies text and falls back to a hidden textarea where the async clipboard is not allowed (older in-app browsers). */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(field);
      return copied;
    } catch {
      return false;
    }
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const { locale } = useLocale();
  const t = egyptStrings(locale);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    if (!(await copyText(value))) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${t.copy}: ${label}`}
      className={cn(
        "border-border hover:bg-background/60 focus-visible:ring-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
        copied && "border-success/40 text-success",
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? t.copied : t.copy}</span>
    </button>
  );
}

function Box({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-muted flex flex-col gap-3 rounded-2xl px-4 py-3.5">
      <h2 className="text-sm font-medium" dir="auto">
        {heading}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value, copy }: { label: ReactNode; value: string; copy?: string }) {
  return (
    <div className="flex items-center justify-between gap-3" dir="auto">
      <span className="text-muted-foreground min-w-0 text-sm">{label}</span>
      <span className="flex shrink-0 items-center gap-2.5">
        <bdi dir="ltr" className="text-lg font-semibold tracking-wide tabular-nums">
          {value}
        </bdi>
        {copy && <CopyButton value={value} label={copy} />}
      </span>
    </div>
  );
}

/** After a form succeeds the server page is read again, so the next step (or the receipt) appears. */
function useRefreshOnSuccess(state: EgyptActionState | null) {
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
}

function PhoneForm({
  reference,
  initial,
  onDone,
}: {
  reference: string;
  initial: string;
  onDone?: () => void;
}) {
  const { locale } = useLocale();
  const t = egyptStrings(locale);
  const [state, action, pending] = useActionState(savePayerPhone, null);
  useRefreshOnSuccess(state);
  useEffect(() => {
    if (state?.ok) onDone?.();
  }, [state, onDone]);

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <input type="hidden" name="reference" value={reference} />
      <p className="text-muted-foreground text-xs leading-relaxed" dir="auto">
        {t.stepPhoneHelp}
      </p>
      <div className="flex items-center gap-2">
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          defaultValue={initial}
          placeholder={t.phonePlaceholder}
          required
          aria-invalid={state?.error ? true : undefined}
          className="border-border bg-background focus-visible:ring-ring h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg tracking-wide tabular-nums focus-visible:ring-2 focus-visible:outline-none"
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          <span dir="auto">{t.phoneSave}</span>
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-danger text-xs" dir="auto">
          {state.error}
        </p>
      )}
    </form>
  );
}

function ClaimForm({ reference }: { reference: string }) {
  const { locale } = useLocale();
  const t = egyptStrings(locale);
  const [state, action, pending] = useActionState(claimPaid, null);
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="reference" value={reference} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Check aria-hidden="true" />
        )}
        <span dir="auto">{t.claimButton}</span>
      </Button>
      {state?.error && (
        <p role="alert" className="text-danger text-xs" dir="auto">
          {state.error}
        </p>
      )}
    </form>
  );
}

function OperationForm({ reference }: { reference: string }) {
  const { locale } = useLocale();
  const t = egyptStrings(locale);
  const [state, action, pending] = useActionState(submitOperationNumber, null);
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="flex flex-col gap-2.5 pb-3">
      <input type="hidden" name="reference" value={reference} />
      <p className="text-muted-foreground text-xs leading-relaxed" dir="auto">
        {t.otherHelp}
      </p>
      <div className="flex items-center gap-2">
        <input
          name="operation"
          type="text"
          inputMode="numeric"
          dir="ltr"
          placeholder={t.otherPlaceholder}
          required
          aria-invalid={state?.error ? true : undefined}
          className="border-border bg-background focus-visible:ring-ring h-11 min-w-0 flex-1 rounded-lg border px-3 text-base tabular-nums focus-visible:ring-2 focus-visible:outline-none"
        />
        <Button type="submit" variant="secondary" disabled={pending} className="shrink-0">
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          <span dir="auto">{t.otherSubmit}</span>
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-danger text-xs" dir="auto">
          {state.error}
        </p>
      )}
    </form>
  );
}

/**
 * What a learner in Egypt needs to pay with Vodafone Cash, in two steps. First their own wallet number
 * (the identity their transfer is matched on). Then, only once it is saved, the amount in whole
 * pounds and the shop's wallet, each with a copy button. The server re-renders the page every few
 * seconds while the transfer is awaited (see PaymentStatusRefresh), so the learner never has to press
 * anything: when the transfer arrives the page turns into the receipt. A learner who sent from another
 * number can give the operation number from Vodafone's message instead.
 */
export function EgyptWalletInstructions({
  reference,
  walletNumber,
  amount,
  payerPhone,
  claimedPaid,
  expiresAt,
  expired,
}: EgyptWalletInstructionsProps) {
  const { locale } = useLocale();
  const t = egyptStrings(locale);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt || expired) return;
    const end = Date.parse(expiresAt);
    let refreshed = false;
    const tick = () => {
      const left = end - Date.now();
      setRemaining(left);
      // Once the hour is over the server shows the "late payment" wording.
      if (left <= 0 && !refreshed) {
        refreshed = true;
        router.refresh();
      }
    };
    tick();
    const timer = setInterval(tick, 1_000);
    return () => clearInterval(timer);
  }, [expiresAt, expired, router]);

  return (
    <div className="flex flex-col gap-3">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,oklch(0.44_0.2_273),oklch(0.33_0.17_287))] px-5 py-5 text-white">
        <div className="relative flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3" dir="auto">
            <h2 className="text-xs font-medium text-white/80">{t.amountLabel}</h2>
            <span dir="ltr" className="text-xs font-medium text-white">
              Vodafone Cash
            </span>
          </div>
          <p dir="ltr" className="flex items-baseline justify-center gap-2.5">
            <span className="text-5xl leading-none font-semibold tabular-nums">{amount}</span>
            <Badge className="border-white/25 bg-white/10 text-sm text-white">EGP</Badge>
          </p>
        </div>
      </section>

      <Box heading={t.stepPhoneHeading}>
        {payerPhone && !editing ? (
          <div className="flex items-center justify-between gap-3" dir="auto">
            <span className="text-sm">
              {t.phoneSavedLabel.split("{phone}")[0]}
              <bdi dir="ltr" className="font-semibold tabular-nums">
                {payerPhone}
              </bdi>
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-primary shrink-0 text-xs font-medium underline underline-offset-2"
            >
              {t.phoneChange}
            </button>
          </div>
        ) : (
          <PhoneForm
            reference={reference}
            initial={payerPhone ?? ""}
            onDone={() => setEditing(false)}
          />
        )}
      </Box>

      <Box heading={t.stepSendHeading}>
        {payerPhone ? (
          <>
            <Row label={t.amountLabel} value={String(amount)} copy={t.amountLabel} />
            <Row label={t.toWalletLabel} value={walletNumber} copy={t.toWalletLabel} />
            <Row label={t.fromNumberLabel} value={payerPhone} />
            <p className="text-muted-foreground text-xs leading-relaxed" dir="auto">
              {t.sendNote}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm" dir="auto">
            {t.stepSendLocked}
          </p>
        )}
      </Box>

      {payerPhone && (
        <div className="flex flex-col gap-2 px-1" role="status" aria-live="polite">
          <div
            className="text-muted-foreground flex items-center justify-between gap-3 text-xs"
            dir="auto"
          >
            <span className="inline-flex items-center gap-2">
              <Loader2 className="text-primary size-3.5 animate-spin" aria-hidden="true" />
              {t.waitingHeading}
            </span>
            {!expired && remaining !== null && (
              <span
                dir="ltr"
                className="inline-flex items-center gap-1.5 tabular-nums"
                title={t.expiresIn.replace("{time}", formatRemaining(remaining))}
              >
                <Clock className="size-3.5" aria-hidden="true" />
                {formatRemaining(remaining)}
              </span>
            )}
          </div>
          {expired && (
            <p
              className="bg-muted text-muted-foreground flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-xs leading-relaxed"
              dir="auto"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{t.expiredNote}</span>
            </p>
          )}
          <p className="text-muted-foreground text-xs leading-relaxed" dir="auto">
            {t.waitingBody}
          </p>
          {claimedPaid ? (
            <p
              className="bg-muted flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-xs leading-relaxed"
              dir="auto"
            >
              <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{t.claimedNote}</span>
            </p>
          ) : (
            <ClaimForm reference={reference} />
          )}
        </div>
      )}

      <details className="group border-border rounded-xl border border-dashed px-3 open:border-solid">
        <summary
          dir="auto"
          className="flex cursor-pointer list-none items-center justify-between gap-2 py-2.5 text-sm [&::-webkit-details-marker]:hidden"
        >
          <span>{t.otherHeading}</span>
          <ChevronDown
            className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <OperationForm reference={reference} />
      </details>
    </div>
  );
}
