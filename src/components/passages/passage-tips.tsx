"use client";

import { motion, useReducedMotion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";

/** The one-time "before you begin" card, shown on a learner's very first passage and never again on that device. */
export function PassageTips({ onStart }: { onStart: () => void }) {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const tips = [
    { title: t.passages.tipListenTitle, body: t.passages.tipListenBody },
    { title: t.passages.tipTapTitle, body: t.passages.tipTapBody },
    { title: t.passages.tipLookBackTitle, body: t.passages.tipLookBackBody },
  ];

  return (
    <motion.div
      className="bg-background/85 fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t.passages.tipsHeading}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="border-border bg-card w-full max-w-md rounded-3xl border p-6 shadow-xl sm:p-7"
      >
        <h2 className="text-xl font-semibold tracking-tight">{t.passages.tipsHeading}</h2>
        <ol className="mt-5 flex flex-col gap-4">
          {tips.map((tip, index) => (
            <li key={tip.title} className="flex gap-3.5">
              <span className="bg-brand-muted text-primary flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
                {index + 1}
              </span>
              <div>
                <p className="font-medium">{tip.title}</p>
                <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{tip.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full rounded-full"
          onClick={onStart}
          autoFocus
        >
          {t.passages.tipsStart}
        </Button>
      </motion.div>
    </motion.div>
  );
}
