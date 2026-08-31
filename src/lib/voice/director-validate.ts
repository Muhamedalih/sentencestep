import type {
  SentenceDirection,
  VoiceEmotion,
  VoiceEnergy,
  VoicePace,
  VoicePause,
} from "@/lib/voice/director-types";

/** Kept in sync with director.ts's EMOTIONS tool-schema enum by hand — both are small, closed, and change together deliberately (a new tag needs verifying against ElevenLabs' current docs before being added to either). */
const EMOTIONS: ReadonlySet<VoiceEmotion> = new Set([
  "neutral",
  "excited",
  "curious",
  "sad",
  "happy",
  "whispering",
  "sarcastic",
  "angry",
  "crying",
  "mischievous",
  "sighing",
  "laughing",
]);
const ENERGIES: ReadonlySet<VoiceEnergy> = new Set(["low", "medium", "high"]);
const PACES: ReadonlySet<VoicePace> = new Set(["slow", "normal", "fast"]);
const PAUSES: ReadonlySet<VoicePause> = new Set(["none", "short", "long"]);

export interface ExpectedDirectionShape {
  /** In story order — the real, deterministic sentence ids, never trusted from the model. */
  sentenceIds: string[];
  /** Keyed by sentence id — each sentence's own English text, checked against emphasisWord. */
  textById: Map<string, string>;
}

export type DirectionValidation =
  { valid: true; value: SentenceDirection[] } | { valid: false; errors: string[] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Structural validation of the Voice Director's raw tool output, mirroring
 * src/lib/translation/validate.ts's philosophy exactly: reject-on-doubt,
 * never best-effort-coerce. A malformed or invented direction written into
 * voice_audio_cache would silently mis-voice a sentence forever (until
 * someone notices by ear) — far worse than a generation attempt that fails
 * loudly and leaves the sentence without expressive audio (falling back to
 * the existing speech-synthesis path) until retried.
 */
export function validateVoiceDirectionOutput(
  output: unknown,
  expected: ExpectedDirectionShape,
): DirectionValidation {
  const errors: string[] = [];

  if (!isPlainObject(output)) {
    return { valid: false, errors: ["Response was not a JSON object."] };
  }

  const sentences = output.sentences;
  if (!Array.isArray(sentences)) {
    return { valid: false, errors: ["Missing sentences array."] };
  }

  if (sentences.length !== expected.sentenceIds.length) {
    errors.push(
      `Expected ${expected.sentenceIds.length} sentence directions, got ${sentences.length}.`,
    );
  }

  const seenIds = new Set<string>();
  const valid: SentenceDirection[] = [];
  let orderMatches = sentences.length === expected.sentenceIds.length;

  sentences.forEach((entry, index) => {
    if (!isPlainObject(entry) || typeof entry.sentenceId !== "string") {
      errors.push(`Direction at index ${index} is malformed.`);
      orderMatches = false;
      return;
    }
    const { sentenceId } = entry;

    if (seenIds.has(sentenceId)) {
      errors.push(`Duplicate sentenceId "${sentenceId}" in response.`);
    }
    seenIds.add(sentenceId);

    if (orderMatches && expected.sentenceIds[index] !== sentenceId) {
      orderMatches = false;
    }

    const emotion = entry.emotion;
    if (typeof emotion !== "string" || !EMOTIONS.has(emotion as VoiceEmotion)) {
      errors.push(`Sentence "${sentenceId}": invalid emotion "${String(emotion)}".`);
      return;
    }
    const energy = entry.energy;
    if (typeof energy !== "string" || !ENERGIES.has(energy as VoiceEnergy)) {
      errors.push(`Sentence "${sentenceId}": invalid energy "${String(energy)}".`);
      return;
    }
    const pace = entry.pace;
    if (typeof pace !== "string" || !PACES.has(pace as VoicePace)) {
      errors.push(`Sentence "${sentenceId}": invalid pace "${String(pace)}".`);
      return;
    }
    const pauseBefore = entry.pauseBefore;
    if (typeof pauseBefore !== "string" || !PAUSES.has(pauseBefore as VoicePause)) {
      errors.push(`Sentence "${sentenceId}": invalid pauseBefore "${String(pauseBefore)}".`);
      return;
    }

    const rawEmphasis = entry.emphasisWord;
    let emphasisWord: string | null = null;
    if (rawEmphasis !== null) {
      if (typeof rawEmphasis !== "string" || rawEmphasis.trim().length === 0) {
        errors.push(`Sentence "${sentenceId}": emphasisWord must be a non-empty string or null.`);
        return;
      }
      const sourceText = expected.textById.get(sentenceId);
      if (sourceText === undefined || !sourceText.includes(rawEmphasis)) {
        errors.push(
          `Sentence "${sentenceId}": emphasisWord "${rawEmphasis}" is not a literal substring of its English text.`,
        );
        return;
      }
      emphasisWord = rawEmphasis;
    }

    valid.push({
      sentenceId,
      emotion: emotion as VoiceEmotion,
      energy: energy as VoiceEnergy,
      pace: pace as VoicePace,
      emphasisWord,
      pauseBefore: pauseBefore as VoicePause,
    });
  });

  const expectedIdSet = new Set(expected.sentenceIds);
  const missingIds = expected.sentenceIds.filter((id) => !seenIds.has(id));
  const unexpectedIds = [...seenIds].filter((id) => !expectedIdSet.has(id));
  if (missingIds.length > 0)
    errors.push(`Missing direction for sentence id(s): ${missingIds.join(", ")}.`);
  if (unexpectedIds.length > 0) {
    errors.push(`Unexpected sentence id(s) not in the source story: ${unexpectedIds.join(", ")}.`);
  }
  if (!orderMatches && missingIds.length === 0 && unexpectedIds.length === 0) {
    errors.push("Sentence order does not match the source story's order.");
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, value: valid };
}
