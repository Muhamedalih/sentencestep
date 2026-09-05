"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { Logo } from "@/components/layout/logo";
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

/** The one dedicated "opening lesson" written for this exact moment (see the seed data pushed via scripts/scratch's onboarding-lesson insert) — never the ordinary catalog's own first-incomplete-lesson pick, so a brand-new visitor's very first typing experience is always this specific, deliberately upbeat lesson, matched to the tier they just chose. */
const OPENING_LESSON_ID: Record<Difficulty, string> = {
  beginner: "onboarding-beginner",
  intermediate: "onboarding-intermediate",
  advanced: "onboarding-advanced",
};

/**
 * A one-time placement choice for a genuinely new learner, immediately
 * followed by dropping them straight into a real lesson — this is
 * deliberately the second and last step of the same linear "get started"
 * flow FirstTimeLanguagePicker starts (identical minimal-top-bar/step-badge
 * shell, same full-page takeover, no backdrop-blur-through), not a modal
 * popped up later inside the dashboard. Gated on `startingLevel === null`
 * (never asked yet) AND zero completions, so it can never interrupt a
 * returning learner or one who already has real progress; also gated on
 * `pathname === "/"` specifically — mounted at the root layout (same as
 * FirstTimeLanguagePicker) rather than only the dashboard's, so it must
 * self-scope to the marketing homepage a fresh visitor actually lands on,
 * never intercepting /login, /register, or a deep-linked lesson URL for a
 * guest whose local progress happens to be empty too.
 *
 * `isNavigating` closes a real gap: this component is mounted at the root
 * layout, which never unmounts on a client-side route change — only
 * `pathname` updates, and only once the new route has actually taken over.
 * Calling setStartingLevel() flips this component's own natural gate
 * (`startingLevel !== null`) to hidden the instant it's clicked, which is
 * BEFORE router.push's navigation actually finishes — without this flag,
 * that gap between "gate says hide" and "the lesson route has actually
 * mounted" let the marketing homepage flash through underneath for a
 * frame. Setting it first keeps this full-page takeover (now a loading
 * spinner instead of the cards) covering the screen for that entire gap;
 * `pathname !== "/"` firing once navigation truly completes is what
 * finally unmounts it, never this flag on its own.
 */
export function StartingLevelOnboarding() {
  const { locale, t, dir } = useLocale();
  const { isLoaded, completions, startingLevel, setStartingLevel } = useProgress();
  const { forceLanguageStep, setForceLanguageStep } = useGetStartedStep();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  if (forceLanguageStep) return null; // back button below sent them to the language step instead
  if (pathname !== "/") return null;
  if (isNavigating) {
    return (
      <div className="bg-background fixed inset-0 z-100 flex items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden="true" />
      </div>
    );
  }
  if (!locale || !isLoaded || startingLevel !== null || completions.length > 0) return null;

  function handleSelect(difficulty: Difficulty, level: number) {
    setIsNavigating(true);
    setStartingLevel(level);
    router.push(`/learn/normal/${OPENING_LESSON_ID[difficulty]}`);
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
          2/2
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
