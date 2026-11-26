"use client";

import { useSyncExternalStore } from "react";

import type { TargetLanguage } from "@/lib/learn-language";

/**
 * What this browser remembers about the language-to-learn choice of the first-run flow (permission
 * germanTrack). The server keeps the real choice (a cookie and, for a signed-in learner, their profile);
 * these two flags only steer the first screens, which run before there is anything on the server to read:
 *
 *  - STEP_KEY: the "what do you want to learn?" step has been answered or skipped (German is not open),
 *    so the language step after it may show.
 *  - LANG_KEY: the language chosen there ("en" or "de"), so the level questions, which are written for
 *    English, are skipped for a visitor who chose German.
 *
 * Per-viewer conveniences only, so localStorage: a blocked or empty storage just shows the step again.
 */
const STEP_KEY = "sentencestep:learn-step";
const LANG_KEY = "sentencestep:learn-lang";

const listeners = new Set<() => void>();
let stepCache: boolean | undefined;
let langCache: TargetLanguage | null | undefined;

function readStep(): boolean {
  if (stepCache === undefined) {
    try {
      stepCache = window.localStorage.getItem(STEP_KEY) === "1";
    } catch {
      stepCache = false;
    }
  }
  return stepCache;
}

function readLang(): TargetLanguage | null {
  if (langCache === undefined) {
    try {
      const value = window.localStorage.getItem(LANG_KEY);
      langCache = value === "de" || value === "en" ? value : null;
    } catch {
      langCache = null;
    }
  }
  return langCache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

/** True once the learn-language step has been answered or skipped on this browser. */
export function useLearnStepDone(): boolean {
  return useSyncExternalStore(subscribe, readStep, () => false);
}

/** The language this browser chose in the first-run flow (or later from the top bar), or null. */
export function useLearnChoice(): TargetLanguage | null {
  return useSyncExternalStore(subscribe, readLang, () => null);
}

/** Marks the step answered or skipped; the language, when there is one, is remembered with it. */
export function finishLearnStep(language?: TargetLanguage): void {
  stepCache = true;
  if (language) langCache = language;
  try {
    window.localStorage.setItem(STEP_KEY, "1");
    if (language) window.localStorage.setItem(LANG_KEY, language);
  } catch {
    // The flag is a convenience only.
  }
  notify();
}

/** Remembers a language chosen outside the first-run step (the top bar's chip), so a stale choice never steers the first screens. */
export function rememberLearnChoice(language: TargetLanguage): void {
  langCache = language;
  try {
    window.localStorage.setItem(LANG_KEY, language);
  } catch {
    // The flag is a convenience only.
  }
  notify();
}
