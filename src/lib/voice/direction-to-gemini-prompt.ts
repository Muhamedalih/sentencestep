import type {
  SentenceDirection,
  VoiceEmotion,
  VoiceEnergy,
  VoicePace,
} from "@/lib/voice/director-types";

/**
 * The pure, deterministic translator from a Voice Director decision into a
 * Gemini TTS request — the Gemini counterpart to direction-to-tags.ts/
 * direction-to-ssml.ts/direction-to-prosody.ts. Same contract: the same
 * direction + text + voice always produces byte-identical output.
 *
 * Gemini's TTS has no SSML at all — its documented control surface is a
 * natural-language instruction prefixed onto the spoken text itself (its
 * own official example: `"Say cheerfully: Have a wonderful day!"` — see
 * https://ai.google.dev/gemini-api/docs/generate-content/speech-generation).
 * This module builds that same style of plain-English instruction from the
 * Director's structured decision, rather than any markup.
 *
 * IMPORTANT CAVEAT this codebase's other direction-to-*.ts modules don't
 * carry: ElevenLabs/Azure/Edge-TTS's mappings were each verified against
 * their real endpoints before being written (see each module's own doc
 * comment). This one was written from Gemini's documented example pattern
 * alone — no live Gemini API key was available while building it, so
 * exactly how reliably the model follows a multi-clause instruction (energy
 * + pace + pause + emphasis all at once) hasn't been empirically confirmed
 * the way the others were. The mapping is conservative (plain descriptive
 * English, nothing invented or SSML-shaped) and should be treated as a
 * strong starting point to verify by ear once a real key is available, not
 * a proven-correct mapping yet.
 */

const EMOTION_PHRASES: Record<VoiceEmotion, string | null> = {
  neutral: null,
  excited: "excited",
  curious: "curious",
  sad: "sad",
  happy: "happy",
  whispering: "whispering, very quiet",
  sarcastic: "sarcastic",
  angry: "angry",
  crying: "tearful, on the verge of crying",
  mischievous: "playful and mischievous",
  sighing: "weary, sighing",
  laughing: "amused, laughing",
};

const ENERGY_PHRASES: Record<VoiceEnergy, string | null> = {
  low: "low-energy, subdued",
  medium: null,
  high: "high-energy, animated",
};

const PACE_PHRASES: Record<VoicePace, string | null> = {
  slow: "slow-paced",
  normal: null,
  fast: "fast-paced",
};

function buildInstruction(direction: SentenceDirection): string | null {
  const toneClauses = [
    EMOTION_PHRASES[direction.emotion],
    ENERGY_PHRASES[direction.energy],
    PACE_PHRASES[direction.pace],
  ].filter((clause): clause is string => clause !== null);

  const extraClauses: string[] = [];
  if (direction.pauseBefore === "short") extraClauses.push("with a brief pause before starting");
  if (direction.pauseBefore === "long")
    extraClauses.push("with a long, dramatic pause before starting");
  if (direction.emphasisWord) extraClauses.push(`emphasizing the word "${direction.emphasisWord}"`);

  if (toneClauses.length === 0 && extraClauses.length === 0) return null;

  const parts: string[] = [];
  parts.push(toneClauses.length > 0 ? `Say in a ${toneClauses.join(", ")} tone` : "Say");
  parts.push(...extraClauses);
  return parts.join(", ");
}

export interface GeminiDirectionInput {
  /** The exact string to send as the request's text part — the Director's instruction (if any) prefixed onto the sentence, or the plain sentence text unchanged for a fully neutral direction. */
  text: string;
}

export function toGeminiInput(direction: SentenceDirection, text: string): GeminiDirectionInput {
  const instruction = buildInstruction(direction);
  return { text: instruction ? `${instruction}: ${text}` : text };
}
