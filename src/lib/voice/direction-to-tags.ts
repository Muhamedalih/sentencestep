import type {
  SentenceDirection,
  VoiceEmotion,
  VoiceEnergy,
  VoicePace,
  VoicePause,
} from "@/lib/voice/director-types";
import type { TTSVoiceSettings } from "@/lib/voice/provider";

/**
 * The pure, deterministic translator from a Voice Director decision into an
 * actual eleven_v3 request: the same SentenceDirection + text + base
 * settings always produces byte-identical output — no randomness, no
 * Date.now() — which is what makes direction-to-tags.test.ts meaningful and
 * lets story-voice-generation.ts fold this into a stable cache identity.
 *
 * Every technique used here is a real, currently-documented eleven_v3
 * behavior (bracketed audio tags — see
 * https://elevenlabs.io/docs/best-practices/prompting/controls — and the
 * stability/style/speed voice_settings the convert endpoint accepts). One
 * field, `emphasisWord`, is deliberately NOT applied to the output text:
 * neither capitalization nor any other text markup for single-word emphasis
 * is a documented eleven_v3 control, and this module never fakes a control
 * the provider doesn't actually have (see the project brief's explicit rule
 * against that). The Director's emphasisWord choice is still recorded
 * verbatim in voice_audio_cache.voice_direction for admin visibility and
 * for a future mapping once/if a real mechanism is confirmed — it's inert
 * here, not discarded.
 */

const EMOTION_TAGS: Record<VoiceEmotion, string> = {
  neutral: "",
  excited: "[excited]",
  curious: "[curious]",
  sad: "[sad]",
  happy: "[happy]",
  whispering: "[whispers]",
  sarcastic: "[sarcastic]",
  angry: "[angry]",
  crying: "[crying]",
  mischievous: "[mischievously]",
  sighing: "[sighs]",
  laughing: "[laughs]",
};

/** Additive deltas on top of the admin-configured base stability/style, clamped to ElevenLabs' documented 0-1 range below. Lower stability + higher style = more expressive variation, appropriate for higher-energy delivery; the reverse keeps calmer sentences consistent. */
const ENERGY_DELTAS: Record<VoiceEnergy, { stability: number; style: number }> = {
  low: { stability: 0.15, style: -0.1 },
  medium: { stability: 0, style: 0 },
  high: { stability: -0.15, style: 0.15 },
};

/** Additive deltas on the admin-configured base speed, clamped to ElevenLabs' documented 0.7-1.2 range below. */
const PACE_DELTAS: Record<VoicePace, number> = {
  slow: -0.15,
  normal: 0,
  fast: 0.15,
};

/**
 * Leading ellipses — ElevenLabs' own documented punctuation guidance for
 * v3 recommends ellipses to add a natural pause before speech resumes.
 * "long" simply repeats the technique for a longer beat.
 */
const PAUSE_PREFIXES: Record<VoicePause, string> = {
  none: "",
  short: "... ",
  long: "... ... ",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface ElevenLabsDirectionInput {
  taggedText: string;
  voiceSettings: TTSVoiceSettings;
}

export function toElevenLabsInput(
  direction: SentenceDirection,
  text: string,
  base: TTSVoiceSettings,
): ElevenLabsDirectionInput {
  const emotionTag = EMOTION_TAGS[direction.emotion];
  const pausePrefix = PAUSE_PREFIXES[direction.pauseBefore];
  const taggedText = `${pausePrefix}${emotionTag ? `${emotionTag} ` : ""}${text}`;

  const energyDelta = ENERGY_DELTAS[direction.energy];
  const paceDelta = PACE_DELTAS[direction.pace];

  const voiceSettings: TTSVoiceSettings = {
    stability: clamp(base.stability + energyDelta.stability, 0, 1),
    similarityBoost: base.similarityBoost,
    style: clamp(base.style + energyDelta.style, 0, 1),
    speed: clamp(base.speed + paceDelta, 0.7, 1.2),
    useSpeakerBoost: base.useSpeakerBoost,
  };

  return { taggedText, voiceSettings };
}
