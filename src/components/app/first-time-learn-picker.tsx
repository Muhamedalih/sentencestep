"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { LockBodyScroll } from "@/components/app/lock-body-scroll";
import { Logo } from "@/components/layout/logo";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { finishLearnStep, useLearnStepDone } from "@/lib/learn-choice";
import type { TargetLanguage } from "@/lib/learn-language";
import { cn } from "@/lib/utils";

const OPTIONS: readonly {
  language: TargetLanguage;
  flag: string;
  name: string;
  note: string;
  isNew?: boolean;
}[] = [
  { language: "en", flag: "gb", name: "English", note: "الإنجليزية · English" },
  { language: "de", flag: "de", name: "Deutsch", note: "الألمانية · German", isNew: true },
];

/**
 * The step before the language step of the first-run flow (permission germanTrack): «what do you want
 * to learn?», English or German, drawn like the language step after it (the same full page, logo,
 * heading, big cards). It only exists for a brand-new visitor (no language chosen yet, past the
 * introduction) and only while German is open to them: the step asks the server once, and when German
 * is closed it marks itself done without showing anything, so a closed permission changes nothing.
 * The choice is stored the same way the top bar's chip stores it (see /api/learn-language), and the
 * language step follows at once.
 */
export function FirstTimeLearnPicker() {
  const { locale } = useLocale();
  const { introContinued } = useGetStartedStep();
  const done = useLearnStepDone();
  const [open, setOpen] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const active = !locale && introContinued && !done;

  useEffect(() => {
    if (!active || open !== null) return;
    let cancelled = false;
    // A server that does not answer within three seconds counts as «German is closed»: the flow goes on without this step instead of waiting behind a blank page.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    fetch("/api/learn-language", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { open: false }))
      .then((body: { open?: boolean }) => {
        if (cancelled) return;
        if (body.open) setOpen(true);
        else finishLearnStep();
      })
      .catch(() => {
        if (!cancelled) finishLearnStep();
      })
      .finally(() => clearTimeout(timer));
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, open]);

  async function choose(language: TargetLanguage) {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/learn-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, asked: true }),
      });
    } catch {
      // The choice is kept in this browser below even if the server could not be reached.
    }
    setBusy(false);
    finishLearnStep(language);
  }

  if (!active) return null;
  // Until the server has answered, a plain cover keeps the page under the flow from showing for a moment.
  if (open !== true) return <div className="bg-background fixed inset-0 z-100" />;

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6 max-md:overflow-y-auto max-md:overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label="What do you want to learn?"
    >
      <LockBodyScroll />
      <div className="flex items-center justify-between">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl text-center"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl" dir="ltr">
            What do you want to learn?
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-balance" dir="rtl">
            ما اللغة التي تريد تعلّمها؟
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2" dir="ltr">
            {OPTIONS.map((option) => (
              <motion.button
                key={option.language}
                type="button"
                disabled={busy}
                onClick={() => choose(option.language)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="border-border bg-card hover:border-primary hover:shadow-primary/10 focus-visible:ring-ring focus-visible:ring-offset-background relative flex flex-col items-center gap-3 rounded-2xl border px-6 py-8 transition-colors outline-none hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {option.isNew && (
                  <span className="bg-primary text-primary-foreground absolute end-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] leading-4 font-bold">
                    جديد · New
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    `fi fi-${option.flag}`,
                    "!block !h-8 !w-11 rounded-md bg-center shadow-[0_0_0_1px_var(--border)]",
                  )}
                />
                <span className="text-lg font-medium">{option.name}</span>
                <span className="text-muted-foreground text-xs">{option.note}</span>
              </motion.button>
            ))}
          </div>

          <p className="text-muted-foreground mt-8 text-xs text-balance" dir="rtl">
            تقدر تغيّرها بأي وقت من الشريط العلوي، وتقدمك في كل لغة منفصل.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
