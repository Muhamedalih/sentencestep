"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { Difficulty } from "@/lib/levels";

/**
 * The state shared between the three steps of the homepage's "get started"
 * flow — FirstTimeLanguagePicker, StartingLevelOnboarding, and
 * OnboardingIntroCard (see src/app/layout.tsx, where all three mount side by
 * side). Neither step's own persisted state (the locale cookie,
 * startingLevel) is ever touched by "going back": forceLanguageStep just
 * tells the language step to show again even though a locale is already
 * set, so the level step's back button can return to it without discarding
 * anything — picking a language there (even the same one again) clears this
 * and naturally falls through to the level step exactly as the first time
 * through.
 *
 * pendingDifficulty exists purely for cross-component reactivity:
 * useProgress() keeps its state in a plain useState local to each call site,
 * not a shared store, so StartingLevelOnboarding calling its own
 * setStartingLevel() never reactively updates OnboardingIntroCard's separate
 * useProgress() instance — only a real React Context write does. Picking a
 * tier sets both (setStartingLevel for persistence, setPendingDifficulty for
 * this immediate cross-component signal); OnboardingIntroCard falls back to
 * deriving the difficulty from its own useProgress().startingLevel when
 * pendingDifficulty is null (e.g. a fresh page load resuming an
 * already-chosen-but-not-yet-started placement, where that own-instance read
 * is already correct and no cross-component signal is needed).
 */
interface GetStartedStepContextValue {
  forceLanguageStep: boolean;
  setForceLanguageStep: (value: boolean) => void;
  pendingDifficulty: Difficulty | null;
  setPendingDifficulty: (value: Difficulty | null) => void;
}

const GetStartedStepContext = createContext<GetStartedStepContextValue>({
  forceLanguageStep: false,
  setForceLanguageStep: () => {},
  pendingDifficulty: null,
  setPendingDifficulty: () => {},
});

export function GetStartedStepProvider({ children }: { children: ReactNode }) {
  const [forceLanguageStep, setForceLanguageStep] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);
  return (
    <GetStartedStepContext.Provider
      value={{ forceLanguageStep, setForceLanguageStep, pendingDifficulty, setPendingDifficulty }}
    >
      {children}
    </GetStartedStepContext.Provider>
  );
}

export function useGetStartedStep(): GetStartedStepContextValue {
  return useContext(GetStartedStepContext);
}
