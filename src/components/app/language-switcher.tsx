"use client";

import { motion, useReducedMotion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { LOCALE_META, SUPPORT_LOCALES } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * The only place a learner switches between support languages — mounted in
 * SiteHeaderClient/AppHeader (top-right, alongside ThemeToggle). Only ever
 * offers whatever SUPPORT_LOCALES currently lists — English isn't a
 * selectable interface language, it's the language being learned.
 *
 * A segmented row of flag buttons rather than a dropdown: showing every
 * choice at once (each one-click) is both the requested "flags side by
 * side" design and simpler than hiding options behind a popover, and scales
 * to however many locales SUPPORT_LOCALES lists without a layout change.
 * Plain flex row (no manual left/right) so it mirrors correctly under RTL
 * for free — the container never needs to know which locale is active to
 * lay out correctly.
 *
 * Purely a visual layer over the same useLocale()/setLocale() contract as
 * before — no locale-selection, persistence, or routing logic lives here;
 * see LocaleProvider for all of that.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t, setLocale } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div
      role="radiogroup"
      aria-label={t.localeSwitcher.ariaLabel}
      className={cn(
        "bg-muted/60 ring-border/50 relative inline-flex items-center gap-0.5 rounded-full p-1 ring-1",
        className,
      )}
    >
      {SUPPORT_LOCALES.map((option) => {
        const meta = LOCALE_META[option];
        const isActive = option === locale;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={meta.nativeLabel}
            onClick={() => setLocale(option)}
            className={cn(
              "focus-visible:ring-ring focus-visible:ring-offset-background relative flex h-7 w-8 items-center justify-center rounded-full outline-none",
              "motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-out",
              "motion-safe:hover:-translate-y-px motion-safe:hover:scale-110 motion-safe:active:translate-y-0 motion-safe:active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-offset-2",
              !isActive && "opacity-55 hover:opacity-100",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="language-switcher-active"
                transition={
                  reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 32 }
                }
                className="bg-background ring-primary/15 absolute inset-0 rounded-full shadow-sm ring-1"
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                `fi fi-${meta.flagCountryCode}`,
                "relative !block !h-3.5 !w-5 rounded-[3px] bg-center shadow-[0_0_0_1px_var(--border)]",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
