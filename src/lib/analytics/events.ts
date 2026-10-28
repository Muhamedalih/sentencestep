import type { InAppBrowser } from "@/lib/analytics/attribution";
import type { GateSource } from "@/lib/billing/gate-source";
import type { PlanId, PricingTier } from "@/lib/billing/plans";
import type { FirstRunVariant, OnboardingStep } from "@/lib/first-run/variant";
import type { HybridMoment } from "@/lib/hybrid/moments";
import type { StripPage, StripPlatform } from "@/lib/in-app-strip/strip";
import type { SessionEndAction } from "@/lib/session-end/action-names";
import type { WordsRoundSource } from "@/lib/words-round/round";
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

// USER_SIGNED_UP, PAYWALL_VIEWED, UPGRADE_VIEWED and UPGRADE_CTA_CLICKED are
// stored with a few extra properties added by track.ts (source, medium,
// campaign, inApp, country — see attribution.ts), so the funnel can be read per
// source and country. They are not part of the typed shapes below. USER_SIGNED_UP,
// LESSON_STARTED and LESSON_COMPLETED also carry `firstRun` (which first-run
// variant the visitor was given) whenever they have one, and `inAppBucket` (the visitor's number
// from 0 to 99 for the "Open in browser strip" test, see src/lib/in-app-strip/strip.ts) when the
// browser has one.

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
  | {
      name: "PAYWALL_VIEWED";
      category: "PREMIUM";
      /** A visitor was shown a lock page instead of the content (PremiumLocked / WordGroupLocked / PassageLocked) — the step before UPGRADE_VIEWED, and the only place the number of people who actually hit the paywall is known (PREMIUM_CONTENT_VIEWED only fires for those who got in). One row per page render, so count distinct users, not rows. See trackPaywallViewed. `shape` says which lock they met: the full offer, a short look at the content, or the screen after the free path (absent on rows written before those existed: the full offer). */
      properties:
        | { kind: "lesson"; mode: LearningMode; lessonId: string }
        | { kind: "word_group"; groupId: string }
        | { kind: "passage"; passageId: string };
    }
  | {
      name: "UPGRADE_VIEWED";
      category: "PREMIUM";
      /** Present when the plans page was opened with the button of a lock card (see gate-source.ts): which lock (`from`), the card's button or the phone's slim bar (`at`), and which card was shown (`v`, classic or lean). Absent for every other way of opening the page. Each row is one page load, so for a visitor who is not signed in it counts presses, not people. */
      properties: GateSource | Record<string, never>;
    }
  /** A hybrid-offer moment (src/lib/hybrid/moments.ts) was shown, tapped or dismissed: B after the taste's passage, D when the day's tasks are done, star after a story with 90% or more. Two dismissals within a week pause them, so the three are read together. */
  | { name: "OFFER_SHOWN"; category: "PREMIUM"; properties: { moment: HybridMoment } }
  | { name: "OFFER_CLICKED"; category: "PREMIUM"; properties: { moment: HybridMoment } }
  | { name: "OFFER_DISMISSED"; category: "PREMIUM"; properties: { moment: HybridMoment } }
  | {
      name: "UPGRADE_CTA_CLICKED";
      category: "PREMIUM";
      /** Which plan was chosen, at which price tier and with how many launch-offer bonus days, so plan mix and the offer can be compared once real purchases exist. Both come from the server (the tier from geolocation, the plan validated against the known ids), never raw client input. */
      properties: {
        plan: PlanId;
        tier: PricingTier;
        bonusDays: number;
        method?: "card" | "binance";
      };
    }
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
      name: "ONBOARDING_STEP_VIEWED";
      category: "ENGAGEMENT";
      /** A first-run screen was shown to a visitor (see src/lib/first-run/variant.ts for the steps and the two variants). At most once per step per browser session, so the rows are visitors reaching a step, not page renders. Where the funnel leaks, per variant. */
      properties: { step: OnboardingStep; variant: FirstRunVariant };
    }
  | {
      name: "ONBOARDING_LEVEL_SELECTED";
      category: "ENGAGEMENT";
      /** The level a visitor tapped on the first-run level step: 1 Beginner, 2 Intermediate, 3 Advanced. */
      properties: { level: number; variant: FirstRunVariant };
    }
  | {
      name: "SESSION_END_STARTED";
      category: "ENGAGEMENT";
      /** The new lesson ending (src/components/learning/session-end-flow.tsx) began after a finished lesson — one row per finished lesson. `first`: it was the learner's first lesson; `recall`: a recall round is asked before the finish screen. The denominator for every other SESSION_* event. */
      properties: { first: boolean; recall: boolean };
    }
  | {
      name: "SESSION_RECALL_FINISHED";
      category: "ENGAGEMENT";
      /** How the recall round ended: `clean` of `total` sentences typed from memory with no help, or `skipped` when the learner left it. The share of rounds finished, and how well first recalls go, are what the stop rules of the lesson-ending test are judged on. */
      properties: { clean: number; total: number } | { skipped: true };
    }
  | {
      name: "SESSION_END_ACTION";
      category: "ENGAGEMENT";
      /** What the learner pressed on the finish screen (see SESSION_END_ACTIONS). */
      properties: { action: SessionEndAction };
    }
  | {
      name: "TODAY_SESSION_COMPLETED";
      category: "ENGAGEMENT";
      /** A learner reached the finish screen of Today's session (the first time that day; a repeat is not counted again). `reviewTotal`/`reviewClean`: words of the words step asked and typed right the first time (0/0 when that step was skipped). */
      properties: { reviewTotal: number; reviewClean: number };
    }
  | {
      name: "SENTENCE_REVIEW_STARTED";
      category: "ENGAGEMENT";
      /** A learner opened the sentence review (a visit, so a reload counts again): `count` sentences were asked, `partial`/`audio`/`translate` how many of them in each form. The share of visits that reach SENTENCE_REVIEW_FINISHED is what the stop rule "40% finish the block" is judged on. */
      properties: { count: number; partial: number; audio: number; translate: number };
    }
  | {
      name: "SENTENCE_REVIEW_FINISHED";
      category: "ENGAGEMENT";
      /** A learner finished a review visit: of `count` sentences, `clean` right with no help, `assisted` right with one help, `missed` wrong (on their first go), and how many were asked in each form. First-go accuracy (clean + assisted over count) is the other number the stop rules read. */
      properties: {
        count: number;
        clean: number;
        assisted: number;
        missed: number;
        partial: number;
        audio: number;
        translate: number;
      };
    }
  | {
      name: "SENTENCE_CHECK_STARTED";
      category: "ENGAGEMENT";
      /** A learner opened the weekly sentence check: `asked` sentences, each from its meaning with nothing in front of them. */
      properties: { asked: number };
    }
  | {
      name: "SENTENCE_CHECK_FINISHED";
      category: "ENGAGEMENT";
      /** A learner finished the weekly check: of `asked` sentences, `remembered` were typed right with no help, out of `written` sentences they typed that week. The honest line on Today ("remembered M of N") is exactly these numbers; no level is ever derived from them. */
      properties: { asked: number; remembered: number; written: number };
    }
  | {
      name: "REDEEM_CODE_SUBMITTED";
      category: "PREMIUM";
      /** A learner typed a Premium code that looked like a code (a typo is turned away in the browser and not counted): what came of it. The share that succeed, per country, is what says whether the agent channel works. */
      properties: {
        outcome:
          | "redeemed"
          | "already_yours"
          | "unlimited"
          | "unknown"
          | "used"
          | "voided"
          | "expired"
          | "throttled"
          | "unavailable";
      };
    }
  | {
      name: "REDEEM_CODE_SUCCEEDED";
      category: "PREMIUM";
      /** A code was redeemed: how many days it added and whether they were stacked on Premium the learner still had. Never the code. */
      properties: { days: number; extendedExisting: boolean };
    }
  | {
      name: "IN_APP_STRIP_SHOWN";
      category: "AUTH";
      /** A visitor in Facebook's or Instagram's built-in browser opened the sign-up or sign-in page while the "Open in browser strip" test was on: `shown` says whether they were given the strip or kept the Google button, so both groups have the same denominator. `bucket` is the visitor's number from 0 to 99 (the group is that number below the share), `forced` a page opened on purpose with ?in_app_strip=. At most one row per browser session and page. */
      properties: {
        app: InAppBrowser;
        platform: StripPlatform;
        page: StripPage;
        shown: boolean;
        forced: boolean;
        bucket?: number;
      };
    }
  | {
      name: "IN_APP_STRIP_OPEN_CLICKED";
      category: "AUTH";
      /** The visitor tapped the strip's "open in browser" button (Android). */
      properties: { app: InAppBrowser; platform: StripPlatform; page: StripPage; bucket?: number };
    }
  | {
      name: "IN_APP_STRIP_COPY_CLICKED";
      category: "AUTH";
      /** The visitor tapped the strip's "copy link" button and the link was copied. */
      properties: { app: InAppBrowser; platform: StripPlatform; page: StripPage; bucket?: number };
    }
  | {
      name: "WORDS_ROUND_STARTED";
      category: "ENGAGEMENT";
      /** The first word of a round of words was shown: a Word Lists practice (`list`), Today's five words (`today`) or the Review All Words queue (`review`). `count`: how many words the round asks (a practice that picks up where the learner left off asks only the words still open). A visit is counted again on a reload, and so is "Practice again". Counts only: no word, no word or lesson id, and guests are recorded too (no account). */
      properties: { source: WordsRoundSource; count: number };
    }
  | {
      name: "WORDS_ROUND_FINISHED";
      category: "ENGAGEMENT";
      /** A round of words ran to its end (every word landed): of `count` words, `clean` were typed right on the first go with no help, `assisted` right after one hint, `missed` wrong (or given up on) on the first go; count = clean + assisted + missed. A learner who leaves halfway writes only the start, so finished over started is the share who stay to the end, and (clean + assisted) over count is the first-go accuracy. */
      properties: {
        source: WordsRoundSource;
        count: number;
        clean: number;
        assisted: number;
        missed: number;
      };
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
