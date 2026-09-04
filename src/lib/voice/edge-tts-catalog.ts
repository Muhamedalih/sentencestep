/**
 * A curated shortlist of real Edge-TTS neural voice names (see
 * providers/edge-tts.ts) — fetched live from the actual voice list this
 * app's Edge-TTS provider talks to
 * (https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list),
 * not invented. Not exhaustive (that list has 300+ voices across every
 * language Edge supports); this is a deliberately small, diverse set of
 * English voices — different genders and accents — good enough to seed
 * with one click (seedEdgeTtsVoicesAction) so an admin has real choices
 * immediately instead of hunting for voice names one at a time.
 */
export interface EdgeTtsVoiceDefinition {
  id: string;
  name: string;
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description: string;
}

export const EDGE_TTS_COLLECTION = "edge-tts";

export const EDGE_TTS_VOICES: EdgeTtsVoiceDefinition[] = [
  {
    id: "edge-tts-en-us-aria",
    name: "Aria",
    providerVoiceId: "en-US-AriaNeural",
    gender: "female",
    accent: "American",
    description: "Warm, expressive American narrator voice.",
  },
  {
    id: "edge-tts-en-us-guy",
    name: "Guy",
    providerVoiceId: "en-US-GuyNeural",
    gender: "male",
    accent: "American",
    description: "Clear, confident American narrator voice.",
  },
  {
    id: "edge-tts-en-us-jenny",
    name: "Jenny",
    providerVoiceId: "en-US-JennyNeural",
    gender: "female",
    accent: "American",
    description: "Friendly, conversational American voice.",
  },
  {
    id: "edge-tts-en-us-andrew",
    name: "Andrew",
    providerVoiceId: "en-US-AndrewNeural",
    gender: "male",
    accent: "American",
    description: "Natural, relaxed American voice.",
  },
  {
    id: "edge-tts-en-us-emma",
    name: "Emma",
    providerVoiceId: "en-US-EmmaNeural",
    gender: "female",
    accent: "American",
    description: "Bright, energetic American voice.",
  },
  {
    id: "edge-tts-en-us-christopher",
    name: "Christopher",
    providerVoiceId: "en-US-ChristopherNeural",
    gender: "male",
    accent: "American",
    description: "Deep, steady American narrator voice.",
  },
  {
    id: "edge-tts-en-gb-sonia",
    name: "Sonia",
    providerVoiceId: "en-GB-SoniaNeural",
    gender: "female",
    accent: "British",
    description: "Clear British English voice.",
  },
  {
    id: "edge-tts-en-gb-ryan",
    name: "Ryan",
    providerVoiceId: "en-GB-RyanNeural",
    gender: "male",
    accent: "British",
    description: "Warm British English voice.",
  },
  {
    id: "edge-tts-en-gb-libby",
    name: "Libby",
    providerVoiceId: "en-GB-LibbyNeural",
    gender: "female",
    accent: "British",
    description: "Youthful British English voice.",
  },
  {
    id: "edge-tts-en-au-natasha",
    name: "Natasha",
    providerVoiceId: "en-AU-NatashaNeural",
    gender: "female",
    accent: "Australian",
    description: "Bright Australian English voice.",
  },
  {
    id: "edge-tts-en-au-william",
    name: "William",
    providerVoiceId: "en-AU-WilliamMultilingualNeural",
    gender: "male",
    accent: "Australian",
    description: "Confident Australian English voice.",
  },
  {
    id: "edge-tts-en-ca-clara",
    name: "Clara",
    providerVoiceId: "en-CA-ClaraNeural",
    gender: "female",
    accent: "Canadian",
    description: "Warm Canadian English voice.",
  },
  {
    id: "edge-tts-en-ie-connor",
    name: "Connor",
    providerVoiceId: "en-IE-ConnorNeural",
    gender: "male",
    accent: "Irish",
    description: "Friendly Irish English voice.",
  },
  {
    id: "edge-tts-en-in-neerja",
    name: "Neerja",
    providerVoiceId: "en-IN-NeerjaNeural",
    gender: "female",
    accent: "Indian",
    description: "Clear Indian English voice.",
  },
];
