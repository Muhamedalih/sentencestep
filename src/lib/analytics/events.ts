import type { LearningMode } from "@/types/content";

// --- The analytics event catalog. ---
//
// Centralized and strongly typed rather than scattered ad-hoc tracking
// calls through components — see track.ts, the only function anything
// calls to record one of these. Every call site is server-side (Server
// Actions / Server Components), so there is no client-callable "send any
// event name" surface for this to guard against in the first place.
//
// LESSON_ABANDONED is deliberately not implemented as a directly-fired
// event: there's no reliable way to distinguish "gave up" from "still
// reading" or "closed the tab to resume later" from a real-time signal, and
// a client-side beforeunload/sendBeacon hook is not reliable enough to
// trust as product data. Abandonment is instead a *derived* metric —
// started events with no matching completed event — computed in
// insights.ts from the two events that ARE reliably measurable.

export type AnalyticsEventCategory =
  "AUTH" | "LEARNING" | "CONTENT" | "PROGRESS" | "PREMIUM" | "ENGAGEMENT";

interface LessonProperties {
  lessonId: string;
  mode: LearningMode;
  level: number;
}

interface LessonCompletionProperties extends LessonProperties {
  /** 0–1 ratio, already computed by the typing engine/progress system — never raw keystrokes. */
  accuracy: number;
}

export type AnalyticsEvent =
  | { name: "USER_SIGNED_UP"; category: "AUTH"; properties: Record<string, never> }
  | { name: "USER_SIGNED_IN"; category: "AUTH"; properties: Record<string, never> }
  | { name: "LESSON_STARTED"; category: "LEARNING"; properties: LessonProperties }
  | { name: "STORY_STARTED"; category: "LEARNING"; properties: LessonProperties }
  | { name: "CONVERSATION_STARTED"; category: "LEARNING"; properties: LessonProperties }
  | { name: "LESSON_COMPLETED"; category: "LEARNING"; properties: LessonCompletionProperties }
  | { name: "STORY_COMPLETED"; category: "LEARNING"; properties: LessonCompletionProperties }
  | { name: "CONVERSATION_COMPLETED"; category: "LEARNING"; properties: LessonCompletionProperties }
  | {
      name: "LEVEL_COMPLETED";
      category: "PROGRESS";
      properties: { mode: LearningMode; level: number };
    }
  | {
      name: "PREMIUM_CONTENT_VIEWED";
      category: "PREMIUM";
      properties: { lessonId: string; mode: LearningMode };
    }
  | { name: "UPGRADE_VIEWED"; category: "PREMIUM"; properties: Record<string, never> }
  | { name: "UPGRADE_CTA_CLICKED"; category: "PREMIUM"; properties: Record<string, never> }
  | {
      name: "AUDIO_PLAYED";
      category: "ENGAGEMENT";
      /** One event per session (first use), not per click/replay — see track-actions.ts. Mode only: no lesson id, no audio URL, no click history. */
      properties: { mode: LearningMode };
    };

export type AnalyticsEventName = AnalyticsEvent["name"];

/** The one integration point for "a lesson/story/conversation was opened" — picks the right event name for the mode. */
export function startedEvent(mode: LearningMode, lessonId: string, level: number): AnalyticsEvent {
  const properties: LessonProperties = { lessonId, mode, level };
  if (mode === "stories") return { name: "STORY_STARTED", category: "LEARNING", properties };
  if (mode === "conversation") {
    return { name: "CONVERSATION_STARTED", category: "LEARNING", properties };
  }
  return { name: "LESSON_STARTED", category: "LEARNING", properties };
}

/** The one integration point for "a lesson/story/conversation was completed" — picks the right event name for the mode. */
export function completedEvent(
  mode: LearningMode,
  lessonId: string,
  level: number,
  accuracy: number,
): AnalyticsEvent {
  const properties: LessonCompletionProperties = { lessonId, mode, level, accuracy };
  if (mode === "stories") return { name: "STORY_COMPLETED", category: "LEARNING", properties };
  if (mode === "conversation") {
    return { name: "CONVERSATION_COMPLETED", category: "LEARNING", properties };
  }
  return { name: "LESSON_COMPLETED", category: "LEARNING", properties };
}
