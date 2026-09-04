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
 * The default voice for Normal lessons, Word Lists, and Mistake Review
 * (tts_settings.default_pronunciation_voice_id) — deliberately a separate
 * column from getDefaultVoiceId's, which is Stories/Conversation's own
 * setting. Falls back to a fixed Edge-TTS voice when unset (e.g. right
 * after the column was added, before an admin has picked one yet) rather
 * than null, so this trio always has a real, working voice out of the box.
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
