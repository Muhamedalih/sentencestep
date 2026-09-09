"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { generateBookVoiceDraft } from "@/lib/voice/book-voice-generation";
import {
  findBookIdsNeedingVoiceGeneration,
  findLessonIdsNeedingVoiceGeneration,
} from "@/lib/voice/candidates";
import { isDailyVoiceGenerationCapReached } from "@/lib/voice/daily-cap";
import { generateStoryVoiceDraft } from "@/lib/voice/story-voice-generation";

/**
 * Matches MAX_LESSON_VOICE_PAIRS_PER_RUN/MAX_BOOK_VOICE_PAIRS_PER_RUN in
 * src/app/api/cron/voice-sweep/route.ts exactly — that file's own doc
 * comment documents the measured incident this mirrors: a 20+10-candidate
 * batch reliably exceeded Netlify's function timeout in production,
 * because each candidate isn't one query, it's a real Voice Director call
 * plus one real TTS provider call per sentence, all sequential within a
 * single invocation (a 12-sentence lesson alone is 13 real network calls).
 * The cron sweep was shrunk after that measurement; this bulk button was
 * missed and kept crashing on real admin use (confirmed 2026-09-09: "works
 * fine, then suddenly fails" on every attempt) until reduced to the same
 * proven-safe size. A big backlog now needs a few clicks instead of one,
 * same trade-off the cron sweep already made.
 */
const MAX_BULK_LESSONS_PER_RUN = 5;
const MAX_BULK_BOOKS_PER_RUN = 3;

function summarize(outcome: {
  generated: number;
  skipped: number;
  failed: number;
  error?: string;
}): ActionResult {
  const parts = [
    `${outcome.generated} generated`,
    `${outcome.skipped} skipped`,
    `${outcome.failed} failed`,
  ];
  if (outcome.error) return { error: `${parts.join(", ")}. ${outcome.error}` };
  return { success: parts.join(", ") + "." };
}

/**
 * Manual single-lesson trigger — the "Regenerate Story Audio" button.
 *
 * Briefly used `after()` here to dodge a real, Sentry-confirmed 504 (a
 * multi-sentence lesson's sequential Director+TTS calls outlasting the
 * platform's own request timeout) — reverted after confirming Netlify's
 * Next.js Runtime doesn't actually support `after()` reliably (no
 * `waitUntil` wiring: https://github.com/opennextjs/opennextjs-netlify/issues/2695).
 * It looked like it worked once or twice, then silently stopped running at
 * all — a background job with no guarantee it ever executes is worse than
 * a slow synchronous one that at least always either finishes or fails
 * visibly. Back to synchronous: each sentence still commits to
 * voice_audio_cache as it completes (not all-or-nothing), so an occasional
 * timeout on a long lesson doesn't lose progress — the short-circuit in
 * generateStoryVoiceDraft picks up wherever it left off on the next click.
 */
export async function generateLessonVoice(lessonId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();
  const outcome = await generateStoryVoiceDraft(supabase, lessonId);
  revalidatePath(`/admin/voice/content/${lessonId}`);
  // Deliberately NOT revalidating /admin/voice/content itself — see
  // generateBookVoice's own doc comment on why a single-row action here
  // must never force the whole ~150-query dashboard to reload.
  return summarize(outcome);
}

/** One sentence's "Regenerate" button — forces past an already-'ready' or retry-exhausted row. */
export async function regenerateSentenceVoice(
  lessonId: string,
  sentenceId: string,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();
  const outcome = await generateStoryVoiceDraft(supabase, lessonId, new Set([sentenceId]));
  revalidatePath(`/admin/voice/content/${lessonId}`);
  return summarize(outcome);
}

/**
 * Manual whole-book trigger — used by both the Book Preview page's
 * "Generate book audio" button and the "Story audio status" dashboard's
 * per-row generate button. Synchronous — see generateLessonVoice's own doc
 * comment on why `after()` was tried and reverted here.
 */
export async function generateBookVoice(bookId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();
  const outcome = await generateBookVoiceDraft(supabase, bookId);
  revalidatePath(`/admin/library/${bookId}/edit`);
  // Deliberately NOT revalidating /admin/voice/content itself — that page's
  // listVoiceGenerationDashboardRows() fires roughly a hundred Supabase
  // reads for a library this size, and this action already gives the
  // admin an inline result via `summarize(outcome)` without needing a
  // dashboard-wide refetch.
  return summarize(outcome);
}

/**
 * findLessonIdsNeedingVoiceGeneration/findBookIdsNeedingVoiceGeneration
 * order "oldest content-edit first" with no way to know in advance which
 * of those are already fully generated (voice_audio_cache is separate and
 * content-addressed, with no link back to lessons/books) — confirmed as a
 * real incident (2026-09-09): a handful of lessons whose content hadn't
 * been edited in weeks already had complete audio, and permanently
 * occupied the front of every candidate list, so a fixed-size batch kept
 * re-selecting the exact same already-done items every run (an instant
 * no-op via generateStoryVoiceDraft's own short-circuit) and never
 * advanced into the real backlog — "the first click or two does
 * something, then the completion count never moves again."
 *
 * Fetching a wider pool and counting only real work (something actually
 * generated or failed) against the per-run cap skips already-done
 * candidates within the same run instead of wasting the whole budget on
 * them. Kept modest (not the admin bulk button's first attempt at 8x, back
 * when this ran under `after()`): this whole action is synchronous now
 * (see below), so every extra already-done candidate checked here adds
 * directly to this request's own wall-clock time instead of running
 * separately in the background.
 */
