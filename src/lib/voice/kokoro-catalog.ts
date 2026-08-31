/**
 * The curated "Kokoro Natural Learning" collection — 10 voices selected out
 * of Kokoro-82M's full 45-voice set (see hexgrad/Kokoro-82M's VOICES.md)
 * for language-learning suitability: every entry here carries the model's
 * own top "Target Quality" grade (A or B — no C/D-grade voices), American
 * and British English only, and a roughly even gender split. This is the
 * single source of truth for which voices get seeded/generated — see
 * seedKokoroCollectionAction in voices-actions.ts, the only place that
 * reads it.
 */
export interface KokoroVoiceDefinition {
  /** This app's own stable id — what lessons.voice_id and tts_settings.default_voice_id actually reference. Never the raw Kokoro code directly, so a future non-Kokoro provider never collides. */
  id: string;
  /** The raw Kokoro voice code passed to KokoroTTS.generate() — see generation.ts. */
  providerVoiceId: string;
  name: string;
  gender: "female" | "male";
  accent: "American" | "British";
  description: string;
}

export const KOKORO_COLLECTION = "kokoro-natural-learning";

export const KOKORO_PREVIEW_TEXT = "The sun was shining brightly when we left home.";

export const KOKORO_VOICES: KokoroVoiceDefinition[] = [
  {
    id: "kokoro-heart",
    providerVoiceId: "af_heart",
    name: "Heart",
    gender: "female",
    accent: "American",
    description:
      "Kokoro's flagship voice — warm, clear, and the most naturally paced of the collection.",
  },
  {
    id: "kokoro-bella",
    providerVoiceId: "af_bella",
    name: "Bella",
    gender: "female",
    accent: "American",
    description:
      "Extensively trained and highly rated for naturalness — an easy, confident narrator tone.",
  },
  {
    id: "kokoro-nicole",
    providerVoiceId: "af_nicole",
    name: "Nicole",
    gender: "female",
    accent: "American",
    description:
      "Soft, measured delivery that stays comfortable to listen to across many repeated sentences.",
  },
  {
    id: "kokoro-fenrir",
    providerVoiceId: "am_fenrir",
    name: "Fenrir",
    gender: "male",
    accent: "American",
    description:
      "Grounded, even-toned male voice with clean consonants — good for careful listening practice.",
  },
  {
    id: "kokoro-michael",
    providerVoiceId: "am_michael",
    name: "Michael",
    gender: "male",
    accent: "American",
    description: "Clear, professional narrator quality without sounding stiff or robotic.",
  },
  {
    id: "kokoro-puck",
    providerVoiceId: "am_puck",
    name: "Puck",
    gender: "male",
    accent: "American",
    description:
      "Conversational and relaxed — reads example sentences the way a friendly tutor would.",
  },
  {
    id: "kokoro-emma",
    providerVoiceId: "bf_emma",
    name: "Emma",
    gender: "female",
    accent: "British",
    description:
      "The most extensively trained British voice in the set — crisp Received Pronunciation.",
  },
  {
    id: "kokoro-isabella",
    providerVoiceId: "bf_isabella",
    name: "Isabella",
    gender: "female",
    accent: "British",
    description: "Clear, gentle British tone, a good contrast to Emma's brisker delivery.",
  },
  {
    id: "kokoro-fable",
    providerVoiceId: "bm_fable",
    name: "Fable",
    gender: "male",
    accent: "British",
    description: "Storytelling-oriented British male voice — natural pacing for longer sentences.",
  },
  {
    id: "kokoro-george",
    providerVoiceId: "bm_george",
    name: "George",
    gender: "male",
    accent: "British",
    description:
      "Clean, professional British male voice, steady and unobtrusive for repeated listening.",
  },
];
