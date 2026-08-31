"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { findLessonIdsNeedingVoiceGeneration } from "@/lib/voice/candidates";
import { generateStoryVoiceDraft } from "@/lib/voice/story-voice-generation";

const MAX_BULK_LESSONS_PER_RUN = 20;

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

/** Bulk "Generate Missing Audio" — bounded, shares candidate selection with the cron sweep. */
export async function generateMissingVoiceForLessons(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();
  const lessonIds = await findLessonIdsNeedingVoiceGeneration(supabase, MAX_BULK_LESSONS_PER_RUN);

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const lessonId of lessonIds) {
    const outcome = await generateStoryVoiceDraft(supabase, lessonId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
  }

  revalidatePath("/admin/voice/content");
  return {
    success: `Processed ${lessonIds.length} lesson(s): ${generated} generated, ${skipped} skipped, ${failed} failed.`,
  };
}
