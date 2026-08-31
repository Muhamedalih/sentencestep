import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { getVoices } from "@/lib/admin/voices-queries";

export interface ElevenLabsSettings {
  model: string;
  defaultStoryVoiceId: string | null;
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}

export const DEFAULT_ELEVENLABS_SETTINGS: ElevenLabsSettings = {
  model: "eleven_v3",
  defaultStoryVoiceId: null,
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.3,
  speed: 1.0,
  useSpeakerBoost: true,
};

/** The elevenlabs_settings singleton — mirrors getVoiceSettings()'s shape for the pre-existing Web Speech preference. */
export async function getElevenLabsSettings(): Promise<ElevenLabsSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_ELEVENLABS_SETTINGS;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("elevenlabs_settings")
    .select(
      "model, default_story_voice_id, stability, similarity_boost, style, speed, use_speaker_boost",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return DEFAULT_ELEVENLABS_SETTINGS;

  return {
    model: data.model,
    defaultStoryVoiceId: data.default_story_voice_id,
    stability: data.stability,
    similarityBoost: data.similarity_boost,
    style: data.style,
    speed: data.speed,
    useSpeakerBoost: data.use_speaker_boost,
  };
}

/** Every registered ElevenLabs voice — a thin filter over the same getVoices() every Kokoro admin UI already reads, kept as one query rather than a second `voices` fetch path. */
export async function getElevenLabsVoices(): Promise<VoiceRow[]> {
  const voices = await getVoices();
  return voices.filter((voice) => voice.source === "elevenlabs");
}
