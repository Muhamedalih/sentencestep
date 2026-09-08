"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useProgress } from "@/hooks/use-progress";

type ProgressValue = ReturnType<typeof useProgress>;

const ProgressContext = createContext<ProgressValue | null>(null);

/**
 * Shares ONE useProgress() instance across every consumer inside it, instead
 * of each one calling the hook independently. The Home dashboard is the
 * motivating case: HomeHeaderBar and HomeHero (the latter twice, once
 * directly and once through useCurrentLesson) would otherwise each mount
 * their own copy of the same effect, each firing its own fetchProgressAction
 * round trip for a signed-in learner. Those requests don't resolve at the
 * same instant, so separate skeleton-to-real transitions would fire at
 * visibly different times — the "parts of the page pop in out of order"
 * symptom. Sharing one instance here means every consumer's isLoaded flips
 * true in the same render, and it's one network request instead of several.
 * Not a site-wide replacement for useProgress() (every other call site — the
 * header, lesson sessions, Stories, etc. — is unaffected and keeps calling
 * it directly), just this one page's own tree.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const value = useProgress();
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/** Requires a ProgressProvider ancestor — thrown eagerly rather than silently falling back to a fresh useProgress() call, which would just reintroduce the duplicate-fetch problem this provider exists to remove. */
export function useSharedProgress(): ProgressValue {
  const value = useContext(ProgressContext);
  if (!value) {
    throw new Error("useSharedProgress must be used within a ProgressProvider");
  }
  return value;
}
