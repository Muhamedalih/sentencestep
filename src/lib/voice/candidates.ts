import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/**
 * Lesson ids worth attempting voice generation for, bounded to `limit` —
 * shared by the cron sweep (src/app/api/cron/voice-sweep/route.ts) and the
 * admin bulk-generate action (src/lib/admin/voice-generation-actions.ts) so
 * "which lessons need work" lives in one place.
 *
 * Unlike src/lib/translation/candidates.ts, this has no cheap "failed rows
 * first" fast path: voice_audio_cache is deliberately content-addressed by
 * (voice_id, text_hash, generation_version), not by (lesson, sentence) —
 * see the migration's own doc comment — so there's no indexed way to ask
 * "which lessons have a failed cache row" without also storing a
 * lesson/sentence back-reference on every cache row, which would duplicate
 * an identity that already exists in `sentences`. Instead this simply
 * offers every published Stories/Conversation lesson, oldest-updated-first,
 * and relies on generateStoryVoiceDraft's own cheap short-circuit (it
 * returns immediately, with zero Director/provider calls, the moment every
 * sentence's cache key already resolves to 'ready') to make re-attempting
 * an already-complete lesson essentially free. A lesson with a genuinely
 * failed sentence keeps being offered here on every sweep until it's fixed
 * or its bounded retry budget (MAX_VOICE_RETRY_ATTEMPTS in
 * story-voice-generation.ts) is exhausted.
 */
export async function findLessonIdsNeedingVoiceGeneration(
  supabase: DbClient,
  limit: number,
): Promise<string[]> {
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id")
    .in("mode", ["stories", "conversation"])
    .eq("status", "published")
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  return (lessons ?? []).map((lesson) => lesson.id);
}
