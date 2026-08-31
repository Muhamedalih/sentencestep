/**
 * Shared shape for the admin-configured default TTS voice (see
 * supabase/migrations/20250114000000_tts_settings.sql). Kept as its own
 * small module — no Supabase imports — so both the server-only
 * voice-queries.ts/voice-actions.ts and the client-only use-speech.ts /
 * voice-settings-form.tsx can import the same type and defaults without
 * either side pulling in code it can't run.
 */
export interface VoiceSettings {
  /** A voice's exact `SpeechSynthesisVoice.name` on whatever device the admin used to pick it — e.g. "Microsoft Zira - English (United States)". Null means no admin preference has been saved yet; every learner falls back to on-device auto-detection (see rankVoices in src/lib/speech.ts). */
  voiceName: string | null;
  /** The matching voice's `lang` (e.g. "en-US"), stored alongside voiceName as a tie-breaker in the rare case two installed voices share a name across locales. */
  voiceLang: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceName: null,
  voiceLang: null,
  rate: 0.95,
  pitch: 1,
  volume: 1,
};

export const VOICE_RATE_RANGE = { min: 0.5, max: 2 };
export const VOICE_PITCH_RANGE = { min: 0, max: 2 };
export const VOICE_VOLUME_RANGE = { min: 0, max: 1 };
