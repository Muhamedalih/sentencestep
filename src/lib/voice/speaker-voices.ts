import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * A Conversation lesson's speaker -> voice_id assignments (lesson_speaker_
 * voices, 20250203000000_elevenlabs_voice_engine.sql), read the same
 * publicly-readable way getDefaultVoiceId() reads tts_settings — every
 * learner's page load needs this to pick the right voice per speaker (see
 * LessonPage/LessonSession/TypingSentence), not just an admin session.
 */
export async function getSpeakerVoiceMap(lessonId: string): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return {};

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lesson_speaker_voices")
    .select("speaker, voice_id")
    .eq("lesson_id", lessonId);
  if (error || !data) return {};

  return Object.fromEntries(data.map((row) => [row.speaker, row.voice_id]));
}
