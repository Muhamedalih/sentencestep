"use client";

import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { Logo } from "@/components/layout/logo";
import { LOCALE_META, SUPPORT_LOCALES } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * Mounted once, high in src/app/layout.tsx, alongside every page — renders
 * nothing once a locale is known (see useLocale's `locale` being non-null)
 * UNLESS StartingLevelOnboarding's back button set `forceLanguageStep`
 * (see GetStartedStepProvider), so a first-time visitor can return here
 * from the level step without their already-chosen locale being discarded
 * — picking again (even the same language) just clears that flag and falls
 * through to the level step exactly as the first time through. Otherwise a
 * genuinely first-time, cookie-less visitor sees it on top of whatever page
 * they landed on and it disappears the instant they choose, no redirect or
 * reload. Fully opaque (not a backdrop-blur-through modal) and paired with
 * StartingLevelOnboarding's identical minimal-top-bar/step-badge shell —
 * together they read as step 1 and 2 of one linear "get started" flow
 * rather than a popup interrupting a marketing page, which is exactly what
 * replaces that marketing page as a brand-new guest's first impression.
 */
export function FirstTimeLanguagePicker() {
  const { locale, t, setLocale } = useLocale();
  const { forceLanguageStep, setForceLanguageStep } = useGetStartedStep();
  if (locale && !forceLanguageStep) return null;

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.firstTimePicker.heading}
    >
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          1/3
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl text-center"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t.firstTimePicker.heading}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-balance">
            {t.firstTimePicker.subtitle}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {SUPPORT_LOCALES.map((option) => (
              <motion.button
                key={option}
                type="button"
                dir={LOCALE_META[option].dir}
                onClick={() => {
                  setLocale(option);
                  setForceLanguageStep(false);
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="border-border bg-card hover:border-primary hover:shadow-primary/10 focus-visible:ring-ring focus-visible:ring-offset-background flex flex-col items-center gap-3 rounded-2xl border px-6 py-8 transition-colors outline-none hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    `fi fi-${LOCALE_META[option].flagCountryCode}`,
                    "!block !h-8 !w-11 rounded-md bg-center shadow-[0_0_0_1px_var(--border)]",
                  )}
                />
                <span className="text-lg font-medium">{LOCALE_META[option].nativeLabel}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
