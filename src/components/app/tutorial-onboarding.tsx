"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { MessageSquare, Mic, RefreshCw, Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { isMarketingHomePath } from "@/lib/i18n/locales";
import { difficultyForStartingLevel } from "@/lib/progress/starting-level";
import { cn } from "@/lib/utils";

const SLIDES = [
  { icon: MessageSquare, titleKey: "title1", bodyKey: "body1" },
  { icon: Volume2, titleKey: "title2", bodyKey: "body2" },
  { icon: Mic, titleKey: "title3", bodyKey: "body3" },
  { icon: RefreshCw, titleKey: "title4", bodyKey: "body4" },
] as const;

/**
 * The fourth of the six steps in the homepage's "get started" flow (language
 * -> level -> country -> tutorial -> OnboardingIntroCard -> lesson), between
 * CountryOnboarding and OnboardingIntroCard — same full-page-takeover shell,
 * same isMarketingHomePath/zero-completions gating. Gated on `countryStepDone
 * && !tutorialStepDone` (GetStartedStepProvider), so it can only appear once
 * the country step has resolved and disappears the moment either its last
 * slide or its skip link is tapped.
 *
 * A self-contained four-slide walkthrough of the app's learning loop: the
 * current slide index lives in local state (not GetStartedStepProvider)
 * since nothing outside this component ever needs to read or react to it.
 * There's no back button, unlike the steps before it — going back a slide is
 * simply not offered, matching the reference design this was built from. Skip
 * resolves `tutorialStepDone` exactly like finishing slide 4 does: this step
 * is purely informational and never meant to block reaching the first lesson.
 */
export function TutorialOnboarding() {
  const { locale, t, dir } = useLocale();
  const { isLoaded, completions, startingLevel } = useProgress();
  const { pendingDifficulty, countryStepDone, tutorialStepDone, setTutorialStepDone } =
    useGetStartedStep();
  const difficulty = pendingDifficulty ?? difficultyForStartingLevel(startingLevel);
  const pathname = usePathname();
  const [slide, setSlide] = useState(0);

  if (!isMarketingHomePath(pathname)) return null;
  if (!locale || !isLoaded || completions.length > 0) return null;
  if (difficulty === null || !countryStepDone || tutorialStepDone) return null;

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide] ?? SLIDES[0];
  const Icon = current.icon;

  function handleContinue() {
    if (isLast) {
      setTutorialStepDone(true);
      return;
    }
    setSlide((value) => value + 1);
  }

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.tutorialOnboarding[current.titleKey]}
    >
      <div className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1.5" dir="ltr">
          {SLIDES.map((_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === slide
                  ? "bg-primary w-5"
                  : index < slide
                    ? "bg-primary w-1.5"
                    : "bg-border w-1.5",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            dir={dir}
            className="flex w-full max-w-sm flex-col items-center text-center"
          >
            <span className="border-border bg-card text-primary mb-6 flex size-16 items-center justify-center rounded-2xl border">
              <Icon aria-hidden="true" className="size-7" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {t.tutorialOnboarding[current.titleKey]}
            </h1>
            <p className="text-muted-foreground mt-2.5 text-sm text-balance">
              {t.tutorialOnboarding[current.bodyKey]}
            </p>

            <div className="mt-8 flex w-full flex-col items-center gap-4">
              <Button size="lg" className="w-full" onClick={handleContinue}>
                {isLast ? t.tutorialOnboarding.startCta : t.tutorialOnboarding.continueCta}
              </Button>
              <button
                type="button"
                onClick={() => setTutorialStepDone(true)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {t.tutorialOnboarding.skip}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
