"use client";

import { createContext, useContext, type ReactNode } from "react";

import { disabledFeatures } from "@/lib/features/config";
import type { EffectiveFeatures } from "@/lib/features/config";

const FeatureContext = createContext<EffectiveFeatures>(disabledFeatures(false));

/**
 * Makes what THIS visitor gets from the admin feature switches (already
 * resolved server-side against sign-in / admin / premium — see
 * getEffectiveFeatures) available to Client Components. Outside the /learn
 * tree, or when the settings can't be read, the context is the "everything
 * off" default, so a component reading it never has to null-check.
 */
export function FeatureProvider({
  features,
  children,
}: {
  features: EffectiveFeatures;
  children: ReactNode;
}) {
  return <FeatureContext.Provider value={features}>{children}</FeatureContext.Provider>;
}

export function useFeatures(): EffectiveFeatures {
  return useContext(FeatureContext);
}
