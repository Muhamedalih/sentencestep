"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { LockBodyScroll } from "@/components/app/lock-body-scroll";
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
 * they landed on, EXCEPT for the very first moment of all, which now
 * belongs to IntroLanding (mounted right before this one in
 * root-html-shell.tsx): this component also waits on `introContinued`
 * alongside `locale`, so a brand-new visitor sees IntroLanding's
 * introduction first and only reaches this step once they tap its Continue
 * button. Fully opaque (not a backdrop-blur-through modal) and paired with
 * StartingLevelOnboarding's identical minimal-top-bar/step-badge shell —
 * together they read as steps of one linear "get started" flow rather than
 * a popup interrupting a marketing page, which is exactly what replaces
 * that marketing page as a brand-new guest's first impression.
 *
 * Picking a language calls setLocaleForOnboarding, not the ordinary
 * setLocale LanguageSwitcher (the header control) uses — see that
 * function's own doc comment in LocaleProvider for why: unlike the header,
 * nothing here is ever looking at the real marketing page underneath, so
 * there's no reason to pay for a hard "/{locale}" navigation (a real
 * browser reload, since (default) and [locale] are separate root layouts)
 * just to update chrome text this step already re-renders instantly from
 * `t` the moment `locale` changes. Advancing to the level step is a plain
 * synchronous state update now, same tick as the tap — nothing to mask.
 */
export function FirstTimeLanguagePicker() {
  const { locale, t, setLocaleForOnboarding } = useLocale();
  const { introContinued, forceLanguageStep, setForceLanguageStep } = useGetStartedStep();

  // Warms the browser's cache for every locale's "/{locale}" marketing page
  // in the background — moved here, deferred, from a static
  // <link rel="prefetch"> that used to render unconditionally in
  // root-html-shell.tsx's <head> for every first-time visitor (see that
  // file's own doc comment at this same spot). That version fired at the
  // very start of page parsing, competing with the page's own critical JS
  // chunks for the browser's limited concurrent-request budget. Still the
  // exact same <link rel="prefetch"> mechanism — a real full browser
  // navigation crosses root layouts here, so next/navigation's
  // router.prefetch(), built for soft client-side transitions, wouldn't warm
  // anything useful for it — just started ~300ms after this step actually
  // mounts instead of at the very first byte of HTML, by which point the
  // page's own critical rendering is already done. Skipped once a locale is
  // already chosen (nothing left to warm up for).
  useEffect(() => {
    if (locale) return;
    const timer = setTimeout(() => {
      for (const supportLocale of SUPPORT_LOCALES) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = `/${supportLocale}`;
        document.head.appendChild(link);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [locale]);

  if (locale && !forceLanguageStep) return null;
  if (!locale && !introContinued) return null; // IntroLanding is still showing — see its own doc comment

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.firstTimePicker.heading}
    >
      <LockBodyScroll />
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          1/5
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
                  setLocaleForOnboarding(option);
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