const CANDIDATE_POOL_MULTIPLIER = 3;

/**
 * Bulk "Generate Missing Audio" — bounded, shares candidate selection with
 * the cron sweep. Covers Stories, Conversations, Normal lessons, and Books
 * in one click (see findLessonIdsNeedingVoiceGeneration/
 * findBookIdsNeedingVoiceGeneration's own doc comments for exactly what's
 * excluded: only whatever an admin has individually flagged
 * voice_generation_excluded from the dashboard).
 *
 * Briefly deferred the generation loop via `after()` to dodge a real,
 * Sentry-confirmed 504 — reverted after confirming Netlify's Next.js
 * Runtime doesn't actually support `after()` reliably (no `waitUntil`
 * wiring: https://github.com/opennextjs/opennextjs-netlify/issues/2695).
 * It worked once or twice, then silently stopped running at all — no
 * guarantee it ever executes, confirmed live when repeated clicks stopped
 * producing any database activity whatsoever. Back to synchronous, same
 * as before that fix: MAX_BULK_LESSONS_PER_RUN/MAX_BULK_BOOKS_PER_RUN
 * already match the cron sweep's own proven-safe-in-production size, and
 * each sentence still commits to voice_audio_cache as it completes (not
 * all-or-nothing), so an occasional timeout on an unusually long lesson
 * doesn't lose progress.
 */
export async function generateMissingVoiceForContent(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();

  const capStatus = await isDailyVoiceGenerationCapReached(supabase);
  if (capStatus.capped) {
    return {
      error: `Daily voice generation cap reached (${capStatus.generatedToday}/${capStatus.dailyCap}). Try again after midnight UTC, or raise MAX_VOICE_GENERATIONS_PER_DAY.`,
    };
  }

  const [lessonPool, bookPool] = await Promise.all([
    findLessonIdsNeedingVoiceGeneration(
      supabase,
      MAX_BULK_LESSONS_PER_RUN * CANDIDATE_POOL_MULTIPLIER,
    ),
    findBookIdsNeedingVoiceGeneration(supabase, MAX_BULK_BOOKS_PER_RUN * CANDIDATE_POOL_MULTIPLIER),
  ]);

  if (lessonPool.length === 0 && bookPool.length === 0) {
    return { success: "Nothing left to generate — every eligible item is already up to date." };
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let lessonWorkDone = 0;
  for (const lessonId of lessonPool) {
    if (lessonWorkDone >= MAX_BULK_LESSONS_PER_RUN) break;
    const outcome = await generateStoryVoiceDraft(supabase, lessonId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.generated > 0 || outcome.failed > 0) lessonWorkDone += 1;
  }
  let bookWorkDone = 0;
  for (const bookId of bookPool) {
    if (bookWorkDone >= MAX_BULK_BOOKS_PER_RUN) break;
    const outcome = await generateBookVoiceDraft(supabase, bookId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.generated > 0 || outcome.failed > 0) bookWorkDone += 1;
  }

  revalidatePath("/admin/voice/content");
  return {
    success: `Processed ${lessonWorkDone} lesson(s) and ${bookWorkDone} book(s): ${generated} generated, ${skipped} skipped, ${failed} failed.`,
  };
}

/**
 * The "Story audio status" dashboard's per-row exclude toggle — opts a
 * specific story/book out of both the bulk button above and the cron sweep
 * (src/app/api/cron/voice-sweep) without unpublishing it. See
 * 20250217000000_voice_generation_exclusion.sql.
 */
export async function setVoiceGenerationExcluded(
  contentType: "story" | "conversation" | "normal" | "book",
  id: string,
  excluded: boolean,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const table = contentType === "book" ? "books" : "lessons";
  const { error } = await supabase
    .from(table)
    .update({ voice_generation_excluded: excluded })
    .eq("id", id);
  if (error) return { error: "Couldn't update. Please try again." };

  // Not revalidating /admin/voice/content — see generateBookVoice's doc
  // comment on why a single-row action here must never force the whole
  // dashboard to reload; the checkbox itself already reflects the change
  // since nothing forces this row to re-render with stale server data.
  return { success: excluded ? "Excluded from generation." : "Included in generation." };
}

/**
 * The "Story audio status" dashboard's per-row voice picker — sets (or
 * clears, when voiceId is null) a Story's or Book's own narration voice
 * override, exactly the lessons.voice_id / books.voice_id column
 * resolveTargetVoices/loadBookForVoiceWork already check ahead of the
 * global default (a Story could previously only get this from its own
 * lesson editor; a Book had no override at all — see
 * 20250218000000_book_voice_override.sql). Deliberately just persists the
 * choice rather than generating anything itself: the row's own "Generate"
 * button (already on screen) picks it up on its very next click since the
 * cache key changes with the voice, no extra plumbing needed. Never called
 * for "conversation" rows — Conversation has no single-voice concept (see
 * resolveTargetVoices' per-speaker branch), so the dashboard never renders
 * this picker for them.
 */
export async function setContentVoiceOverride(
  contentType: "story" | "conversation" | "normal" | "book",
  id: string,
  voiceId: string | null,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const table = contentType === "book" ? "books" : "lessons";
  const { error } = await supabase.from(table).update({ voice_id: voiceId }).eq("id", id);
  if (error) return { error: "Couldn't update. Please try again." };

  // Not revalidating /admin/voice/content — same reasoning as
  // setVoiceGenerationExcluded above.
  return { success: voiceId ? "Voice saved." : "Reset to the default voice." };
}
