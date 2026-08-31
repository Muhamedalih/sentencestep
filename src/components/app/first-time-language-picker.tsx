"use client";

import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { Logo } from "@/components/layout/logo";
import { LOCALE_META, SUPPORT_LOCALES } from "@/lib/i18n/locales";

/**
 * Mounted once, high in src/app/layout.tsx, alongside every page — renders
 * nothing once a locale is known (see useLocale's `locale` being non-null),
 * so this is a pure overlay gate rather than a separate route: a genuinely
 * first-time, cookie-less visitor sees it on top of whatever page they
 * landed on (English chrome underneath, matching what already renders
 * today) and it disappears the instant they choose, no redirect or reload.
 */
export function FirstTimeLanguagePicker() {
  const { locale, t, setLocale } = useLocale();
  if (locale) return null;

  return (
    <div
      className="bg-background/95 fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t.firstTimePicker.heading}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="border-border bg-card w-full max-w-sm rounded-2xl border p-8 text-center shadow-xl"
      >
        <Logo className="mx-auto mb-6 justify-center" />
        <h1 className="text-xl font-semibold tracking-tight text-balance">
          {t.firstTimePicker.heading}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm text-balance">
          {t.firstTimePicker.subtitle}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {SUPPORT_LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              dir={LOCALE_META[option].dir}
              onClick={() => setLocale(option)}
              className="border-border hover:border-primary hover:bg-brand-muted focus-visible:ring-ring focus-visible:ring-offset-background flex items-center justify-center gap-3 rounded-xl border px-5 py-3.5 text-lg font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                {LOCALE_META[option].flag}
              </span>
              {LOCALE_META[option].nativeLabel}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
