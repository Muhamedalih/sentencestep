"use server";

import { startedEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/supabase/auth";
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
