"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleCheck, LifeBuoy, Loader2, X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import {
  MAX_PAYMENT_REPORT_NOTE_LENGTH,
  PAYMENT_REPORT_CATEGORIES,
} from "@/lib/billing/payment-report";
import type { PaymentReportCategory } from "@/lib/billing/payment-report";
import { submitPaymentReport } from "@/lib/reports/payment-actions";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL_KEYS = {
  paid_not_active: "categoryPaidNotActive",
  payment_failed: "categoryFailed",
  wrong_price: "categoryWrongPrice",
  other: "categoryOther",
} as const;

/**
 * "Problem with your payment?": one tap on what happened, an optional note,
 * and the admins are alerted the moment it is sent. The account and the
 * learner's newest orders are attached by the server (submitPaymentReport), so
 * nobody has to find a reference. Shown beside the pay button and on the page
 * a learner lands on after paying; it needs a signed-in learner, so callers
 * only render it for one.
 *
 * `defaultCategory` lets a page that already knows what likely happened (the
 * payment is still confirming, or did not complete) preselect it. After a
 * "paid but not active" report the dialog offers an immediate re-check of the
 * payment, which often settles it before anyone has to reply.
 */
export function ReportPaymentProblem({
  defaultCategory = null,
  variant = "link",
  className,
}: {
  defaultCategory?: PaymentReportCategory | null;
  variant?: "link" | "button";
  className?: string;
}) {
  const { t } = useLocale();
  const pathname = usePathname();
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<PaymentReportCategory | null>(defaultCategory);
  const [note, setNote] = useState("");
  const [sentCategory, setSentCategory] = useState<PaymentReportCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstFieldRef = useRef<HTMLDivElement>(null);

  const labels = t.paymentReport;

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
    // Kept until the dialog is gone, so it never visibly resets while closing.
    window.setTimeout(() => {
      setSentCategory(null);
      setNote("");
      setError(null);
      setCategory(defaultCategory);
    }, 200);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) close();
    };
    window.addEventListener("keydown", onKeyDown);
    const focusId = window.setTimeout(() => {
      firstFieldRef.current?.querySelector<HTMLElement>("input:checked, input, textarea")?.focus();
    }, 50);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusId);
    };
    // close() only reads props and setters that never change identity in a way this cares about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isPending]);

  function submit() {
    if (!category) {
      setError(labels.errorChoose);
      return;
    }
    if (category === "other" && !note.trim()) {
      setError(labels.errorNote);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitPaymentReport({ category, note, pagePath: pathname });
      if (result.ok) {
        setSentCategory(category);
        return;
      }
      setError(
        {
          invalid: labels.errorGeneric,
          too_long: labels.errorGeneric,
          generic: labels.errorGeneric,
          note_required: labels.errorNote,
          not_signed_in: labels.errorSignIn,
          too_many: labels.errorTooMany,
        }[result.code],
      );
    });
  }

  return (
    <>
      {variant === "link" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            "text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none",
            className,
          )}
        >
          <LifeBuoy className="size-3.5" aria-hidden="true" />
          {labels.trigger}
        </button>
      ) : (
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          className={className}
        >
          <LifeBuoy aria-hidden="true" />
          {labels.trigger}
        </Button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="bg-background/80 fixed inset-0 z-100 flex items-end justify-center backdrop-blur-sm sm:items-center sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isPending) close();
          }}
        >
          <div className="border-border bg-card relative max-h-[92svh] w-full max-w-md overflow-y-auto rounded-t-2xl border p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              aria-label={labels.cancel}
              className="text-muted-foreground hover:text-foreground hover:bg-muted absolute end-3 top-3 rounded-full p-1.5 transition-colors disabled:opacity-40"
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            {sentCategory ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
                <CircleCheck className="text-success size-12" aria-hidden="true" />
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {labels.successTitle}
                </h2>
                <p className="text-muted-foreground text-sm" dir="auto">
                  {labels.successBody}
                </p>
                {sentCategory === "paid_not_active" && (
                  <div className="border-border bg-muted/50 mt-2 flex w-full flex-col items-center gap-2 rounded-xl border px-4 py-4">
                    <p className="text-sm font-semibold" dir="auto">
                      {labels.recheckTitle}
                    </p>
                    <p className="text-muted-foreground text-xs" dir="auto">
                      {labels.recheckBody}
                    </p>
                    <Button asChild size="sm" className="mt-1">
                      <Link href="/billing/return" prefetch={false}>
                        {labels.recheckCta}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="pe-8">
                  <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                    {labels.title}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm" dir="auto">
                    {labels.subtitle}
                  </p>
                </div>

                <div ref={firstFieldRef} className="flex flex-col gap-4">
                  <fieldset className="flex flex-col gap-2">
                    <legend className="sr-only">{labels.title}</legend>
                    {PAYMENT_REPORT_CATEGORIES.map((value) => {
                      const checked = category === value;
                      return (
                        <label
                          key={value}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                            "has-focus-visible:ring-ring has-focus-visible:ring-2",
                            checked
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-border hover:bg-muted/60",
                          )}
                        >
                          <input
                            type="radio"
                            name="payment-report-category"
                            value={value}
                            checked={checked}
                            disabled={isPending}
                            onChange={() => {
                              setCategory(value);
                              setError(null);
                            }}
                            className="accent-primary size-4 shrink-0"
                          />
                          <span dir="auto">{labels[CATEGORY_LABEL_KEYS[value]]}</span>
                        </label>
                      );
                    })}
                  </fieldset>

                  <div>
                    <textarea
                      value={note}
                      onChange={(event) =>
                        setNote(event.target.value.slice(0, MAX_PAYMENT_REPORT_NOTE_LENGTH))
                      }
                      placeholder={
                        category === "other" ? labels.notePlaceholderOther : labels.notePlaceholder
                      }
                      aria-label={labels.notePlaceholder}
                      rows={3}
                      dir="auto"
                      disabled={isPending}
                      className="border-border bg-background focus-visible:ring-ring w-full resize-none rounded-xl border p-3 text-base outline-none focus-visible:ring-2 md:text-sm"
                    />
                    <div className="mt-1 flex min-h-4 items-center justify-between gap-3">
                      <span className="text-muted-foreground text-xs" dir="ltr">
                        {note.length}/{MAX_PAYMENT_REPORT_NOTE_LENGTH}
                      </span>
                      {error && (
                        <span role="alert" className="text-danger text-xs" dir="auto">
                          {error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={close} disabled={isPending}>
                    {labels.cancel}
                  </Button>
                  <Button size="sm" onClick={submit} disabled={isPending}>
                    {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                    {isPending ? labels.sending : labels.send}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
