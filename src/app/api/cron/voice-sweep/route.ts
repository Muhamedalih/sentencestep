import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { findLessonIdsNeedingVoiceGeneration } from "@/lib/voice/candidates";
import { generateStoryVoiceDraft } from "@/lib/voice/story-voice-generation";

/**
 * The recovery mechanism for ElevenLabs voice generation that `after()` may
 * have missed — mirrors src/app/api/cron/translation-sweep/route.ts
 * directly (same CRON_SECRET gate, same isValidCronAuth, same "fails
 * closed without it" behavior, same GET+POST dual export).
 *
 * Bounded on purpose: MAX_LESSON_VOICE_PAIRS_PER_RUN caps how many lessons
 * a single invocation attempts — a "do a little, safely, often" sweep, not
 * a full-library backfill. Candidate selection is shared with the admin
 * bulk-generate action via findLessonIdsNeedingVoiceGeneration.
 */
const MAX_LESSON_VOICE_PAIRS_PER_RUN = 20;
const MAX_ERRORS_REPORTED = 20;

async function handleVoiceSweepCron(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  let lessonIds: string[];
  try {
    lessonIds = await findLessonIdsNeedingVoiceGeneration(supabase, MAX_LESSON_VOICE_PAIRS_PER_RUN);
  } catch {
    return NextResponse.json({ error: "Failed to read candidate lessons." }, { status: 500 });
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const lessonId of lessonIds) {
    const outcome = await generateStoryVoiceDraft(supabase, lessonId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.error && errors.length < MAX_ERRORS_REPORTED) {
      errors.push(`${lessonId}: ${outcome.error}`);
    }
  }

  return NextResponse.json({ processed: lessonIds.length, generated, skipped, failed, errors });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleVoiceSweepCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleVoiceSweepCron(request);
}
