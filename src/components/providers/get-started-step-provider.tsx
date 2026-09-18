"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

import { useProgress } from "@/hooks/use-progress";
import type { Difficulty } from "@/lib/levels";
import { clearProgress } from "@/lib/progress/store";
import { LOCALE_COOKIE } from "@/lib/i18n/locale-cookie";
import { hasSupabaseAuthCookieClient } from "@/lib/supabase/has-session-cookie-client";

/**
 * Removes root-html-shell.tsx's ONBOARDING_TRANSITION_MASK_SCRIPT's mask element
 * the instant useProgress()'s `isLoaded` turns true — see that script's own
 * doc comment for what it's covering and why. A separate component (not
 * inline in GetStartedStepProvider itself) purely so this useProgress()
 * instance — and the guest-progress read/signed-in fetch it triggers — only
 * ever exists on the two marketing route groups this mask can possibly be
 * present on, never on every other route GetStartedStepProvider also mounts
 * on (see its own `localizedNavigation` prop doc comment).
 */
function GetStartedMaskCleanup() {
  const { isLoaded } = useProgress();
  useLayoutEffect(() => {
    if (!isLoaded) return;
    document.getElementById("get-started-mask")?.remove();
  }, [isLoaded]);
  return null;
}

/**
 * How long the tab must stay hidden before a hidden→visible edge counts as
 * "left and came back," rather than a momentary notification glance or app
 * switch that shouldn't wipe an in-progress guest's language/level choice.
 */
const HIDDEN_RESET_THRESHOLD_MS = 60_000;

