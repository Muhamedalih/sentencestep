import type { LearningMode } from "@/types/content";

/**
 * Where a learner stopped mid-lesson, so navigating away (Home, another
 * tab, closing the browser) and coming back later resumes at the same
 * sentence instead of restarting the lesson from the first one — the
 * literal behavior behind Home's "continue where you left off" card, not
 * just its label. Device-local only (localStorage), same guest/signed-in
 * split every other client-side progress value already uses; no server
 * round trip and no schema change, since this is a convenience checkpoint,
 * not part of the learner's real, cross-device completion record.
 *
 * Deliberately a single slot, not one per lesson: only the most recently
 * touched in-progress lesson is ever worth resuming — if a learner opens a
 * second lesson before finishing the first, the first one wasn't actually
 * "continued" from, it was abandoned in favor of the second.
 */
export interface LessonResumeState {
  mode: LearningMode;
  lessonId: string;
  sentenceIndex: number;
  updatedAt: string;
}

const STORAGE_KEY = "ss_lesson_resume";

function readRaw(): LessonResumeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LessonResumeState>;
    if (
      typeof parsed.mode !== "string" ||
      typeof parsed.lessonId !== "string" ||
      typeof parsed.sentenceIndex !== "number"
    ) {
      return null;
    }
    return parsed as LessonResumeState;
  } catch {
    return null;
  }
}

/** The in-progress sentence index for this exact lesson, or null if nothing was saved for it (a fresh lesson, a different lesson was saved last, or storage is unavailable/corrupt). */
export function getLessonResume(mode: LearningMode, lessonId: string): number | null {
  const state = readRaw();
  if (!state || state.mode !== mode || state.lessonId !== lessonId) return null;
  return state.sentenceIndex > 0 ? state.sentenceIndex : null;
}

/** The single most recently touched in-progress lesson, regardless of which lesson is currently open — what Home reads to surface a real "continue where you left off" card. */
export function getAnyLessonResume(): LessonResumeState | null {
  return readRaw();
}

/** Called on every sentence-index change (see LessonSession's resume effect) — index 0 clears rather than writes, since "just started, nothing to resume" isn't worth persisting. */
export function saveLessonResume(
  mode: LearningMode,
  lessonId: string,
  sentenceIndex: number,
): void {
  if (typeof window === "undefined") return;
  try {
    if (sentenceIndex <= 0) {
      clearLessonResume(mode, lessonId);
      return;
    }
    const state: LessonResumeState = {
      mode,
      lessonId,
      sentenceIndex,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort convenience state — a full/blocked localStorage just means
    // the next visit starts the lesson over, same as before this existed.
  }
}

/** Called on lesson completion — only actually clears when it's still this lesson's own checkpoint (a learner who opened a different lesson in another tab in the meantime already overwrote it, and completing this one shouldn't erase that newer checkpoint). */
export function clearLessonResume(mode: LearningMode, lessonId: string): void {
  if (typeof window === "undefined") return;
  try {
    const state = readRaw();
    if (state && state.mode === mode && state.lessonId === lessonId) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Same best-effort reasoning as saveLessonResume.
  }
}
