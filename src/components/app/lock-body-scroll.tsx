"use client";

import { useEffect } from "react";

/**
 * Locks page scroll for as long as this is mounted, restoring whatever
 * `overflow` value was there before on unmount — same pattern already used
 * by SavedSentenceFocusOverlay, just as a mountable child rather than an
 * inline effect, so each of the "get started" flow's six full-page
 * `fixed inset-0` steps (IntroLanding, FirstTimeLanguagePicker,
 * StartingLevelOnboarding, CountryOnboarding, TutorialOnboarding,
 * OnboardingIntroCard) can drop it into their own JSX without restating
 * their own (carefully-gated) visibility condition as a second boolean for
 * a hook to depend on. Without this, the real page underneath a `fixed`
 * step stays scrollable — invisible on a mouse (the step visually covers
 * everything regardless), but a real source of jank on touch devices, where
 * scrolling/rubber-banding the hidden page behind a `position: fixed`
 * overlay is a well-known source of the overlay appearing to jump or tear
 * during the scroll.
 */
export function LockBodyScroll() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return null;
}
