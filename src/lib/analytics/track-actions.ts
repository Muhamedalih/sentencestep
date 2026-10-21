"use server";

import { completedEvent, startedEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { getLessonById } from "@/lib/content";
import { isFirstRunVariant, isOnboardingStep } from "@/lib/first-run/variant";
import { STARTING_LEVEL_TIERS } from "@/lib/progress/starting-level";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isCountryCode } from "@/lib/i18n/country-codes";
import type { LearningMode } from "@/types/content";

/**
 * Called once per real lesson-page visit from a client-side mount effect
 * (see LessonSession) rather than from the page's Server Component body.
 * That distinction matters: free lessons are statically pre-rendered
 * (generateStaticParams), so a track() call inside the page component only
 * runs once, at build time — never per actual visitor. A small, strongly
 * typed action like this one (not a generic "track any event" endpoint)
 * keeps the client → server boundary narrow: the client can only ever
 * trigger this one specific event, identity is still resolved from the
 * session, never trusted from the caller.
 */
export async function trackLessonViewAction(
  mode: LearningMode,
  lessonId: string,
  level: number,
  isFree: boolean,
): Promise<void> {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;

  await track(startedEvent(mode, lessonId, level), userId);

  if (!isFree) {
    await track(
      { name: "PREMIUM_CONTENT_VIEWED", category: "PREMIUM", properties: { lessonId, mode } },
      userId,
    );
  }
}

/**
 * Called at most once per real lesson session, the first time the learner
 * presses the pronunciation button (see LessonSession's hasTrackedAudioRef)
 * — an aggregate "pronunciation was used" signal, not a per-click or
 * per-replay log. track() never throws, so a failure here can't affect
 * playback, which has already happened by the time this fires.
 */
export async function trackAudioPlayedAction(mode: LearningMode): Promise<void> {
  const user = await getCurrentUser();
  await track(
    { name: "AUDIO_PLAYED", category: "ENGAGEMENT", properties: { mode } },
    user?.id ?? null,
  );
}

/**
 * A guest's counterpart to recordCompletionAction's own LESSON_COMPLETED
 * track() call (src/lib/progress/actions.ts) — that one only ever fires for
 * a signed-in learner, since a guest's completion is recorded entirely
 * client-side (see useProgress's markComplete). Without this, the internal
 * analytics could see a guest *start* a lesson but never see them *finish*
 * one, making it impossible to measure whether a guest completing their
 * first lesson correlates with them signing up. No-ops if the caller turns
 * out to already be signed in (recordCompletionAction owns that case) rather
 * than trusting the client's own guess.
 */
export async function trackGuestLessonCompletionAction(
  mode: LearningMode,
  lessonId: string,
  accuracy: number,
): Promise<void> {
  const user = await getCurrentUser();
  if (user) return;

  const lesson = await getLessonById(mode, lessonId);
  const safeAccuracy = Math.min(1, Math.max(0, accuracy));
  await track(completedEvent(mode, lessonId, lesson?.level ?? 0, safeAccuracy), null);
}

/**
 * Called from the first-run screens (see useOnboardingStepTracking) the first
 * time a visitor is shown one — fire-and-forget, never awaited before they
 * move on. Both values arrive as client input, so each is re-validated against
 * the known ones here and the call silently no-ops otherwise.
 */
export async function trackOnboardingStepAction(step: string, variant: string): Promise<void> {
  if (!isOnboardingStep(step) || !isFirstRunVariant(variant)) return;
  const user = await getCurrentUser();
  await track(
    { name: "ONBOARDING_STEP_VIEWED", category: "ENGAGEMENT", properties: { step, variant } },
    user?.id ?? null,
  );
}

/** Called once when a visitor taps a tier on the first-run level step (see StartingLevelOnboarding); same fire-and-forget and re-validation as trackOnboardingStepAction. */
export async function trackOnboardingLevelAction(level: number, variant: string): Promise<void> {
  if (!STARTING_LEVEL_TIERS.some((tier) => tier.level === level) || !isFirstRunVariant(variant)) {
    return;
  }
  const user = await getCurrentUser();
  await track(
    { name: "ONBOARDING_LEVEL_SELECTED", category: "ENGAGEMENT", properties: { level, variant } },
    user?.id ?? null,
  );
}

/**
 * Called once from CountryOnboarding's fire-and-forget click handler when a
 * guest picks a country — never awaited before advancing to the next
 * onboarding step, so a slow or failed write (track() never throws anyway)
 * can't delay or block onboarding. `countryCode` is re-validated against the
 * known COUNTRY_CODES list here (silently no-ops otherwise) since it arrives
 * as client input, even though it can currently only ever be one this
 * component's own list produced.
 */
export async function trackOnboardingCountryAction(countryCode: string): Promise<void> {
  if (!isCountryCode(countryCode)) return;
  const user = await getCurrentUser();
  await track(
    { name: "ONBOARDING_COUNTRY_SELECTED", category: "ENGAGEMENT", properties: { countryCode } },
    user?.id ?? null,
  );
}
