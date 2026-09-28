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
    }
  | {
      name: "ONBOARDING_COUNTRY_SELECTED";
      category: "ENGAGEMENT";
      /** The "which country are you in?" onboarding step (CountryOnboarding) — an ISO 3166-1 alpha-2 code (see country-codes.ts), only ever fired when the guest actually picks one, never on skip. Aggregate signal only: no IP lookup, no geolocation API, self-reported. */
      properties: { countryCode: string };
    }
  | {
      name: "RATING_PROMPT_SHOWN";
      category: "ENGAGEMENT";
      /** RatingPrompt became visible — "first" is the original second-lesson-ever ask, "milestone" a later bounded re-ask (see rating-storage.ts's MAX_PROMPT_SHOWS). The funnel denominator for RATING_SENTIMENT_SELECTED/RATING_STARS_SUBMITTED/etc below. */
      properties: { trigger: "first" | "milestone" };
    }
  | {
      name: "RATING_SENTIMENT_SELECTED";
      category: "ENGAGEMENT";
      /** RatingModal's first step — which reaction the learner picked, before seeing stars or the negative-feedback box. */
      properties: { sentiment: "positive" | "negative" };
    }
  | {
      name: "RATING_STARS_SUBMITTED";
      category: "ENGAGEMENT";
      /** A star tap on the positive path — fires the instant a star is tapped (see RatingModal), independent of whether a comment follows. */
      properties: { rating: number; hasComment: boolean; source: "prompt" | "settings" };
    }
  | {
      name: "RATING_NEGATIVE_FEEDBACK_SUBMITTED";
      category: "ENGAGEMENT";
      /** The negative-sentiment path's own "what could we do better" note was sent — never fires on a bare skip. */
      properties: { source: "prompt" | "settings" };
    }
  | {
      name: "RATING_PROMPT_SKIPPED";
      category: "ENGAGEMENT";
      /** The learner closed RatingModal without rating or sending feedback — which step they were on when they did. */
      properties: { step: "sentiment" | "stars" | "negative" };
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
