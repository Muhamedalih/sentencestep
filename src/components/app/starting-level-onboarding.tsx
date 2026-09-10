"use client";

import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { Logo } from "@/components/layout/logo";
import { isMarketingHomePath } from "@/lib/i18n/locales";
import { tierSupportLabel, type Difficulty } from "@/lib/levels";
import { STARTING_LEVEL_TIERS } from "@/lib/progress/starting-level";

const TIER_BODY_KEY = {
  beginner: "beginnerBody",
  intermediate: "intermediateBody",
  advanced: "advancedBody",
} as const;

/** Matches the reference onboarding's colored placement dots — purely decorative, one fixed color per tier, not theme-derived. */
const TIER_DOT_CLASS: Record<Difficulty, string> = {
  beginner: "bg-emerald-500",
  intermediate: "bg-sky-500",
  advanced: "bg-amber-500",
};

/**
 * The second of the five steps in the homepage's "get started" flow
 * (language -> level -> country -> OnboardingIntroCard -> lesson)
 * FirstTimeLanguagePicker starts (identical minimal-top-bar/step-badge
 * shell, same full-page takeover, no backdrop-blur-through), not a modal
 * popped up later inside the dashboard. Gated on `startingLevel === null`
 * (never asked yet, UNLESS CountryOnboarding's back button set
 * forceLevelStep — same pattern as forceLanguageStep below) AND zero
 * completions, so it can never interrupt a returning learner or one who
 * already has real progress; also gated on isMarketingHomePath(pathname)
 * (true for "/" and its locale-prefixed static variants "/ar"/"/es"/"/tr" —
 * see that helper's own doc comment) — mounted at the root layout (same as
 * FirstTimeLanguagePicker) rather than only the dashboard's, so it must
 * self-scope to the marketing homepage a fresh visitor actually lands on,
 * never intercepting /login, /register, or a deep-linked lesson URL for a
 * guest whose local progress happens to be empty too.
 *
 * Deliberately doesn't navigate anywhere itself: picking a tier calls
 * setStartingLevel(level) (persistence) and setPendingDifficulty(difficulty)
 * (the GetStartedStepProvider context write OnboardingIntroCard actually
 * reacts to — see that context's own doc comment for why a plain
 * setStartingLevel call alone can't reactively reach a sibling component),
 * plus setForceLevelStep(false)/setCountryStepDone(false) so re-picking a
 * tier after using CountryOnboarding's back button falls through to that
 * country step again rather than skipping straight to OnboardingIntroCard
 * with its previous answer still marked done. CountryOnboarding (mounted
 * right after this one in root-html-shell.tsx) takes over as the third
 * step; OnboardingIntroCard is what actually routes into
 * OPENING_LESSON_ID[difficulty] once the learner confirms there. See that
 * component's own doc comment for the `isNavigating`-style loading-spinner
 * treatment this used to need itself.
 */
export function StartingLevelOnboarding() {
  const { locale, t, dir } = useLocale();
  const { isLoaded, completions, startingLevel, setStartingLevel } = useProgress();
  const {
    forceLanguageStep,
    setForceLanguageStep,
    forceLevelStep,
    setForceLevelStep,
    setPendingDifficulty,
    setCountryStepDone,
  } = useGetStartedStep();
  const pathname = usePathname();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  if (forceLanguageStep) return null; // back button below sent them to the language step instead
  if (!isMarketingHomePath(pathname)) return null;
  if (!locale || !isLoaded || completions.length > 0) return null;
  if (startingLevel !== null && !forceLevelStep) return null;

  function handleSelect(difficulty: Difficulty, level: number) {
    setStartingLevel(level);
    setPendingDifficulty(difficulty);
    setForceLevelStep(false);
    setCountryStepDone(false);
  }

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.onboarding.heading}
    >
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          2/4
        </span>
      </div>

      <button
        type="button"
        dir={dir}
        onClick={() => setForceLanguageStep(true)}
        className="text-muted-foreground hover:text-foreground mt-6 flex w-fit items-center gap-1 text-sm font-medium transition-colors"
      >
        <BackIcon aria-hidden="true" className="size-4" />
        {t.onboarding.back}
      </button>

      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          dir={dir}
          className="w-full max-w-xl text-center"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t.onboarding.heading}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-balance">{t.onboarding.subtitle}</p>

          <div className="mt-10 flex flex-col gap-4">
            {STARTING_LEVEL_TIERS.map(({ difficulty, level }) => (
              <motion.button
                key={difficulty}
                type="button"
                onClick={() => handleSelect(difficulty, level)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="border-border bg-card hover:border-primary hover:shadow-primary/10 focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-4 rounded-2xl border px-6 py-5 text-start transition-colors outline-none hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Chevron aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold">
                    {tierSupportLabel(difficulty, locale)}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-sm">
                    {t.onboarding[TIER_BODY_KEY[difficulty]]}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full ${TIER_DOT_CLASS[difficulty]}`}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
