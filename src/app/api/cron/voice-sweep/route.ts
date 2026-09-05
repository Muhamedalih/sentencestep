import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  findBookIdsNeedingVoiceGeneration,
  findLessonIdsNeedingVoiceGeneration,
  findWordGroupIdsNeedingVoiceGeneration,
} from "@/lib/voice/candidates";
import { generateBookVoiceDraft } from "@/lib/voice/book-voice-generation";
import { generateStoryVoiceDraft } from "@/lib/voice/story-voice-generation";
import { generateWordGroupVoiceDraft } from "@/lib/voice/word-list-voice-generation";

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
 *
 * Kept deliberately small (not the 20/10/20 this shipped with originally):
 * loadLessonForVoiceWork/its Book equivalent is several sequential Supabase
 * round trips per candidate (sentences, settings, voice resolution, cache
 * lookups), and measured in production on Netlify — a platform whose
 * function/edge timeout is materially shorter than what this was originally
 * tuned against — a full 20+10+20-candidate sweep reliably exceeded it
 * ("the edge function timed out", a 500/502 with zero items actually
 * processed). Smaller batches finish comfortably inside any reasonable
 * platform timeout; the GitHub Actions schedule (.github/workflows/cron.yml)
 * compensates by calling this endpoint every 15 minutes instead of once a
 * day, so real backlog still gets fully worked through — just in more, smaller
 * steps rather than one big one that never completes.
 */
const MAX_LESSON_VOICE_PAIRS_PER_RUN = 5;
const MAX_BOOK_VOICE_PAIRS_PER_RUN = 3;
const MAX_WORD_GROUP_VOICE_PAIRS_PER_RUN = 5;
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
  let bookIds: string[];
  let wordGroupIds: string[];
  try {
    lessonIds = await findLessonIdsNeedingVoiceGeneration(supabase, MAX_LESSON_VOICE_PAIRS_PER_RUN);
    bookIds = await findBookIdsNeedingVoiceGeneration(supabase, MAX_BOOK_VOICE_PAIRS_PER_RUN);
    wordGroupIds = await findWordGroupIdsNeedingVoiceGeneration(
      supabase,
      MAX_WORD_GROUP_VOICE_PAIRS_PER_RUN,
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to read candidate lessons/books/word groups." },
      { status: 500 },
    );
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

  for (const bookId of bookIds) {
    const outcome = await generateBookVoiceDraft(supabase, bookId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.error && errors.length < MAX_ERRORS_REPORTED) {
      errors.push(`book ${bookId}: ${outcome.error}`);
    }
  }

  for (const groupId of wordGroupIds) {
    const outcome = await generateWordGroupVoiceDraft(supabase, groupId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.error && errors.length < MAX_ERRORS_REPORTED) {
      errors.push(`word group ${groupId}: ${outcome.error}`);
    }
  }

  return NextResponse.json({
    processed: lessonIds.length + bookIds.length + wordGroupIds.length,
    generated,
    skipped,
    failed,
    errors,
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleVoiceSweepCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleVoiceSweepCron(request);
}
