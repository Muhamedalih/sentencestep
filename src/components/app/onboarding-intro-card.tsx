"use client";

import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { getOnboardingCardSettings } from "@/lib/admin/onboarding-card-queries";
import type { OnboardingCardSettings } from "@/lib/admin/onboarding-card-settings";
import { OPENING_LESSON_ID, difficultyForStartingLevel } from "@/lib/progress/starting-level";

/**
 * The third and last step of the homepage's "get started" flow, right after
 * StartingLevelOnboarding — same full-page-takeover shell, same
 * `pathname === "/"` / zero-completions gating, mounted right after it in
 * layout.tsx. Shows an admin-configurable image + headline (see
 * src/app/admin/onboarding-card, src/lib/admin/onboarding-card-actions.ts)
 * and only routes into OPENING_LESSON_ID[difficulty] once the learner taps
 * "Start" — the same level-agnostic card regardless of which tier they just
 * picked.
 *
 * The difficulty to route to prefers `pendingDifficulty` from
 * GetStartedStepProvider (set the instant StartingLevelOnboarding's click
 * handler runs, in the very same tick as this component's own re-render —
 * see that context's doc comment for why a plain useProgress().startingLevel
 * read can't react to a sibling component's state change) and falls back to
 * deriving it from this component's own useProgress().startingLevel, which
 * covers a fresh page load resuming an already-chosen-but-not-yet-started
 * placement (pendingDifficulty resets to null on reload; the persisted
 * startingLevel doesn't).
 *
 * Settings are fetched client-side (a plain public-client read, not a
 * server-fetched prop from layout.tsx) so the root layout — shared by every
 * page in the app — never pays for a DB round trip on every request just for
 * this rare first-time-visitor moment; see getOnboardingCardSettings's own
 * doc comment.
 *
 * `isNavigating` mirrors the exact gap StartingLevelOnboarding used to close
 * itself before this step existed: this component is mounted at the root
 * layout, which never unmounts on a client-side route change — only
 * `pathname` updates, once the new route has actually taken over. Calling
 * router.push doesn't hide this component on its own (its gate is still
 * satisfied right up until `pathname` actually changes), so without this
 * flag the underlying page could flash through for a frame between the
 * click and the new route mounting.
 */
export function OnboardingIntroCard() {
  const { locale, t, dir } = useLocale();
  const { isLoaded, completions, startingLevel } = useProgress();
  const { pendingDifficulty } = useGetStartedStep();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [settings, setSettings] = useState<OnboardingCardSettings | null>(null);

  const difficulty = pendingDifficulty ?? difficultyForStartingLevel(startingLevel);
  const shouldShow =
    pathname === "/" && !!locale && isLoaded && difficulty !== null && completions.length === 0;

  useEffect(() => {
    if (!shouldShow || settings) return;
    let cancelled = false;
    getOnboardingCardSettings().then((result) => {
      if (!cancelled) setSettings(result);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldShow, settings]);

  if (pathname !== "/") return null;
  if (isNavigating) {
    return (
      <div className="bg-background fixed inset-0 z-100 flex items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden="true" />
      </div>
    );
  }
  if (!shouldShow || !settings || !difficulty) return null;
  const openingLessonPath = `/learn/normal/${OPENING_LESSON_ID[difficulty]}`;

  function handleStart() {
    setIsNavigating(true);
    router.push(openingLessonPath);
  }

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6"
      role="dialog"
      aria-modal="true"
      aria-label={settings.title}
    >
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          3/3
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          dir={dir}
          className="w-full max-w-md text-center"
        >
          <div className="border-border bg-card mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl border">
            {settings.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-provided Supabase Storage URL, same choice as other admin-image previews in this codebase
              <img src={settings.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="from-brand-muted to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
                <GraduationCap className="text-muted-foreground/50 size-14" aria-hidden="true" />
              </div>
            )}
          </div>

          <h1
            dir="ltr"
            className="mt-6 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {settings.title}
          </h1>

          <Button size="lg" className="mt-8 w-fit" onClick={handleStart}>
            {t.onboarding.startCta}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
