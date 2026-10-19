"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, CircleHelp, Clock, Copy, Info, Loader2 } from "lucide-react";

import { BinanceMark } from "@/components/billing/binance-mark";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { guideSegments } from "@/lib/billing/binance/guide";
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

function CopyButton({ value, label }: { value: string; label: string }) {
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
    <button
      type="button"
      onClick={copy}
      aria-label={`${t.binancePay.copy}: ${label}`}
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
      <span aria-live="polite">{copied ? t.binancePay.copied : t.binancePay.copy}</span>
    </button>
  );
}

/** One line of a box: what it is on one side, its value (and a copy button, where one is useful) on the other. */
function Row({ label, value, copyLabel }: { label: ReactNode; value: string; copyLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3" dir="auto">
      <span className="text-muted-foreground min-w-0 text-sm">{label}</span>
      <span className="flex shrink-0 items-center gap-2.5">
        <bdi dir="ltr" className="text-lg font-semibold tracking-wide tabular-nums">
          {value}
        </bdi>
        {copyLabel && <CopyButton value={value} label={copyLabel} />}
      </span>
    </div>
  );
}

function Box({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-muted flex flex-col gap-3 rounded-2xl px-4 py-3.5">
      <h2 className="text-muted-foreground text-xs font-medium" dir="auto">
        {heading}
      </h2>
      {children}
    </section>
  );
}

/**
 * For someone who has never sent money in Binance: a row that opens, in place,
 * the whole transfer step by step, with this order's own ID, amount and code in
 * the steps. Closed it is one quiet line under the boxes, so it costs nothing to
 * someone who already knows how. The wording of every step lives in the
 * dictionaries (see guide.ts for how the figures and the chips are put in).
 */
function SendGuide({
  binanceId,
  amount,
  orderCode,
}: {
  binanceId: string;
  amount: number;
  orderCode: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const values = { id: binanceId, amount: String(amount), code: orderCode };

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group border-primary/40 bg-primary/[0.08] rounded-xl border border-dashed px-3 open:border-solid"
    >
      <summary
        dir="auto"
        className="flex cursor-pointer list-none items-center justify-between gap-2 py-2.5 text-sm [&::-webkit-details-marker]:hidden"
      >
        <span className="flex items-center gap-2">
          <CircleHelp className="text-primary size-[18px] shrink-0" aria-hidden="true" />
          {open ? (
            <span className="font-medium">{t.binancePay.guideHeading}</span>
          ) : (
            <span>
              {t.binancePay.guideAsk} <span className="font-medium">{t.binancePay.guideOpen}</span>
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </summary>

      <ol className="flex flex-col pb-2">
        {t.binancePay.guideSteps.map((step, index) => (
          <li key={index} className="flex items-start gap-2.5 py-1.5 text-sm">
            <span className="bg-brand-muted text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
              {index + 1}
            </span>
            <span className="min-w-0 leading-relaxed" dir="auto">
              {guideSegments(step, values).map((piece, pieceIndex) =>
                piece.chip ? (
                  <bdi
                    key={pieceIndex}
                    dir="ltr"
                    className="bg-foreground/10 rounded-md px-1.5 font-medium"
                  >
                    {piece.text}
                  </bdi>
                ) : (
                  <Fragment key={pieceIndex}>{piece.text}</Fragment>
                ),
              )}
            </span>
          </li>
        ))}
      </ol>
      <p
        className="text-muted-foreground border-border border-t py-2.5 text-xs leading-relaxed"
        dir="auto"
      >
        {t.binancePay.guideNote}
      </p>
    </details>
  );
}

/**
 * What a learner needs to pay with Binance Pay, in three boxes: the price (the
 * same violet as the price on the upgrade card, with the coin and the network
 * named), who to send it to (the name Binance will show and the Binance ID),
 * and the note that holds the order code. Only the ID and the code can be
 * copied: they are the two things typed into Binance. The server re-renders
 * the page every few seconds while the transfer is awaited (see
 * PaymentStatusRefresh), so the learner never has to press anything: when the
 * transfer arrives the page turns into the receipt.
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
    <div className="flex flex-col gap-3">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,oklch(0.44_0.2_273),oklch(0.33_0.17_287))] px-5 py-5 text-white">
        <div className="relative flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3" dir="auto">
            <h2 className="text-xs font-medium text-white/80">{t.binancePay.amountLabel}</h2>
            <span
              dir="ltr"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white"
            >
              <BinanceMark className="size-4" />
              Binance Pay
            </span>
          </div>
          <p dir="ltr" className="flex items-baseline justify-center gap-2.5">
            <span className="text-5xl leading-none font-semibold tabular-nums">{amount}</span>
            <Badge className="border-white/25 bg-white/10 text-sm text-white">USDT</Badge>
          </p>
          <p className="text-center text-xs text-white/85" dir="auto">
            {t.binancePay.priceCaption}
          </p>
        </div>
      </section>

      <Box heading={t.binancePay.recipientHeading}>
        <Row label={t.binancePay.recipientNameLabel} value={displayName} />
        <Row
          label={t.binancePay.recipientIdLabel}
          value={binanceId}
          copyLabel={t.binancePay.recipientIdLabel}
        />
      </Box>

      <Box heading={t.binancePay.noteLabel}>
        <Row
          label={t.binancePay.noteBenefit}
          value={orderCode}
          copyLabel={t.binancePay.noteLabel}
        />
      </Box>

      <SendGuide binanceId={binanceId} amount={amount} orderCode={orderCode} />

      <div className="flex flex-col gap-2 px-1" role="status" aria-live="polite">
        <div
          className="text-muted-foreground flex items-center justify-between gap-3 text-xs"
          dir="auto"
        >
          <span className="inline-flex items-center gap-2">
            <Loader2 className="text-primary size-3.5 animate-spin" aria-hidden="true" />
            {t.binancePay.waitingHeading}
          </span>
          {!expired && remaining !== null && (
            <span
              dir="ltr"
              className="inline-flex items-center gap-1.5 tabular-nums"
              title={t.binancePay.expiresIn.replace("{time}", formatRemaining(remaining))}
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
            <span>{t.binancePay.expiredNote}</span>
          </p>
        )}
        <p className="text-muted-foreground text-xs leading-relaxed" dir="auto">
          {t.binancePay.waitingBody}
        </p>
      </div>

      <p className="text-muted-foreground px-1 text-center text-xs leading-relaxed" dir="auto">
        {t.binancePay.onlyUsdt}
      </p>
    </div>
  );
}
