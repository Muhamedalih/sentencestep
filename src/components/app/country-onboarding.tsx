"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { motion } from "framer-motion";

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
 * The third of the five steps in the homepage's "get started" flow (language
 * -> level -> country -> OnboardingIntroCard -> lesson), between
 * StartingLevelOnboarding and OnboardingIntroCard — same full-page-takeover
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
 * event (see trackOnboardingCountryAction) — this step is purely optional
 * and its own "have I been shown" state is deliberately as ephemeral as the
 * rest of this in-memory-only context.
 *
 * Country names are resolved at render time via the browser's own
 * Intl.DisplayNames rather than a hand-translated list (see
 * country-codes.ts's own doc comment) — zero extra data over the wire, and
 * automatically correct for whichever SupportLocale is active. Picking a
 * country fires trackOnboardingCountryAction as fire-and-forget (never
 * awaited before advancing): a single small analytics-event insert, not a
 * blocking round trip, matching the light-touch treatment every other event
 * in this app's analytics pipeline already gets.
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
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

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

  function handleSkip() {
    setCountryStepDone(true);
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
          3/4
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
          className="flex h-full w-full max-w-xl flex-col text-center"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t.countryOnboarding.heading}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-balance">
            {t.countryOnboarding.subtitle}
          </p>

          <div className="relative mt-8">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2"
            />
            <Input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.countryOnboarding.searchPlaceholder}
              className="ps-10"
              aria-label={t.countryOnboarding.searchPlaceholder}
            />
          </div>

          <div className="border-border bg-card mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border text-start">
            {filtered.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country.code)}
                className="border-border hover:bg-secondary focus-visible:ring-ring flex w-full items-center gap-3 border-b px-4 py-3 text-start outline-none last:border-b-0 focus-visible:ring-2 focus-visible:-outline-offset-2"
              >
                <span
                  aria-hidden="true"
                  className={`fi fi-${country.code} !block !h-4 !w-5.5 shrink-0 rounded-sm bg-center shadow-[0_0_0_1px_var(--border)]`}
                />
                <span className="truncate text-sm font-medium">{country.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                {t.countryOnboarding.noResults}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground mx-auto mt-4 w-fit text-sm font-medium transition-colors"
          >
            {t.countryOnboarding.skip}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
