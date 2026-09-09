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
 * Kept far smaller than the cron sweep's own MAX_LESSON_VOICE_PAIRS_PER_RUN/
 * MAX_BOOK_VOICE_PAIRS_PER_RUN (src/app/api/cron/voice-sweep/route.ts, 5/3):
 * this button is a synchronous HTTP request with a real, unattended admin
 * waiting on it, and a genuine Netlify platform 504 (confirmed via Sentry,
 * not a code bug) happened at 5/3 once a run's candidates needed real work
 * rather than cheap already-cached skips — each real item is a Voice
 * Director call plus one TTS call per sentence, all sequential (a
 * 12-sentence lesson alone is 13 real network calls). Shrunk to 1 lesson
 * and 1 book, with VoiceBulkGenerateControl (the client component) calling
 * this repeatedly in a loop so one click still works through the whole
 * backlog — many small, fast, safe round trips instead of one large, slow,
 * fragile one.
 *
 * Even at 1+1 together, Sentry caught a second real 504 — this time the
 * exact request-start-to-504 timestamps put the platform's actual ceiling
 * for this route at roughly 25 seconds, not the ~60s the original
 * stale-connection-retry fix (src/lib/supabase/fetch-with-timeout.ts) had
 * assumed. generateMissingVoiceForContent below only ever runs generation
 * for the lesson pool OR the book pool in a given round, never both, to
 * roughly halve the worst case again.
 */
const MAX_BULK_LESSONS_PER_RUN = 1;
const MAX_BULK_BOOKS_PER_RUN = 1;

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
 * candidates within the same round instead of wasting its whole (now much
 * smaller — see MAX_BULK_LESSONS_PER_RUN) budget on them.
 */
const CANDIDATE_POOL_MULTIPLIER = 3;

/** One small, fast round of bulk generation — see generateMissingVoiceForContent. */
export interface BulkVoiceGenerationRound {
  error?: string;
  generated: number;
  skipped: number;
  failed: number;
  lessonsWorked: number;
  booksWorked: number;
  /** True once both candidate pools were completely empty at the start of this round — nothing left at all, the caller should stop looping. */
  exhausted: boolean;
}

/**
 * Bulk "Generate Missing Audio" — one small round, shares candidate
 * selection with the cron sweep. Covers Stories, Conversations, Normal
 * lessons, and Books. VoiceBulkGenerateControl (the client component) calls
 * this in a loop so one click still works through a whole backlog; see
 * MAX_BULK_LESSONS_PER_RUN's own doc comment for why each individual round
 * is kept this small (a real, Sentry-confirmed platform 504 at the old
 * larger size).
 *
 * Does NOT call revalidatePath("/admin/voice/content") — seemingly
 * harmless, but stacking a ~150-query dashboard revalidation onto this
 * action's own response was a second real, Sentry-confirmed production bug
 * on top of the batch-size one: "Connection closed" and "An unexpected
 * response was received from the server" (a Next.js RSC-stream parse
 * failure), both on this exact route, both while this action had already
 * computed a correct result server-side. Single-row actions in this file
 * already skip this for the same reason (see generateBookVoice's doc
 * comment). The per-row "N/M ready" counts on the dashboard simply go stale
 * until the admin reloads the page.
 */
export async function generateMissingVoiceForContent(): Promise<BulkVoiceGenerationRound> {
  const empty = { generated: 0, skipped: 0, failed: 0, lessonsWorked: 0, booksWorked: 0 };

  const forbidden = await requireAdmin();
  if (forbidden) return { ...empty, error: forbidden, exhausted: true };

  const supabase = createServiceRoleClient();

  const capStatus = await isDailyVoiceGenerationCapReached(supabase);
  if (capStatus.capped) {
    return {
      ...empty,
      error: `Daily voice generation cap reached (${capStatus.generatedToday}/${capStatus.dailyCap}). Try again after midnight UTC, or raise MAX_VOICE_GENERATIONS_PER_DAY.`,
      exhausted: true,
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
    return { ...empty, exhausted: true };
  }

  // Only one of the two pools below actually runs generation this round —
  // see MAX_BULK_LESSONS_PER_RUN's own doc comment on why even "1 lesson +
  // 1 book" together was still, empirically, too much for one request:
  // Sentry caught a real 504 at exactly ~25s wall-clock (the platform's
  // real ceiling for this route, not the ~60s originally assumed), on a
  // round doing both. Doing at most one of the two per round roughly halves
  // the worst-case sequential network-call count. Lessons go first simply
  // because there are usually far more of them; a round only reaches for a
  // book once the lesson pool is empty.
  const workingOnBooksOnly = lessonPool.length === 0;

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let lessonWorkDone = 0;
  if (!workingOnBooksOnly) {
    for (const lessonId of lessonPool) {
      if (lessonWorkDone >= MAX_BULK_LESSONS_PER_RUN) break;
      const outcome = await generateStoryVoiceDraft(supabase, lessonId);
      generated += outcome.generated;
      skipped += outcome.skipped;
      failed += outcome.failed;
      if (outcome.generated > 0 || outcome.failed > 0) lessonWorkDone += 1;
    }
  }
  let bookWorkDone = 0;
  for (const bookId of workingOnBooksOnly ? bookPool : []) {
    if (bookWorkDone >= MAX_BULK_BOOKS_PER_RUN) break;
    const outcome = await generateBookVoiceDraft(supabase, bookId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.generated > 0 || outcome.failed > 0) bookWorkDone += 1;
  }

  return {
    generated,
    skipped,
    failed,
    lessonsWorked: lessonWorkDone,
    booksWorked: bookWorkDone,
    exhausted: false,
  };
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

  // Not revalidating /admin/voice/content — see generateBookVoice's doc
  // comment on why a single-row action here must never force the whole
  // dashboard to reload.
  return { success: voiceId ? "Voice saved." : "Reset to the default voice." };
}
