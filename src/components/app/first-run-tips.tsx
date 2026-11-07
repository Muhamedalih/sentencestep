"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Keyboard, Loader2, Mic, RefreshCw, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { useOnboardingStepTracking } from "@/hooks/use-onboarding-step-tracking";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { LockBodyScroll } from "@/components/app/lock-body-scroll";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { waitForLocaleCookie } from "@/lib/i18n/browser-locale";
import { isMarketingHomePath } from "@/lib/i18n/locales";
import { OPENING_LESSON_ID, difficultyForStartingLevel } from "@/lib/progress/starting-level";

const TIPS = [
  { icon: Keyboard, title: "tip1Title", body: "tip1Body" },
  { icon: Volume2, title: "tip2Title", body: "tip2Body" },
  { icon: Mic, title: "tip3Title", body: "tip3Body" },
  { icon: RefreshCw, title: "tip4Title", body: "tip4Body" },
] as const;

/**
 * The short first run's last step before the opening lesson (start page with the language chips ->
 * level -> this -> lesson): the four habits the long run's TutorialOnboarding spreads over four
 * slides, one short line each on a single page. "Start the lesson" and "Skip" both open the lesson
 * at once — skipping only skips the reading — so there is no start card after it either.
 *
 * Same gates as the long run's tutorial (homepage only, a language saved, no lesson finished yet, a
 * level picked), without the country step it waits for there. Opening the lesson waits for the level
 * to be written and the language cookie to land, behind a spinner cover, because the lesson page is
 * a fresh page load that reads both; the cover comes before the gates, which the navigation itself
 * would otherwise open for a moment.
 */
export function FirstRunTips() {
  const { locale, t } = useLocale();
  const { isLoaded, completions, startingLevel } = useProgress();
  const { pendingDifficulty, tutorialStepDone, setTutorialStepDone, firstRunVariant } =
    useGetStartedStep();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const difficulty = pendingDifficulty ?? difficultyForStartingLevel(startingLevel);
  const isShown =
    firstRunVariant === "short" &&
    isMarketingHomePath(pathname) &&
    Boolean(locale) &&
    isLoaded &&
    completions.length === 0 &&
    difficulty !== null &&
    !tutorialStepDone;
  useOnboardingStepTracking("tutorial", isShown);

  // The cover belongs to the homepage; once the visitor is anywhere else it must be gone, so coming
  // back to the homepage later never starts out stuck on it.
  useEffect(() => {
    if (!isMarketingHomePath(pathname)) setIsNavigating(false);
  }, [pathname]);

  if (isNavigating && isMarketingHomePath(pathname)) {
    return (
      <div className="bg-background fixed inset-0 z-100 flex items-center justify-center">
        <LockBodyScroll />
        <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden="true" />
      </div>
    );
  }
  if (!isShown || difficulty === null) return null;
  const lessonPath = `/learn/normal/${OPENING_LESSON_ID[difficulty]}`;

  async function openLesson() {
    setIsNavigating(true);
    setTutorialStepDone(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await waitForLocaleCookie();
    router.push(lessonPath);
  }

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6 max-md:overflow-y-auto max-md:overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={t.firstRunTips.eyebrow}
    >
      <LockBodyScroll />
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          2/2
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-md flex-col"
        >
          <h1 dir="auto" className="text-muted-foreground text-center text-sm font-medium">
            {t.firstRunTips.eyebrow}
          </h1>

          <ul className="mt-7 flex flex-col gap-5">
            {TIPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="border-border bg-card text-primary flex size-11 shrink-0 items-center justify-center rounded-xl border">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span dir="auto" className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">{t.firstRunTips[title]}</span>
                  <span className="text-muted-foreground mt-0.5 block text-sm leading-relaxed">
                    {t.firstRunTips[body]}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <Button size="lg" className="mt-9 w-full" onClick={openLesson}>
            {t.firstRunTips.startCta}
          </Button>
          <button
            type="button"
            onClick={openLesson}
            className="text-muted-foreground hover:text-foreground mx-auto mt-3 min-h-10 px-4 text-sm font-medium transition-colors"
          >
            {t.firstRunTips.skip}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
