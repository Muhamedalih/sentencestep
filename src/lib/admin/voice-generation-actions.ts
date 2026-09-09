"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

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
 * Deferred via `after()`, exactly like triggerAutomaticVoiceGeneration's own
 * auto-trigger-on-save (see that file's doc comment for the shared
 * reasoning) — added after Sentry caught the real cause of this project's
 * recurring "works fine, then suddenly fails" reports on /admin/voice/content:
 * actual HTTP 504s (`POST /admin/voice/content [504]`), a client/gateway
 * timeout on the request itself, not a thrown error in the code. A 12-sentence
 * lesson is 1 Voice Director call plus 12 real TTS calls, sequential, all
 * held inside one HTTP request-response cycle the browser waits on — plenty
 * to outlast a proxy's patience even when the work itself succeeds
 * server-side (confirmed: admins kept seeing correct generated audio despite
 * the error, because the generation had actually finished after the browser
 * already gave up). Returning immediately and letting the real work continue
 * after the response is sent removes the timeout risk entirely, regardless
 * of how many sentences a lesson has — the trade-off is losing the exact
 * "N generated, M failed" count in the same click; the admin sees it
 * reflected in the row's badges on the next real page load instead.
 */
export async function generateLessonVoice(lessonId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  after(async () => {
    const supabase = createServiceRoleClient();
    const outcome = await generateStoryVoiceDraft(supabase, lessonId);
    if (outcome.error) {
      console.error("[voice] generateLessonVoice (admin) issue", {
        lessonId,
        error: outcome.error,
      });
    }
    revalidatePath(`/admin/voice/content/${lessonId}`);
  });

  return {
    success: "Generation started in the background — refresh in a moment to see the result.",
  };
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
 * per-row generate button. Deferred via `after()` — see
 * generateLessonVoice's own doc comment for why (the actual measured 504
 * gateway-timeout cause, confirmed via Sentry, not a guess).
 */
export async function generateBookVoice(bookId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  after(async () => {
    const supabase = createServiceRoleClient();
    const outcome = await generateBookVoiceDraft(supabase, bookId);
    if (outcome.error) {
      console.error("[voice] generateBookVoice (admin) issue", { bookId, error: outcome.error });
    }
    revalidatePath(`/admin/library/${bookId}/edit`);
  });

  return {
    success: "Generation started in the background — refresh in a moment to see the result.",
  };
}

/**
 * Bulk "Generate Missing Audio" — bounded, shares candidate selection with
 * the cron sweep. Covers Stories, Conversations, Normal lessons, and Books
 * in one click (see findLessonIdsNeedingVoiceGeneration/
 * findBookIdsNeedingVoiceGeneration's own doc comments for exactly what's
 * excluded: only whatever an admin has individually flagged
 * voice_generation_excluded from the dashboard).
 *
 * The candidate-selection + cap check stay synchronous (a couple of cheap
 * queries, safe to await directly) so a capped/empty run still gets an
 * immediate, accurate message. The actual generation loop is deferred via
 * `after()` — see generateLessonVoice's own doc comment for why: even at
 * MAX_BULK_LESSONS_PER_RUN's reduced size, a handful of multi-sentence
 * lessons processed sequentially can still outlast the platform gateway's
 * timeout on the request itself (confirmed via Sentry: real HTTP 504s on
 * this exact route), regardless of how small the batch is made.
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

  const [lessonIds, bookIds] = await Promise.all([
    findLessonIdsNeedingVoiceGeneration(supabase, MAX_BULK_LESSONS_PER_RUN),
    findBookIdsNeedingVoiceGeneration(supabase, MAX_BULK_BOOKS_PER_RUN),
  ]);

  if (lessonIds.length === 0 && bookIds.length === 0) {
    return { success: "Nothing left to generate — every eligible item is already up to date." };
  }

  after(async () => {
    for (const lessonId of lessonIds) {
      try {
        const outcome = await generateStoryVoiceDraft(supabase, lessonId);
        if (outcome.error) {
          console.error("[voice] bulk generate lesson issue", { lessonId, error: outcome.error });
        }
      } catch (err) {
        console.error("[voice] bulk generate lesson threw", { lessonId, err });
      }
    }
    for (const bookId of bookIds) {
      try {
        const outcome = await generateBookVoiceDraft(supabase, bookId);
        if (outcome.error) {
          console.error("[voice] bulk generate book issue", { bookId, error: outcome.error });
        }
      } catch (err) {
        console.error("[voice] bulk generate book threw", { bookId, err });
      }
    }
    revalidatePath("/admin/voice/content");
  });

  return {
    success: `Started generating ${lessonIds.length} lesson(s) and ${bookIds.length} book(s) in the background — refresh this page in a moment to see updated status.`,
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
