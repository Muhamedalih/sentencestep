"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Copy, Info, Loader2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

interface BinancePayInstructionsProps {
  /** The Binance ID learners type in Pay > Send. */
  binanceId: string;
  /** The nickname Binance shows the sender when they confirm. */
  displayName: string;
  /** Whole USDT the order costs. */
  amount: number;
  /** SS-XXXXX, written in the note of the transfer. */
  orderCode: string;
  /** ISO time the order's hour ends. */
  expiresAt: string | null;
  /** True once that hour has passed (a late transfer with the code still counts). */
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

function CopyStep({
  step,
  label,
  value,
  hint,
}: {
  step: number;
  label: string;
  value: string;
  hint?: string;
}) {
  const { t } = useLocale();
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
    <li className="border-border flex flex-col gap-2 rounded-xl border px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="bg-brand-muted text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs" dir="auto">
            {label}
          </p>
          <p
            dir="ltr"
            className="mt-0.5 text-start text-xl font-semibold tracking-wide break-all tabular-nums"
          >
            {value}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={`${t.binancePay.copy}: ${label}`}
          className={cn(
            "border-border hover:bg-muted focus-visible:ring-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
            copied && "border-success/40 text-success",
          )}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          <span aria-live="polite">{copied ? t.binancePay.copied : t.binancePay.copy}</span>
        </button>
      </div>
      {hint && (
        <p className="text-muted-foreground ps-9 text-xs leading-relaxed" dir="auto">
          {hint}
        </p>
      )}
    </li>
  );
}

/**
 * The three things a learner needs to pay with Binance Pay, each with a copy
 * button: the Binance ID to send to, the amount in USDT, and the order code to
 * write in the note. The server re-renders the page every few seconds while the
 * transfer is awaited (see PaymentStatusRefresh), so the learner never has to
 * press anything: when the transfer arrives the page turns into the receipt.
 */
export function BinancePayInstructions({
  binanceId,
  displayName,
  amount,
  orderCode,
  expiresAt,
  expired,
}: BinancePayInstructionsProps) {
  const { t } = useLocale();
  const router = useRouter();
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
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col gap-3">
        <CopyStep
          step={1}
          label={t.binancePay.recipientLabel}
          value={binanceId}
          hint={t.binancePay.recipientHint.replace("{name}", displayName)}
        />
        <CopyStep
          step={2}
          label={t.binancePay.amountLabel}
          value={String(amount)}
          hint={t.binancePay.amountHint}
        />
        <CopyStep
          step={3}
          label={t.binancePay.noteLabel}
          value={orderCode}
          hint={t.binancePay.noteHint}
        />
      </ol>

      {expired ? (
        <p
          className="bg-muted text-muted-foreground flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-xs leading-relaxed"
          dir="auto"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{t.binancePay.expiredNote}</span>
        </p>
      ) : (
        remaining !== null && (
          <p
            className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs"
            dir="auto"
          >
            <Clock className="size-3.5" aria-hidden="true" />
            <span>{t.binancePay.expiresIn.replace("{time}", formatRemaining(remaining))}</span>
          </p>
        )
      )}

      <div
        className="bg-brand-muted/60 flex items-start gap-3 rounded-xl px-4 py-3.5"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="text-primary mt-0.5 size-5 shrink-0 animate-spin" aria-hidden="true" />
        <div className="flex flex-col gap-1" dir="auto">
          <p className="text-sm font-semibold">{t.binancePay.waitingHeading}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t.binancePay.waitingBody}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground text-center text-xs leading-relaxed" dir="auto">
        {t.binancePay.onlyUsdt}
      </p>
    </div>
  );
}
