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
import { generateStoryVoiceDraft } from "@/lib/voice/story-voice-generation";

const MAX_BULK_LESSONS_PER_RUN = 20;
const MAX_BULK_BOOKS_PER_RUN = 10;

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

/** Manual single-lesson trigger — the "Regenerate Story Audio" button. */
export async function generateLessonVoice(lessonId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();
  const outcome = await generateStoryVoiceDraft(supabase, lessonId);
  revalidatePath(`/admin/voice/content/${lessonId}`);
  revalidatePath("/admin/voice/content");
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

/** Manual whole-book trigger — used by both the Book Preview page's "Generate book audio" button and the "Story audio status" dashboard's per-row generate button. */
export async function generateBookVoice(bookId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();
  const outcome = await generateBookVoiceDraft(supabase, bookId);
  revalidatePath(`/admin/library/${bookId}/edit`);
  revalidatePath("/admin/voice/content");
  return summarize(outcome);
}

/**
 * Bulk "Generate Missing Audio" — bounded, shares candidate selection with
 * the cron sweep. Covers Stories, Conversations, Normal lessons, and Books
 * in one click (see findLessonIdsNeedingVoiceGeneration/
 * findBookIdsNeedingVoiceGeneration's own doc comments for exactly what's
 * excluded: only whatever an admin has individually flagged
 * voice_generation_excluded from the dashboard).
 */
export async function generateMissingVoiceForContent(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();
  const [lessonIds, bookIds] = await Promise.all([
    findLessonIdsNeedingVoiceGeneration(supabase, MAX_BULK_LESSONS_PER_RUN),
    findBookIdsNeedingVoiceGeneration(supabase, MAX_BULK_BOOKS_PER_RUN),
  ]);

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const lessonId of lessonIds) {
    const outcome = await generateStoryVoiceDraft(supabase, lessonId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
  }
  for (const bookId of bookIds) {
    const outcome = await generateBookVoiceDraft(supabase, bookId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
  }

  revalidatePath("/admin/voice/content");
  return {
    success: `Processed ${lessonIds.length} lesson(s) and ${bookIds.length} book(s): ${generated} generated, ${skipped} skipped, ${failed} failed.`,
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

  revalidatePath("/admin/voice/content");
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

  revalidatePath("/admin/voice/content");
  return { success: voiceId ? "Voice saved." : "Reset to the default voice." };
}
