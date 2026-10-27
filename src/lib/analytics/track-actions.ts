"use server";

import { after } from "next/server";

import { completedEvent, startedEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { getLessonById } from "@/lib/content";
import { isFirstRunVariant, isOnboardingStep } from "@/lib/first-run/variant";
import { isInAppBrowserName, isStripPage, isStripPlatform } from "@/lib/in-app-strip/strip";
import { STARTING_LEVEL_TIERS } from "@/lib/progress/starting-level";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isCountryCode } from "@/lib/i18n/country-codes";
import { parseWordsRoundReport } from "@/lib/words-round/round";
import type { WordsRoundReport } from "@/lib/words-round/round";
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

/**
 * Called from the open in browser strip (see InAppStripSlot): the sign-up or sign-in page was seen
 * by a visitor in Facebook's or Instagram's browser (`shown`), or the strip's open or copy button
 * was tapped. Fire-and-forget like the onboarding ones, and every value arrives as client input, so
 * each is re-validated against the known ones and the call silently no-ops otherwise.
 */
export async function trackInAppStripAction(details: {
  kind: string;
  app: string;
  platform: string;
  page: string;
  shown?: boolean;
  forced?: boolean;
  bucket?: number | null;
}): Promise<void> {
  const { kind, app, platform, page } = details;
  if (!isInAppBrowserName(app) || !isStripPlatform(platform) || !isStripPage(page)) return;
  const bucket =
    typeof details.bucket === "number" &&
    Number.isInteger(details.bucket) &&
    details.bucket >= 0 &&
    details.bucket <= 99
      ? details.bucket
      : undefined;
  const base = { app, platform, page, ...(bucket !== undefined ? { bucket } : {}) };
  const user = await getCurrentUser();
  const userId = user?.id ?? null;

  if (kind === "shown") {
    await track(
      {
        name: "IN_APP_STRIP_SHOWN",
        category: "AUTH",
        properties: { ...base, shown: details.shown === true, forced: details.forced === true },
      },
      userId,
    );
  } else if (kind === "open") {
    await track({ name: "IN_APP_STRIP_OPEN_CLICKED", category: "AUTH", properties: base }, userId);
  } else if (kind === "copy") {
    await track({ name: "IN_APP_STRIP_COPY_CLICKED", category: "AUTH", properties: base }, userId);
  }
}

/**
 * Called from the screens that ask a round of words (see useWordsRoundTracking): once when the first
 * word of a round is shown and once when the round runs to its end. Fire-and-forget like the
 * onboarding ones and, like trackSentenceReviewAction, the write is left until the response is sent
 * so a screen that moves straight on after the last word is never held up by it. The whole report
 * arrives as client input, so it is re-validated (a known source, whole numbers in range, a finish
 * whose outcomes add up) and the call silently no-ops otherwise. Counts only: no word, no ids. A
 * guest's round is recorded too, with no account.
 */
export async function trackWordsRoundAction(report: WordsRoundReport): Promise<void> {
  try {
    const parsed = parseWordsRoundReport(report);
    if (!parsed) return;
    const user = await getCurrentUser();
    const userId = user?.id ?? null;
    if (parsed.event === "started") {
      const { source, count } = parsed;
      after(() =>
        track(
          { name: "WORDS_ROUND_STARTED", category: "ENGAGEMENT", properties: { source, count } },
          userId,
        ),
      );
    } else {
      const { source, count, clean, assisted, missed } = parsed;
      after(() =>
        track(
          {
            name: "WORDS_ROUND_FINISHED",
            category: "ENGAGEMENT",
            properties: { source, count, clean, assisted, missed },
          },
          userId,
        ),
      );
    }
  } catch (error) {
    console.error("[analytics] trackWordsRoundAction failed", error);
  }
}
