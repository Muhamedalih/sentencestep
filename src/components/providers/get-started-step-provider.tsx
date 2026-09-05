"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * The one piece of state shared between FirstTimeLanguagePicker and
 * StartingLevelOnboarding — the two steps of the homepage's "get started"
 * flow (see src/app/layout.tsx, where both mount side by side). Neither
 * step's own persisted state (the locale cookie, startingLevel) is ever
 * touched by "going back": forceLanguageStep just tells the language step
 * to show again even though a locale is already set, so the level step's
 * back button can return to it without discarding anything — picking a
 * language there (even the same one again) clears this and naturally falls
 * through to the level step exactly as the first time through.
 */
interface GetStartedStepContextValue {
  forceLanguageStep: boolean;
  setForceLanguageStep: (value: boolean) => void;
}

const GetStartedStepContext = createContext<GetStartedStepContextValue>({
  forceLanguageStep: false,
  setForceLanguageStep: () => {},
});

export function GetStartedStepProvider({ children }: { children: ReactNode }) {
  const [forceLanguageStep, setForceLanguageStep] = useState(false);
  return (
    <GetStartedStepContext.Provider value={{ forceLanguageStep, setForceLanguageStep }}>
      {children}
    </GetStartedStepContext.Provider>
  );
}

export function useGetStartedStep(): GetStartedStepContextValue {
  return useContext(GetStartedStepContext);
}
