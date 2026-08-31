"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthUserId } from "@/components/providers/auth-user-provider";
import {
  fetchProgressAction,
  migrateGuestProgressAction,
  recordCompletionAction,
} from "@/lib/progress/actions";
import { hasMigratableGuestState } from "@/lib/progress/guest-migration";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import { todayLocalISODate } from "@/lib/progress/streak";
import {
  clearProgress,
  readProgress,
  recordCompletion,
  setStartingLevel as setStartingLevelLocal,
} from "@/lib/progress/store";
import { emptyProgressState } from "@/lib/progress/types";
import type { ProgressState } from "@/lib/progress/types";
import type { LearningMode } from "@/types/content";
import { setStartingLevelAction } from "@/lib/supabase/profile-actions";

/**
 * Whether the most recent markComplete call has been durably saved.
 * "idle" before any completion this session; guests resolve straight to
 * "saved" (recordCompletion is synchronous, local-only — there's no network
 * round trip to fail). Only signed-in learners can see "saving"/"error",
 * since only their completions go through recordCompletionAction.
 */
export type CompletionSaveStatus = "idle" | "saving" | "saved" | "error";

interface LastCompletionArgs {
  mode: LearningMode;
  lessonId: string;
  accuracy: number;
  sentenceCount: number;
  wpm: number;
}

/**
 * Tracks lesson completions and streak. Signed-in learners get it from
 * Supabase (src/lib/progress/actions.ts, RLS-scoped to their own rows) so it
 * follows them across devices and logins; guests keep the original
 * localStorage behavior unchanged — there's still no requirement to create
 * an account just to try a free lesson.
 */
