/**
 * A curated shortlist of Gemini's 30 documented prebuilt TTS voice names
 * (see providers/gemini.ts) — the full list and characteristic labels are
 * documented at https://ai.google.dev/gemini-api/docs/generate-content/speech-generation;
 * gender is not labeled there, so it's taken from a well-cited third-party
 * comparison of all 30 voices, not invented — an admin can always correct a
 * voice's gender label after seeding, since it's a display detail only and
 * never affects the actual audio sent to Gemini (that's driven entirely by
 * providerVoiceId). Mirrors edge-tts-catalog.ts's exact shape/purpose: a
 * diverse starter set, seedable with one click, not the full 30.
 */
export interface GeminiVoiceDefinition {
  id: string;
  name: string;
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description: string;
}

export const GEMINI_COLLECTION = "gemini";

export const GEMINI_VOICES: GeminiVoiceDefinition[] = [
  {
    id: "gemini-kore",
    name: "Kore",
    providerVoiceId: "Kore",
    gender: "female",
    accent: "Neutral",
    description: "Firm, confident narrator voice.",
  },
  {
    id: "gemini-puck",
    name: "Puck",
    providerVoiceId: "Puck",
    gender: "male",
    accent: "Neutral",
    description: "Upbeat, energetic voice.",
  },
  {
    id: "gemini-zephyr",
    name: "Zephyr",
    providerVoiceId: "Zephyr",
    gender: "female",
    accent: "Neutral",
    description: "Bright, clear voice.",
  },
  {
    id: "gemini-charon",
    name: "Charon",
    providerVoiceId: "Charon",
    gender: "male",
    accent: "Neutral",
    description: "Informative, steady narrator voice.",
  },
  {
    id: "gemini-leda",
    name: "Leda",
    providerVoiceId: "Leda",
    gender: "female",
    accent: "Neutral",
    description: "Youthful, light voice.",
  },
  {
    id: "gemini-orus",
    name: "Orus",
    providerVoiceId: "Orus",
    gender: "male",
    accent: "Neutral",
    description: "Firm, grounded voice.",
  },
  {
    id: "gemini-autonoe",
    name: "Autonoe",
    providerVoiceId: "Autonoe",
    gender: "female",
    accent: "Neutral",
    description: "Bright, warm voice.",
  },
  {
    id: "gemini-achird",
    name: "Achird",
    providerVoiceId: "Achird",
    gender: "male",
    accent: "Neutral",
    description: "Friendly, approachable voice.",
  },
  {
    id: "gemini-despina",
    name: "Despina",
    providerVoiceId: "Despina",
    gender: "female",
    accent: "Neutral",
    description: "Smooth, easy-going voice.",
  },
  {
    id: "gemini-sulafat",
    name: "Sulafat",
    providerVoiceId: "Sulafat",
    gender: "male",
    accent: "Neutral",
    description: "Warm, rich voice.",
  },
  {
    id: "gemini-vindemiatrix",
    name: "Vindemiatrix",
    providerVoiceId: "Vindemiatrix",
    gender: "female",
    accent: "Neutral",
    description: "Gentle, soft-spoken voice.",
  },
  {
    id: "gemini-schedar",
    name: "Schedar",
    providerVoiceId: "Schedar",
    gender: "male",
    accent: "Neutral",
    description: "Even, measured narrator voice.",
  },
];
