import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isDailyVoiceGenerationCapReached } from "@/lib/voice/daily-cap";
import {
  findWordsMissingWordListVoice,
  generateWordListVoiceAudio,
} from "@/lib/voice/word-list-word-audio";

/**
 * Builds the inventory of Word Lists-voice clips for the words learners
 * actually study — typing mistakes, Vocabulary Recall, saved cards — so Today's
 * session (and any other screen reading them) finds a ready clip instead of
 * waiting for speech synthesis on a slow backend. See word-list-word-audio.ts
 * for why this is a background job and not a page-load step.
 *
 * Deliberately its own small route rather than another branch of
 * voice-sweep: that route already runs close to Netlify's function timeout
 * (its own notes), and adding work to it would only push it over. Same
 * CRON_SECRET gate and GET+POST shape as every other cron route.
 *
 * Bounded on purpose, for the same reason: a handful of words per run, inside
 * a time budget well under the platform timeout, and a run with nothing
 * missing costs a few indexed reads. Edge-TTS is free, but each clip is still
 * a voice_audio_cache row counted by the shared daily cap (daily-cap.ts), so
 * this only ever uses the lower half of that cap (MAX_SHARE_OF_DAILY_CAP) and
 * can't crowd out paid narration generation while it builds the first backlog.
 */
const MAX_WORDS_PER_RUN = 5;
/** Share of the shared daily cap this job may use; the rest stays free for paid narration generation (Stories/Books), which it must never starve. */
const MAX_SHARE_OF_DAILY_CAP = 0.5;
const RUN_BUDGET_MS = 15_000;
const MAX_ERRORS_REPORTED = 10;

async function handleSessionWordAudioCron(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }
  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const cap = await isDailyVoiceGenerationCapReached(createServiceRoleClient());
    if (cap.capped || cap.generatedToday >= cap.dailyCap * MAX_SHARE_OF_DAILY_CAP) {
      return NextResponse.json({
        skipped: true,
        reason: `Leaving today's remaining voice generation budget to narration (${cap.generatedToday}/${cap.dailyCap} used).`,
      });
    }

    const words = await findWordsMissingWordListVoice(MAX_WORDS_PER_RUN);
    if (words.length === 0) return NextResponse.json({ found: 0, generated: 0, failed: 0 });

    const { urls, errors } = await generateWordListVoiceAudio(words, {
      deadlineMs: RUN_BUDGET_MS,
      concurrency: 3,
    });
    return NextResponse.json({
      found: words.length,
      generated: urls.size,
      failed: words.length - urls.size,
      errors: errors.slice(0, MAX_ERRORS_REPORTED),
    });
  } catch (error) {
    console.error("[cron/session-word-audio] failed", error);
    return NextResponse.json({ error: "Session word audio sweep failed." }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleSessionWordAudioCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleSessionWordAudioCron(request);
}
