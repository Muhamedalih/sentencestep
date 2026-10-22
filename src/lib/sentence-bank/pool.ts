import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Sentence bank: the reads that need the service role. Row-level security on `sentences` shows a
 * learner only the sentences of free lessons — or everything while they have an active
 * subscription — so a learner whose subscription ended could no longer be asked back sentences
 * they typed in a lesson that was then premium. The sentence bank never locks (a lapsed learner
 * keeps what they typed), so these reads bypass RLS, and are scoped instead to exactly what that
 * learner has finished or already has on their schedule: the lesson ids come from their own
 * progress and the sentence ids from their own sentence_mastery rows, never from the client.
 * Server-only; the result is turned into review items and never handed to the browser as it is.
 */

export interface PoolSentence {
  id: string;
  lessonId: string;
  orderIndex: number;
  en: string;
  /** The legacy Arabic text; the learner's own language is resolved from the translations table. */
  ar: string;
}

/** A list for a PostgREST `in.(...)` filter, each id quoted so nothing in an id can break the filter. */
function inList(ids: readonly string[]): string {
  return ids.map((id) => `"${id.replace(/["\\]/g, "")}"`).join(",");
}

/**
 * The sentences of the given lessons plus the given sentences (the due ones, whose lesson may be
 * older than the recent window), in one read. Throws on a database error.
 */
export async function fetchSentencePool(args: {
  lessonIds: readonly string[];
  sentenceIds: readonly string[];
}): Promise<PoolSentence[]> {
  const filters: string[] = [];
  if (args.lessonIds.length > 0) filters.push(`lesson_id.in.(${inList(args.lessonIds)})`);
  if (args.sentenceIds.length > 0) filters.push(`id.in.(${inList(args.sentenceIds)})`);
  if (filters.length === 0) return [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("sentences")
    .select("id, lesson_id, order_index, en, ar")
    .or(filters.join(","));
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    lessonId: row.lesson_id,
    orderIndex: row.order_index,
    en: row.en,
    ar: row.ar,
  }));
}

export interface LessonVoice {
  mode: string;
  /** The lesson's own narrator, or null when it uses its section's default. */
  voiceId: string | null;
}

/** The narrator of each of the given lessons (a handful of them: the ones the chosen sentences come from). */
export async function fetchLessonVoices(
  lessonIds: readonly string[],
): Promise<Map<string, LessonVoice>> {
  const voices = new Map<string, LessonVoice>();
  if (lessonIds.length === 0) return voices;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, mode, voice_id")
    .in("id", [...lessonIds]);
  if (error) throw error;
  for (const row of data ?? []) voices.set(row.id, { mode: row.mode, voiceId: row.voice_id });
  return voices;
}