export function useProgress() {
  const userId = useAuthUserId();
  const [state, setState] = useState<ProgressState>(emptyProgressState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CompletionSaveStatus>("idle");
  const lastCompletionRef = useRef<LastCompletionArgs | null>(null);
  // Guards markComplete/retryMarkComplete against re-entry — a fast
  // double-click on "Retry," or a second markComplete call landing while the
  // first is still in flight, would otherwise fire recordCompletionAction
  // twice concurrently. Its upsert is idempotent for is_first_completion,
  // but XP/daily-progress/lesson_attempts are unconditional additive writes
  // (see recordCompletionAction's own doc comment), so a genuine double-fire
  // would double-count them. A ref, not state, so this doesn't depend on a
  // stale closure over saveStatus.
  const isSavingRef = useRef(false);
  // Guards migrateGuestProgressAction specifically (not the plain
  // fetchProgressAction branch, which is read-only and safe to re-fire)
  // against running twice concurrently for the same still-unmigrated
  // localStorage state — e.g. React Strict Mode's dev-only double-invoke of
  // this same effect. Without it, both calls would independently compute
  // "these completions aren't on the server yet" from the same starting
  // snapshot and both award their XP/daily-progress via additive RPCs,
  // double-counting the migration. A ref survives Strict Mode's synthetic
  // effect-cleanup-then-rerun on this same component instance, unlike a
  // plain local variable. This does NOT close the same race across two
  // separate browser tabs signing in at once — that needs a server-side
  // idempotency guard, tracked separately, not something a client-only fix
  // can close.
  const migratingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);

    async function load() {
      if (!userId) {
        if (!cancelled) {
          setState(readProgress());
          setIsLoaded(true);
        }
        return;
      }

      // A guest who signs in brings whatever localStorage progress they
      // built up before creating an account — migrate it into their new
      // (or existing) server progress first, and only clear the local copy
      // once that's actually persisted, so a failed migration leaves it in
      // place for the next mount to retry rather than losing it silently.
      const guest = readProgress();
      const todayISO = todayLocalISODate();
      let next: ProgressState;
      if (hasMigratableGuestState(guest)) {
        if (migratingRef.current) return;
        migratingRef.current = true;
        try {
          next = await migrateGuestProgressAction(guest, todayISO);
          clearProgress();
        } finally {
          migratingRef.current = false;
        }
      } else {
        next = await fetchProgressAction(todayISO);
      }

      if (!cancelled) {
        setState(next);
        setIsLoaded(true);
      }
    }

    // A signed-in load() call is a real network request (Server Action),
    // fired on every mount — unlike markComplete's request below, nothing
    // here ever awaits it, so an unhandled rejection (a dropped connection,
    // or the request getting aborted because the learner navigated away
    // before it resolved — both ordinary, not exceptional) would otherwise
    // surface as an uncaught "Failed to fetch" instead of the graceful
    // "still on localStorage/last-known state" this already degrades to.
    // Silent only when `cancelled` — a since-superseded load (a newer
    // effect run, e.g. userId changing, or React Strict Mode's dev-only
    // double-invoke) failing is expected and not worth logging; a
    // still-relevant one is.
    load().catch((error: unknown) => {
      if (!cancelled) console.error("[progress] load failed", error);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const markComplete = useCallback(
    (
      mode: LearningMode,
      lessonId: string,
      accuracy: number,
      sentenceCount: number,
      wpm: number,
    ) => {
      if (userId) {
        // The lesson-complete screen renders immediately (see LessonSession)
        // while this is still in flight — saveStatus is what lets it show a
        // "saving"/"couldn't save, retry" state instead of silently
        // pretending the completion was recorded. recordCompletionAction's
        // upsert is keyed on (user_id, lesson_id) for is_first_completion,
        // so re-calling it here on retry is safe there — but see
        // isSavingRef's doc comment for why a concurrent second call still
        // needs to be blocked rather than relied on to be harmless.
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        lastCompletionRef.current = { mode, lessonId, accuracy, sentenceCount, wpm };
        setSaveStatus("saving");
        void recordCompletionAction(mode, lessonId, accuracy, wpm, todayLocalISODate())
          .then((next) => {
            setState(next);
            setSaveStatus("saved");
          })
          .catch((error: unknown) => {
            console.error("[progress] recordCompletionAction failed", error);
            setSaveStatus("error");
          })
          .finally(() => {
            isSavingRef.current = false;
          });
      } else {
        // Synchronous and local — nothing to retry, nothing that can fail.
        setState((prev) => recordCompletion(prev, mode, lessonId, accuracy, sentenceCount));
        setSaveStatus("saved");
      }
    },
    [userId],
  );

  const retryMarkComplete = useCallback(() => {
    const args = lastCompletionRef.current;
    if (!args) return;
    markComplete(args.mode, args.lessonId, args.accuracy, args.sentenceCount, args.wpm);
  }, [markComplete]);

  const getCompletedIds = useCallback(
    (mode: LearningMode) =>
      state.completions.filter((entry) => entry.mode === mode).map((entry) => entry.lessonId),
    [state.completions],
  );

  const isCompleted = useCallback(
    (mode: LearningMode, lessonId: string) =>
      state.completions.some((entry) => entry.mode === mode && entry.lessonId === lessonId),
    [state.completions],
  );

  /** Persists a StartingLevelOnboarding choice (0 = skipped, N = a chosen tier level) — signed-in learners write it to profiles.starting_level, guests keep it in the same localStorage blob as the rest of their progress. */
  const setStartingLevel = useCallback(
    (level: number) => {
      if (userId) {
        setState((prev) => ({ ...prev, startingLevel: level }));
        setStartingLevelAction(level).catch((error: unknown) => {
          console.error("[progress] setStartingLevelAction failed", error);
        });
      } else {
        setState((prev) => setStartingLevelLocal(prev, level));
      }
    },
    [userId],
  );

  return {
    isLoaded,
    completions: state.completions,
    streak: state.streak,
    xp: state.xp,
    xpEarned: state.xpEarned,
    dailyProgress: state.dailyProgress,
    learnerLevel: getLearnerLevel(state.xp),
    rewards: state.rewards,
    startingLevel: state.startingLevel,
    setStartingLevel,
    isCompleted,
    getCompletedIds,
    markComplete,
    saveStatus,
    retryMarkComplete,
  };
}
