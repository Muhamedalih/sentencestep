"use client";

import { useSyncExternalStore } from "react";

import {
  GERMAN_LETTERS_DONE_KEY,
  GERMAN_LEVEL_POPUP_KEY,
  GERMAN_ZERO_PICK_KEY,
} from "@/lib/german-letters";

/**
 * What this browser remembers about the German beginner features (permission germanZero): the letters
 * lesson done (finished or skipped), «from zero» picked in the level step, and the level pop-up of an
 * English learner who adds German answered. Per-viewer conveniences only, so localStorage; a blocked
 * storage just shows the pop-up or the lesson card again.
 */
const listeners = new Set<() => void>();
const cache = new Map<string, boolean>();

function read(key: string): boolean {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  let value = false;
  try {
    value = window.localStorage.getItem(key) === "1";
  } catch {
    value = false;
  }
  cache.set(key, value);
  return value;
}

function write(key: string, value: boolean) {
  cache.set(key, value);
  try {
    if (value) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // A convenience only.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useFlag(key: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  );
}

/** The letters lesson was finished or skipped on this browser. */
export const useGermanLettersDone = () => useFlag(GERMAN_LETTERS_DONE_KEY);
export const markGermanLettersDone = () => write(GERMAN_LETTERS_DONE_KEY, true);

/** «From zero» was picked: the first-run flow opens the letters lesson instead of the opening lesson. */
export const useGermanZeroPick = () => useFlag(GERMAN_ZERO_PICK_KEY);
export const setGermanZeroPick = (value: boolean) => write(GERMAN_ZERO_PICK_KEY, value);

/** The level pop-up (an English learner adding German) was answered once. */
export const useGermanLevelPopupAnswered = () => useFlag(GERMAN_LEVEL_POPUP_KEY);
export const markGermanLevelPopupAnswered = () => write(GERMAN_LEVEL_POPUP_KEY, true);

/** Non-hook reads for event handlers. */
export const readGermanLevelPopupAnswered = () => read(GERMAN_LEVEL_POPUP_KEY);
export const readGermanZeroPick = () => read(GERMAN_ZERO_PICK_KEY);
