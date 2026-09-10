"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { Difficulty } from "@/lib/levels";

/**
 * The state shared between the four steps of the homepage's "get started"
 * flow — IntroLanding, FirstTimeLanguagePicker, StartingLevelOnboarding, and
 * OnboardingIntroCard (see root-html-shell.tsx, where all four mount side by
 * side). Neither step's own persisted state (the locale cookie,
 * startingLevel) is ever touched by "going back": forceLanguageStep just
 * tells the language step to show again even though a locale is already
 * set, so the level step's back button can return to it without discarding
 * anything — picking a language there (even the same one again) clears this
 * and naturally falls through to the level step exactly as the first time
 * through.
 *
 * introContinued is the analogous flag for the new first step: it starts
 * false, so a genuinely first-time visitor sees IntroLanding before the
 * language picker, and flips true (in-memory only, never persisted) once
 * they tap its Continue button — at which point FirstTimeLanguagePicker's
 * own `!locale` gate is what takes over, exactly as if IntroLanding had
 * never existed. There's deliberately no way back into IntroLanding once
 * continued (unlike forceLanguageStep for the language step): it's a one-
 * time introduction, not a step worth revisiting.
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
  introContinued: boolean;
  setIntroContinued: (value: boolean) => void;
  forceLanguageStep: boolean;
  setForceLanguageStep: (value: boolean) => void;
  pendingDifficulty: Difficulty | null;
  setPendingDifficulty: (value: Difficulty | null) => void;
}

const GetStartedStepContext = createContext<GetStartedStepContextValue>({
  introContinued: false,
  setIntroContinued: () => {},
  forceLanguageStep: false,
  setForceLanguageStep: () => {},
  pendingDifficulty: null,
  setPendingDifficulty: () => {},
});

export function GetStartedStepProvider({ children }: { children: ReactNode }) {
  const [introContinued, setIntroContinued] = useState(false);
  const [forceLanguageStep, setForceLanguageStep] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);
  return (
    <GetStartedStepContext.Provider
      value={{
        introContinued,
        setIntroContinued,
        forceLanguageStep,
        setForceLanguageStep,
        pendingDifficulty,
        setPendingDifficulty,
      }}
    >
      {children}
    </GetStartedStepContext.Provider>
  );
}

export function useGetStartedStep(): GetStartedStepContextValue {
  return useContext(GetStartedStepContext);
}
