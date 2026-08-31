/**
 * The boundary a real TTS provider (ElevenLabs today, potentially another
 * vendor later) implements — mirrors src/lib/translation/provider.ts's
 * shape exactly: the rest of the app (story-voice-generation.ts, and
 * eventually an admin preview action) only ever calls through this
 * interface, never a provider's SDK/HTTP API directly. Adding or swapping a
 * provider means writing one adapter that implements this and registering
 * it in provider-registry.ts.
 *
 * Deliberately separate from src/lib/voice/generation.ts's Kokoro
 * functions, which stay exactly as they are — Normal lessons never go
 * through this interface at all (see provider-registry.ts's doc comment).
 */

/** The subset of ElevenLabs' documented voice_settings this app actually sets — see https://elevenlabs.io/docs/api-reference/text-to-speech/convert. No invented knobs: every field here is a real, current ElevenLabs parameter. */
export interface TTSVoiceSettings {
  /** 0-1. Lower values allow more expressive variation; higher values keep delivery closer to the voice's reference audio. */
  stability: number;
  /** 0-1. How closely the output matches the original voice's timbre. */
  similarityBoost: number;
  /** 0-1. Amplifies the voice's own style — 0 is neutral. Non-zero costs extra latency (provider-documented behavior, not this app's concern). */
  style: number;
  /** 0.7-1.2. Speech rate; 1.0 is the provider's default. */
  speed: number;
  useSpeakerBoost: boolean;
}

export interface SynthesizeInput {
  /** The exact string sent to the provider — may include the provider's own inline direction syntax (e.g. ElevenLabs' bracketed audio tags), already applied by direction-to-tags.ts. This module never inspects or transforms it further. */
  text: string;
  /** The provider's own voice id (voices.provider_voice_id), never this app's internal voices.id. */
  voiceId: string;
  model: string;
  voiceSettings: TTSVoiceSettings;
}

export interface SynthesizedAudio {
  audio: Buffer;
  /** Null when the provider doesn't return duration directly and computing it isn't worth the complexity — never invented. */
  durationMs: number | null;
}

export interface TTSProvider {
  readonly name: string;
  /**
   * Throws on a real provider/network failure (invalid key, rate limit,
   * malformed request) with a message safe to log — never includes the API
   * key or other secrets. Callers (story-voice-generation.ts) decide what a
   * failure means for the surrounding sentence/story; this function never
   * retries or swallows anything itself.
   */
  synthesize(input: SynthesizeInput): Promise<SynthesizedAudio>;
}
