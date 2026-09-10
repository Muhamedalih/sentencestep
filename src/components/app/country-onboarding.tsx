"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Globe, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import { trackOnboardingCountryAction } from "@/lib/analytics/track-actions";
import { isMarketingHomePath } from "@/lib/i18n/locales";
import { COUNTRY_CODES, type CountryCode } from "@/lib/i18n/country-codes";
import { difficultyForStartingLevel } from "@/lib/progress/starting-level";

/**
 * The third of the six steps in the homepage's "get started" flow (language
 * -> level -> country -> tutorial -> OnboardingIntroCard -> lesson), between
 * StartingLevelOnboarding and TutorialOnboarding — same full-page-takeover
 * shell, same isMarketingHomePath/zero-completions gating. Gated on "a tier
 * has been picked" AND `!countryStepDone` (GetStartedStepProvider), where
 * "a tier has been picked" is `pendingDifficulty ?? difficultyForStartingLevel
 * (startingLevel)` — the exact same derivation OnboardingIntroCard uses, for
 * the exact same reason (see that component's own doc comment, and
 * GetStartedStepProvider's): useProgress() keeps its state local to each
 * call site, so reading this component's own `startingLevel` alone would
 * never reactively see StartingLevelOnboarding's sibling instance calling
 * setStartingLevel() the instant a tier is picked — only pendingDifficulty,
 * a real context write, does. A chosen country is never written to the
 * guest's local progress or a cookie, only reported once as an analytics
 * event (see trackOnboardingCountryAction) — this step's own "have I been
 * shown" state is deliberately as ephemeral as the rest of this
 * in-memory-only context.
 *
 * Required, not skippable: `countryStepDone` only ever flips true from
 * handleSelect below, so TutorialOnboarding (gated on it) can't be reached
 * without an actual pick. The list itself stays collapsed behind a single
 * field (`isOpen` below) until tapped, opening a centered search modal
 * rather than expanding in place — picking a country from the language
 * step's three flag cards is one glance; picking one of ~195 needs a
 * deliberate "I'm ready to search" action first, not a wall of countries as
 * the very first thing this step shows.
 *
 * Country names are resolved at render time via the browser's own
 * Intl.DisplayNames rather than a hand-translated list (see
 * country-codes.ts's own doc comment) — zero extra data over the wire, and
 * automatically correct for whichever SupportLocale is active. Picking a
 * country fires trackOnboardingCountryAction as fire-and-forget (never
 * awaited before advancing): a single small analytics-event insert, not a
 * blocking round trip, matching the light-touch treatment every other event
 * in this app's analytics pipeline already gets.
 *
 * Deliberately text-only, no per-row flag icon: each `flag-icons` CSS class
 * fetches its own background-image the instant an element carrying it
 * exists in the DOM, so the unfiltered ~195-country list used to fire ~195
 * simultaneous image requests the moment the modal opened — heavy enough on
 * a slow connection or low-end device to jank the open badly. Names alone
 * are plain text, effectively free to render even all ~195 at once, which
 * is also why this list is a plain `.map` rather than a windowed/virtualized
 * one — there's no per-row cost left here worth optimizing around.
 */
export function CountryOnboarding() {
  const { locale, t, dir } = useLocale();
  const { isLoaded, completions, startingLevel } = useProgress();
  const {
    forceLevelStep,
    setForceLevelStep,
    pendingDifficulty,
    countryStepDone,
    setCountryStepDone,
  } = useGetStartedStep();
  const difficulty = pendingDifficulty ?? difficultyForStartingLevel(startingLevel);
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  const regionNames = useMemo(
    () => new Intl.DisplayNames([locale ?? "en"], { type: "region" }),
    [locale],
  );
  const collator = useMemo(() => new Intl.Collator(locale ?? "en"), [locale]);

  const countries = useMemo(() => {
    const list = COUNTRY_CODES.map((code) => ({
      code,
      name: regionNames.of(code.toUpperCase()) ?? code.toUpperCase(),
    }));
    list.sort((a, b) => collator.compare(a.name, b.name));
    return list;
  }, [regionNames, collator]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return countries;
    return countries.filter((country) => country.name.toLowerCase().includes(needle));
  }, [countries, query]);

  if (forceLevelStep) return null; // back button below sent them to the level step instead
  if (!isMarketingHomePath(pathname)) return null;
  if (!locale || !isLoaded || completions.length > 0) return null;
  if (difficulty === null || countryStepDone) return null;

  function handleSelect(code: CountryCode) {
    setCountryStepDone(true);
    trackOnboardingCountryAction(code).catch(() => {});
  }

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.countryOnboarding.heading}
    >
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          3/5
        </span>
      </div>

      <button
        type="button"
        dir={dir}
        onClick={() => setForceLevelStep(true)}
        className="text-muted-foreground hover:text-foreground mt-6 flex w-fit items-center gap-1 text-sm font-medium transition-colors"
      >
        <BackIcon aria-hidden="true" className="size-4" />
        {t.onboarding.back}
      </button>

      <div className="flex flex-1 items-center justify-center overflow-hidden py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          dir={dir}
          className="flex w-full max-w-xl flex-col text-center"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t.countryOnboarding.heading}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-balance">
            {t.countryOnboarding.subtitle}
          </p>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="border-border bg-card hover:border-primary focus-visible:ring-ring mt-8 flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-start transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <Globe aria-hidden="true" className="text-muted-foreground size-4.5 shrink-0" />
            <span className="text-muted-foreground flex-1 text-sm font-medium">
              {t.countryOnboarding.searchPlaceholder}
            </span>
            <ChevronDown aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-10 flex items-center justify-center bg-black/55 p-6"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              dir={dir}
              onClick={(event) => event.stopPropagation()}
              className="border-border bg-card flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="bg-brand-muted text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Globe aria-hidden="true" className="size-4" />
                  </span>
                  <h2 className="text-base font-semibold">{t.countryOnboarding.modalTitle}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={t.countryOnboarding.closeLabel}
                  className="text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>

              <div className="relative mt-4">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2"
                />
                <Input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.countryOnboarding.searchPlaceholder}
                  className="ps-10"
                  aria-label={t.countryOnboarding.searchPlaceholder}
                />
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto text-start">
                {filtered.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className="border-border hover:bg-secondary focus-visible:ring-ring flex w-full items-center border-b px-1 py-3 text-start outline-none last:border-b-0 focus-visible:ring-2 focus-visible:-outline-offset-2"
                  >
                    <span className="truncate text-sm font-medium">{country.name}</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-muted-foreground px-1 py-6 text-center text-sm">
                    {t.countryOnboarding.noResults}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
