import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface VoiceRow {
  id: string;
  name: string;
  source: string;
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  language: string;
  description: string | null;
  collection: string;
  sampleAudioUrl: string | null;
}

/** Every voice, grouped by collection — the admin voice page's whole data source (both the existing-collection list and the Kokoro Natural Learning list read through this one function). Publicly readable at the DB level, but only ever called from admin pages today. */
export async function getVoices(): Promise<VoiceRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("voices")
    .select(
      "id, name, source, provider_voice_id, gender, accent, language, description, collection, sample_audio_url",
    )
    .order("collection")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    source: row.source,
    providerVoiceId: row.provider_voice_id,
    gender: row.gender,
    accent: row.accent,
    language: row.language,
    description: row.description,
    collection: row.collection,
    sampleAudioUrl: row.sample_audio_url,
  }));
}

/** The global default voice id (tts_settings.default_voice_id) — Stories/Conversation's own fallback (see story-voice-generation.ts's resolveTargetVoices), read separately from getVoiceSettings (the pre-existing Web Speech preference) since it's a distinct, additive concept; see voice-settings.ts's doc comment. Never read by Normal lessons/Word Lists/Mistake Review — see getDefaultPronunciationVoiceId for their own, separate default. */
export async function getDefaultVoiceId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tts_settings")
    .select("default_voice_id")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return null;
  return data.default_voice_id;
}

/**
 * The default voice for Word Lists (tts_settings.default_pronunciation_voice_id)
 * — deliberately a separate column from getDefaultVoiceId's (Stories/
 * Conversation's own setting) and from getDefaultNormalLessonVoiceId's
 * (Normal lessons' own setting). Must be an Edge-TTS voice (reassigned from
 * Cartesia 2026-09-10) — see content-provider-map.ts and
 * word-list-voice-generation.ts. Falls back to a fixed Edge-TTS voice id
 * when unset purely so a fresh deployment has *some* value to read before
 * an admin has picked one explicitly; word-list-voice-generation.ts still
 * rejects it (and reports an error) if it doesn't resolve to an actual
 * voice from the currently-assigned provider.
 */
export async function getDefaultPronunciationVoiceId(): Promise<string> {
  const FALLBACK_VOICE_ID = "edge-tts-en-us-aria";
  if (!isSupabaseConfigured()) return FALLBACK_VOICE_ID;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tts_settings")
    .select("default_pronunciation_voice_id")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data?.default_pronunciation_voice_id) return FALLBACK_VOICE_ID;
  return data.default_pronunciation_voice_id;
}

/**
 * The default voice for Normal lessons / Daily Lessons
 * (tts_settings.default_normal_lesson_voice_id) — split out from
 * getDefaultPronunciationVoiceId (now Word Lists' own setting) so the two
 * content types can each be repointed independently even though both
 * currently use Cartesia (see content-provider-map.ts's NORMAL_LESSON_PROVIDER
 * doc comment for why Normal lessons moved from Hume to Cartesia
 * 2026-09-10) — a voice id set here must never leak into Word Lists'
 * setting or vice versa. See 20250225000000_normal_lesson_default_voice.sql.
 * Falls back to the same fixed Edge-TTS voice id for the same reason as
 * getDefaultPronunciationVoiceId — a placeholder for a fresh deployment,
 * rejected by story-voice-generation.ts if it isn't an actual Cartesia
 * voice.
 */
export async function getDefaultNormalLessonVoiceId(): Promise<string> {
  const FALLBACK_VOICE_ID = "edge-tts-en-us-aria";
  if (!isSupabaseConfigured()) return FALLBACK_VOICE_ID;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tts_settings")
    .select("default_normal_lesson_voice_id")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data?.default_normal_lesson_voice_id) return FALLBACK_VOICE_ID;
  return data.default_normal_lesson_voice_id;
}
