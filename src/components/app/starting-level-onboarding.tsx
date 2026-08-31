"use client";

import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { tierSupportLabel } from "@/lib/levels";
import { STARTING_LEVEL_TIERS } from "@/lib/progress/starting-level";

const TIER_BODY_KEY = {
  beginner: "beginnerBody",
  intermediate: "intermediateBody",
  advanced: "advancedBody",
} as const;

/**
 * A one-time placement choice for a genuinely new learner — mounted
 * alongside the rest of the dashboard chrome (see the (dashboard) layout),
 * gated on `startingLevel === null` (never asked yet, see
 * profiles.starting_level's doc comment) AND zero completions, so it can
 * never interrupt a returning learner or one who already has real progress,
 * only ever fires once (choosing a tier OR skipping both set startingLevel,
 * see useProgress's setStartingLevel), and is always skippable — this never
 * blocks navigation the way FirstTimeLanguagePicker's language gate does.
 */
export function StartingLevelOnboarding() {
  const { locale, t, dir } = useLocale();
  const { isLoaded, completions, startingLevel, setStartingLevel } = useProgress();

  if (!locale || !isLoaded || startingLevel !== null || completions.length > 0) return null;

  return (
    <div
      className="bg-background/95 fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t.onboarding.heading}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        dir={dir}
        className="border-border bg-card w-full max-w-sm rounded-2xl border p-8 text-center shadow-xl"
      >
        <h1 className="text-xl font-semibold tracking-tight text-balance">
          {t.onboarding.heading}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm text-balance">{t.onboarding.subtitle}</p>

        <div className="mt-6 flex flex-col gap-3">
          {STARTING_LEVEL_TIERS.map(({ difficulty, level }) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => setStartingLevel(level)}
              className="border-border hover:border-primary hover:bg-brand-muted focus-visible:ring-ring focus-visible:ring-offset-background rounded-xl border px-5 py-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span className="block font-medium">{tierSupportLabel(difficulty, locale)}</span>
              <span className="text-muted-foreground mt-0.5 block text-sm">
                {t.onboarding[TIER_BODY_KEY[difficulty]]}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStartingLevel(0)}
          className="text-muted-foreground hover:text-foreground mt-5 text-sm font-medium underline-offset-4 hover:underline"
        >
          {t.onboarding.skip}
        </button>
      </motion.div>
    </div>
  );
}
