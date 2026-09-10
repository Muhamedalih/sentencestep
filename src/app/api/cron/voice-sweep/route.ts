import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  findBookIdsNeedingVoiceGeneration,
  findLessonIdsNeedingVoiceGeneration,
  findNormalLessonIdsNeedingVoiceGeneration,
  findWordGroupIdsNeedingVoiceGeneration,
} from "@/lib/voice/candidates";
import { generateBookVoiceDraft } from "@/lib/voice/book-voice-generation";
import { isDailyVoiceGenerationCapReached } from "@/lib/voice/daily-cap";
import { generateStoryVoiceDraft } from "@/lib/voice/story-voice-generation";
import { generateWordGroupVoiceDraft } from "@/lib/voice/word-list-voice-generation";

/**
 * The recovery mechanism for narration voice generation (ElevenLabs for
 * Stories/Conversation/Books, Cartesia for Normal lessons and Word Lists —
 * see content-provider-map.ts) that `after()` may have missed — mirrors
 * src/app/api/cron/translation-sweep/route.ts directly (same CRON_SECRET
 * gate, same isValidCronAuth, same "fails closed without it" behavior, same
 * GET+POST dual export).
 *
 * Bounded on purpose: MAX_LESSON_VOICE_PAIRS_PER_RUN (Stories/Conversation/
 * Normal combined) and MAX_NORMAL_LESSON_VOICE_PAIRS_PER_RUN (Normal
 * lessons' own dedicated slice — see its doc comment) cap how many lessons
 * a single invocation attempts — a "do a little, safely, often" sweep, not
 * a full-library backfill. The combined pool's candidate selection is
 * shared with the admin bulk-generate action via
 * findLessonIdsNeedingVoiceGeneration; the Normal-only pool
 * (findNormalLessonIdsNeedingVoiceGeneration) is specific to this cron
 * route.
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
 *
 * MAX_VOICE_GENERATIONS_PER_DAY is a hard safety brake added after a
 * September 2026 incident: a narration provider switch invalidated the
 * entire voice cache (every published item looked "eligible" at once), and
 * this sweep — running every 15 minutes with no spend guard — regenerated
 * the whole library non-stop for three days and exhausted the Netlify
 * account's credits. isDailyVoiceGenerationCapReached (src/lib/voice/daily-cap.ts)
 * counts actual successful generations already done today (voice_audio_cache
 * rows that turned 'ready' since midnight UTC) and is shared with the admin
 * bulk-generate action, so the cap is a real ceiling on total daily spend
 * regardless of which entry point is generating. 300/day is a conservative
 * starting point, not a measured "safe" number for this account's actual
 * plan/spend limits — tune it via the MAX_VOICE_GENERATIONS_PER_DAY env var
 * once real per-generation cost is known.
 */
const MAX_LESSON_VOICE_PAIRS_PER_RUN = 3;
/**
 * A dedicated Normal-lessons slice, separate from MAX_LESSON_VOICE_PAIRS_PER_RUN
 * — see findNormalLessonIdsNeedingVoiceGeneration's own doc comment for why:
 * the combined Stories+Conversation+Normal pool's oldest-updated-first
 * window can be (and, confirmed 2026-09-10, was) entirely occupied by
 * already-'ready' Stories, structurally starving Normal lessons of any real
 * work forever. Lowered MAX_LESSON_VOICE_PAIRS_PER_RUN from 5 to 3 so this
 * addition keeps the same total worst-case real-generation-calls-per-run
 * (5) this route was originally tuned against (see this file's own doc
 * comment on the Netlify platform timeout that caused), rather than
 * silently raising it to 7.
 */
const MAX_NORMAL_LESSON_VOICE_PAIRS_PER_RUN = 2;
const MAX_BOOK_VOICE_PAIRS_PER_RUN = 3;
const MAX_WORD_GROUP_VOICE_PAIRS_PER_RUN = 5;
const MAX_ERRORS_REPORTED = 20;

/**
 * findLessonIdsNeedingVoiceGeneration/findBookIdsNeedingVoiceGeneration/
 * findWordGroupIdsNeedingVoiceGeneration order "oldest updated_at first",
 * with no way to know in advance which of those are already fully
 * generated (voice_audio_cache is separate and content-addressed, with no
 * link back to lessons/books/word_groups) — confirmed as a real incident
 * (2026-09-09): a handful of lessons whose content hadn't been edited in
 * weeks already had complete audio, and permanently occupied the front of
 * every candidate list, so a MAX_..._PER_RUN-sized batch kept re-selecting
 * the exact same already-done items every single run and never advanced
 * into the genuinely incomplete backlog. Fetching a wider pool and only
 * counting real work (something actually generated or failed, not an
 * instant already-ready short-circuit) against the per-run cap lets this
 * skip past already-done candidates within the same run instead of
 * wasting the whole budget on them. Smaller multiplier than the admin
 * bulk action's own version of this fix (voice-generation-actions.ts) —
 * this route has no `after()` escape hatch from the platform's own
 * request timeout, so extra already-done checks here add directly to this
 * invocation's wall-clock time instead of running in the background.
 */