/**
 * The state shared between the six steps of the homepage's "get started"
 * flow — IntroLanding, FirstTimeLanguagePicker, StartingLevelOnboarding,
 * CountryOnboarding, TutorialOnboarding, and OnboardingIntroCard (see
 * root-html-shell.tsx, where all six mount side by side). Neither step's own persisted state (the
 * locale cookie, startingLevel) is ever touched by "going back":
 * forceLanguageStep just tells the language step to show again even though a
 * locale is already set, so the level step's back button can return to it
 * without discarding anything — picking a language there (even the same one
 * again) clears this and naturally falls through to the level step exactly
 * as the first time through. forceLevelStep is the same pattern one step
 * later, for CountryOnboarding's own back button returning to the level
 * step.
 *
 * introContinued is the analogous flag for the first step: it starts false,
 * so a genuinely first-time visitor sees IntroLanding before the language
 * picker, and flips true (in-memory only, never persisted) once they tap its
 * Continue button — at which point FirstTimeLanguagePicker's own `!locale`
 * gate is what takes over, exactly as if IntroLanding had never existed.
 * There's deliberately no way back into IntroLanding once continued (unlike
 * forceLanguageStep/forceLevelStep for the steps after it): it's a one-time
 * introduction, not a step worth revisiting.
 *
 * countryStepDone gates TutorialOnboarding the same way pendingDifficulty/
 * startingLevel already does: it starts false, and flips true either once
 * the guest picks a country (CountryOnboarding) or taps its skip control —
 * either way, "this optional step has been shown and resolved," never
 * persisted, so it's simply false again on a fresh page load (matching
 * every other step's fully client-session-scoped state here).
 *
 * tutorialStepDone is the same pattern one step later: it gates the actual
 * last step, OnboardingIntroCard, and flips true once the guest finishes
 * TutorialOnboarding's four slides or taps its skip link — skip resolves it
 * exactly like finishing the last slide does, since the tutorial is purely
 * informational and never blocks reaching the first lesson.
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
  forceLevelStep: boolean;
  setForceLevelStep: (value: boolean) => void;
  pendingDifficulty: Difficulty | null;
  setPendingDifficulty: (value: Difficulty | null) => void;
  countryStepDone: boolean;
  setCountryStepDone: (value: boolean) => void;
  tutorialStepDone: boolean;
  setTutorialStepDone: (value: boolean) => void;
}

const GetStartedStepContext = createContext<GetStartedStepContextValue>({
  introContinued: false,
  setIntroContinued: () => {},
  forceLanguageStep: false,
  setForceLanguageStep: () => {},
  forceLevelStep: false,
  setForceLevelStep: () => {},
  pendingDifficulty: null,
  setPendingDifficulty: () => {},
  countryStepDone: false,
  setCountryStepDone: () => {},
  tutorialStepDone: false,
  setTutorialStepDone: () => {},
});

export function GetStartedStepProvider({
  localizedNavigation = false,
  children,
}: {
  /**
   * True only under the two marketing root layouts ((default) and
   * [locale]) — mirrors LocaleProvider's own prop of the same name (see
   * root-html-shell.tsx). Scopes the "forget everything while signed out"
   * reset below to the marketing entry surface only, so it can never fire
   * while a guest is mid-lesson on /learn.
   */
  localizedNavigation?: boolean;
  children: ReactNode;
}) {
  const [introContinued, setIntroContinued] = useState(false);
  const [forceLanguageStep, setForceLanguageStep] = useState(false);
  const [forceLevelStep, setForceLevelStep] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);
  const [countryStepDone, setCountryStepDone] = useState(false);
  const [tutorialStepDone, setTutorialStepDone] = useState(false);

  // introContinued is deliberately in-memory only (see its own doc comment),
  // which assumes "leaving the site" always means a real page load that
  // remounts this provider fresh. Switching away from the tab (another app
  // on a phone, another browser tab, the device lock screen) and back
  // doesn't necessarily do that: most mobile browsers just keep the same
  // page instance running in the background rather than unloading it, so
  // neither a reload nor even a bfcache `pageshow` restore is guaranteed to
  // fire — `visibilitychange` is the one signal that reliably does.
  // `visibilitychange` fires on every hidden→visible edge though, including
  // a glance at a notification or a momentary app switch — nowhere close to
  // "left and came back to the site" — so a minimum away-duration
  // (HIDDEN_RESET_THRESHOLD_MS) gates it: only a hidden spell at least that
  // long counts as a real departure. `pageshow`'s `persisted` flag is kept
  // alongside it, ungated, as a second signal for an actual bfcache
  // restore, which only fires from real navigation history traversal (back/
  // forward to and from another page) and so is never triggered by a brief
  // focus blip the way `visibilitychange` is.
  //
  // But a visitor who'd already picked a language (or a starting level)
  // before leaving wasn't landing back on IntroLanding either way, even
  // with introContinued reset: that choice lives in the ss_locale cookie
  // and the guest-progress localStorage blob, both deliberately durable
  // (see LocaleProvider and progress/store.ts) so an ordinary returning
  // guest doesn't get re-asked every visit — but confirmed as explicitly
  // NOT wanted here: for a signed-out visitor specifically, every return to
  // the marketing entry surface should restart from IntroLanding with
  // nothing remembered, same as the very first visit ever. Clearing both
  // and reloading (rather than just resetting local state) is what actually
  // gets there — a plain state reset would leave a stale locale cookie
  // that'd just re-resolve non-null on the very next request, or leave
  // StartingLevelOnboarding/CountryOnboarding still gated open by
  // localStorage flags this component doesn't own. Scoped to
  // `localizedNavigation` (the two marketing route groups only, see this
  // component's own prop doc comment) and to a signed-out visitor
  // (hasSupabaseAuthCookieClient) specifically, so it can never fire while a
  // guest is mid-lesson on /learn, and never touches a signed-in learner's
  // real, server-backed preferred_language.
  useEffect(() => {
    function resetIntro() {
      setIntroContinued(false);
    }
    function forgetGuestChoices() {
      if (!localizedNavigation || hasSupabaseAuthCookieClient()) return;
      document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
      clearProgress();
      // A plain reload isn't enough on a locale-prefixed path ("/ar", ...):
      // [locale]/layout.tsx resolves `locale` from the URL segment itself,
      // never a cookie read, so reloading "/ar" would still render with
      // locale="ar" regardless of the cookie just cleared above. "/" is the
      // one path whose layout resolves `locale` from the (now-cleared)
      // cookie, which is also exactly "the first page" being asked for.
      window.location.href = "/";
    }
    let hiddenAt: number | null = null;
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (document.visibilityState !== "visible") return;
      const wasHiddenLongEnough =
        hiddenAt !== null && Date.now() - hiddenAt >= HIDDEN_RESET_THRESHOLD_MS;
      hiddenAt = null;
      if (!wasHiddenLongEnough) return;
      resetIntro();
      forgetGuestChoices();
    }
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      resetIntro();
      forgetGuestChoices();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [localizedNavigation]);

  return (
    <GetStartedStepContext.Provider
      value={{
        introContinued,
        setIntroContinued,
        forceLanguageStep,
        setForceLanguageStep,
        forceLevelStep,
        setForceLevelStep,
        pendingDifficulty,
        setPendingDifficulty,
        countryStepDone,
        setCountryStepDone,
        tutorialStepDone,
        setTutorialStepDone,
      }}
    >
      {localizedNavigation && <GetStartedMaskCleanup />}
      {children}
    </GetStartedStepContext.Provider>
  );
}

export function useGetStartedStep(): GetStartedStepContextValue {
  return useContext(GetStartedStepContext);
}
