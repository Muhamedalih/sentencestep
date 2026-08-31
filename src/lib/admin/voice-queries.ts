import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_VOICE_SETTINGS } from "@/lib/admin/voice-settings";
import type { VoiceSettings } from "@/lib/admin/voice-settings";

/**
 * Reads the one admin-configured TTS row. Called both from the admin voice
 * page (to show the current selection) and from src/app/learn/layout.tsx
 * (to hand the same preference to every learner's browser via
 * VoiceSettingsProvider) — same read, same fallback, so an unconfigured
 * project behaves identically in both places instead of the admin UI
 * showing a value learners never actually get.
 */
export async function getVoiceSettings(): Promise<VoiceSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_VOICE_SETTINGS;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tts_settings")
    .select("voice_name, voice_lang, rate, pitch, volume")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_VOICE_SETTINGS;

  return {
    voiceName: data.voice_name,
    voiceLang: data.voice_lang,
    rate: data.rate,
    pitch: data.pitch,
    volume: data.volume,
  };
}