const CANDIDATE_POOL_MULTIPLIER = 3;

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

  let capStatus: Awaited<ReturnType<typeof isDailyVoiceGenerationCapReached>>;
  try {
    capStatus = await isDailyVoiceGenerationCapReached(supabase);
  } catch {
    return NextResponse.json(
      { error: "Couldn't check today's generation usage." },
      { status: 500 },
    );
  }
  if (capStatus.capped) {
    return NextResponse.json({
      skipped: true,
      reason: `Daily voice generation cap reached (${capStatus.generatedToday}/${capStatus.dailyCap}). No new audio generated this run.`,
    });
  }

  let lessonPool: string[];
  let normalLessonPool: string[];
  let bookPool: string[];
  let wordGroupPool: string[];
  try {
    lessonPool = await findLessonIdsNeedingVoiceGeneration(
      supabase,
      MAX_LESSON_VOICE_PAIRS_PER_RUN * CANDIDATE_POOL_MULTIPLIER,
    );
    normalLessonPool = await findNormalLessonIdsNeedingVoiceGeneration(
      supabase,
      MAX_NORMAL_LESSON_VOICE_PAIRS_PER_RUN * CANDIDATE_POOL_MULTIPLIER,
    );
    bookPool = await findBookIdsNeedingVoiceGeneration(
      supabase,
      MAX_BOOK_VOICE_PAIRS_PER_RUN * CANDIDATE_POOL_MULTIPLIER,
    );
    wordGroupPool = await findWordGroupIdsNeedingVoiceGeneration(
      supabase,
      MAX_WORD_GROUP_VOICE_PAIRS_PER_RUN * CANDIDATE_POOL_MULTIPLIER,
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
  let processed = 0;

  let lessonWorkDone = 0;
  // Tracked so the dedicated Normal-lessons loop below can skip an id this
  // loop already attempted this same run (the two pools can overlap at
  // their oldest end) — generateStoryVoiceDraft's own cheap short-circuit
  // would make a repeat call harmless anyway, but there's no reason to
  // spend the extra round trip.
  const attemptedThisRun = new Set<string>();
  for (const lessonId of lessonPool) {
    if (lessonWorkDone >= MAX_LESSON_VOICE_PAIRS_PER_RUN) break;
    processed += 1;
    attemptedThisRun.add(lessonId);
    const outcome = await generateStoryVoiceDraft(supabase, lessonId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.error && errors.length < MAX_ERRORS_REPORTED) {
      errors.push(`${lessonId}: ${outcome.error}`);
    }
    if (outcome.generated > 0 || outcome.failed > 0) lessonWorkDone += 1;
  }

  let normalLessonWorkDone = 0;
  for (const lessonId of normalLessonPool) {
    if (normalLessonWorkDone >= MAX_NORMAL_LESSON_VOICE_PAIRS_PER_RUN) break;
    if (attemptedThisRun.has(lessonId)) continue;
    processed += 1;
    const outcome = await generateStoryVoiceDraft(supabase, lessonId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.error && errors.length < MAX_ERRORS_REPORTED) {
      errors.push(`${lessonId}: ${outcome.error}`);
    }
    if (outcome.generated > 0 || outcome.failed > 0) normalLessonWorkDone += 1;
  }

  let bookWorkDone = 0;
  for (const bookId of bookPool) {
    if (bookWorkDone >= MAX_BOOK_VOICE_PAIRS_PER_RUN) break;
    processed += 1;
    const outcome = await generateBookVoiceDraft(supabase, bookId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.error && errors.length < MAX_ERRORS_REPORTED) {
      errors.push(`book ${bookId}: ${outcome.error}`);
    }
    if (outcome.generated > 0 || outcome.failed > 0) bookWorkDone += 1;
  }

  let wordGroupWorkDone = 0;
  for (const groupId of wordGroupPool) {
    if (wordGroupWorkDone >= MAX_WORD_GROUP_VOICE_PAIRS_PER_RUN) break;
    processed += 1;
    const outcome = await generateWordGroupVoiceDraft(supabase, groupId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.error && errors.length < MAX_ERRORS_REPORTED) {
      errors.push(`word group ${groupId}: ${outcome.error}`);
    }
    if (outcome.generated > 0 || outcome.failed > 0) wordGroupWorkDone += 1;
  }

  return NextResponse.json({
    processed,
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
