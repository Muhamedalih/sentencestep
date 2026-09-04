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
 * offers every published, non-excluded Stories lesson, oldest-updated-first,
 * and relies on generateStoryVoiceDraft's own cheap short-circuit (it
 * returns immediately, with zero Director/provider calls, the moment every
 * sentence's cache key already resolves to 'ready') to make re-attempting
 * an already-complete lesson essentially free. A lesson with a genuinely
 * failed sentence keeps being offered here on every sweep until it's fixed
 * or its bounded retry budget (MAX_VOICE_RETRY_ATTEMPTS in
 * story-voice-generation.ts) is exhausted.
 *
 * Scoped to `mode IN ("stories", "conversation", "normal")` — all three are
 * fully supported by generateStoryVoiceDraft/resolveTargetVoices
 * (Conversation resolves each sentence's speaker to an explicit or
 * deterministically hashed voice; Normal resolves the same one-narrator-
 * per-lesson way Stories does, see resolveTargetVoices' own doc comment),
 * so all three are offered to the automatic bulk/cron sweep the same way. A
 * Normal lesson's sentences only actually become audible to a learner once
 * its own lessons.voice_id also points at that narration voice (the same
 * column voice-audio.ts's resolvePronunciationAudioAction reads for
 * playback) — generating ahead of that is harmless (a normal cache-key
 * miss under whatever voice ends up assigned), not wasted duplicate work,
 * since nothing else in this app currently uses Normal-lesson narration
 * clips.
 *
 * `voice_generation_excluded` (see 20250217000000_voice_generation_exclusion.sql)
 * lets an admin opt a specific lesson out of this sweep from the "Story
 * audio status" dashboard without unpublishing it.
 */
export async function findLessonIdsNeedingVoiceGeneration(
  supabase: DbClient,
  limit: number,
): Promise<string[]> {
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id")
    .in("mode", ["stories", "conversation", "normal"])
    .eq("status", "published")
    .eq("voice_generation_excluded", false)
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  return (lessons ?? []).map((lesson) => lesson.id);
}

/**
 * Book ids worth attempting narration generation for, bounded to `limit` —
 * the book-voice-generation.ts counterpart to
 * findLessonIdsNeedingVoiceGeneration, shared by the same cron sweep (see
 * src/app/api/cron/voice-sweep/route.ts). Every published, non-excluded
 * book, oldest-updated-first — generateBookVoiceDraft's own cheap
 * short-circuit (every sentence already 'ready' means zero Director/
 * provider calls) makes re-attempting an already-complete book essentially
 * free, same reasoning as the lesson version above.
 */
export async function findBookIdsNeedingVoiceGeneration(
  supabase: DbClient,
  limit: number,
): Promise<string[]> {
  const { data: books, error } = await supabase
    .from("books")
    .select("id")
    .eq("status", "published")
    .eq("voice_generation_excluded", false)
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  return (books ?? []).map((book) => book.id);
}

/**
 * Word group ids worth attempting pronunciation generation for, bounded to
 * `limit` — the word-list-voice-generation.ts counterpart to
 * findLessonIdsNeedingVoiceGeneration/findBookIdsNeedingVoiceGeneration,
 * shared by the same cron sweep. No `voice_generation_excluded` column
 * exists on word_groups (that opt-out has never been needed here — word
 * pronunciation has no expressive-narration cost/quality tradeoff to guard
 * against), so this simply offers every published group, oldest-updated-
 * first; generateWordGroupVoiceDraft's own cheap short-circuit (every word
 * already 'ready' means zero provider calls) makes re-attempting an
 * already-complete group essentially free, same reasoning as the other two.
 */
export async function findWordGroupIdsNeedingVoiceGeneration(
  supabase: DbClient,
  limit: number,
): Promise<string[]> {
  const { data: groups, error } = await supabase
    .from("word_groups")
    .select("id")
    .eq("status", "published")
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  return (groups ?? []).map((group) => group.id);
}
