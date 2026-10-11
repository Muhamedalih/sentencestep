"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { getWordGroupAudioStatus, type WordGroupAudioStatus } from "@/lib/admin/word-audio-queries";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isWordListProvider } from "@/lib/voice/content-provider-map";
import { triggerAutomaticWordGroupVoiceGeneration } from "@/lib/voice/auto-trigger";
import { generateWordGroupVoiceDraft } from "@/lib/voice/word-list-voice-generation";

/**
 * Kept well under the ~25s ceiling a synchronous admin request really has on
 * Netlify (see voice-generation-actions.ts's MAX_BULK_LESSONS_PER_RUN doc
 * comment): one click works through as many words as fit, and the row's
 * client loop (WordAudioDashboardRow) clicks again by itself until the group
 * is complete — many small safe round trips instead of one fragile big one.
 */
const GENERATE_ROUND_DEADLINE_MS = 14_000;

export interface WordAudioActionResult extends ActionResult {
  /** Fresh counts under the voice the group now plays — the row updates itself from this instead of reloading the dashboard. */
  status?: WordGroupAudioStatus;
  /** Words this call actually generated — lets the row's loop stop once a round makes no progress. */
  generated?: number;
}

/**
 * The "Narration voice" picker on the Word audio status dashboard: saves
 * word_groups.voice_id (null = back to the site default) and kicks off
 * generation in the background, exactly like saving the voice from the
 * group's edit form (updateWordGroup) — nothing else about the group is
 * touched, and no existing clip is deleted or regenerated (a different voice
 * is a different cache key).
 */
export async function setWordGroupVoiceAction(
  groupId: string,
  voiceId: string | null,
): Promise<WordAudioActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  if (voiceId) {
    const { data: voice } = await supabase
      .from("voices")
      .select("source")
      .eq("id", voiceId)
      .maybeSingle();
    if (!voice || !isWordListProvider(voice.source)) {
      return { error: "Word Lists can only use an Edge-TTS or Fish Audio voice." };
    }
  }

  const { data, error } = await supabase
    .from("word_groups")
    .update({ voice_id: voiceId })
    .eq("id", groupId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Couldn't save the voice. Please try again." };

  triggerAutomaticWordGroupVoiceGeneration(groupId);
  void logAdminAction("word_group.voice_set", "word_group", groupId, { voiceId });
  revalidatePath(`/admin/word-lists/${groupId}/edit`);

  return {
    success: voiceId ? "Voice saved — generating…" : "Reset to the default voice.",
    status: (await getWordGroupAudioStatus(groupId)) ?? undefined,
  };
}

/** A fresh status for one row — what the row polls while a background generation finishes. */
export async function getWordGroupAudioStatusAction(
  groupId: string,
): Promise<WordAudioActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  const status = await getWordGroupAudioStatus(groupId);
  return status ? { success: "", status } : { error: "That word group no longer exists." };
}

/**
 * One row's "Generate" button: one deadline-bounded round of
 * generateWordGroupVoiceDraft for the group under the voice it plays,
 * forcing a retry of any word whose clip failed (so a word that already
 * used up its automatic retries can be re-attempted by hand, like a
 * sentence's "Regenerate" on the Story dashboard).
 */
export async function generateWordGroupVoiceAction(
  groupId: string,
): Promise<WordAudioActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const before = await getWordGroupAudioStatus(groupId);
  if (!before) return { error: "That word group no longer exists." };

  const supabase = createServiceRoleClient();
  const outcome = await generateWordGroupVoiceDraft(
    supabase,
    groupId,
    new Set(before.failedWordIds),
    { deadlineMs: GENERATE_ROUND_DEADLINE_MS },
  );
  const status = (await getWordGroupAudioStatus(groupId)) ?? undefined;

  const summary = `${outcome.generated} generated, ${outcome.skipped} skipped, ${outcome.failed} failed.`;
  return {
    ...(outcome.error ? { error: `${summary} ${outcome.error}` } : { success: summary }),
    status,
    generated: outcome.generated,
  };
}
