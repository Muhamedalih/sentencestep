/**
 * Shared types for the Voice Director — the layer that decides HOW a
 * Story/Conversation sentence should be spoken, before direction-to-tags.ts
 * turns that decision into an actual ElevenLabs request. Kept in its own
 * file, no SDK imports, so both director.ts (the Anthropic-backed producer)
 * and direction-to-tags.ts (the pure consumer) can import it without either
 * pulling in code it doesn't need — same separation as
 * src/lib/translation/provider.ts's input/output types living apart from
 * anthropic-provider.ts.
 */

/**
 * A closed, small set matching real, currently-documented eleven_v3 audio
 * tags only (https://elevenlabs.io/docs/best-practices/prompting/controls)
 * — never an open string. "neutral" carries no tag at all (see
 * direction-to-tags.ts) and must be the Director's default for ordinary
 * sentences: per the brief's own "do not over-act" rule, most sentences in
 * a natural story are neutral, not emotional.
 */
export type VoiceEmotion =
  | "neutral"
  | "excited"
  | "curious"
  | "sad"
  | "happy"
  | "whispering"
  | "sarcastic"
  | "angry"
  | "crying"
  | "mischievous"
  | "sighing"
  | "laughing";

export type VoiceEnergy = "low" | "medium" | "high";
export type VoicePace = "slow" | "normal" | "fast";
export type VoicePause = "none" | "short" | "long";

export interface SentenceDirection {
  sentenceId: string;
  emotion: VoiceEmotion;
  energy: VoiceEnergy;
  pace: VoicePace;
  /** Must be a literal substring of that sentence's own English text, or null — never invented (see director-validate.ts). */
  emphasisWord: string | null;
  pauseBefore: VoicePause;
}

export interface DirectorSentenceInput {
  id: string;
  en: string;
  /** Present only for Conversation lessons — helps the Director track which character is speaking across turns without changing its output shape. */
  speaker?: string | null;
}

export interface VoiceDirector {
  readonly name: string;
  /** Returns the provider's raw response, deliberately untyped as `unknown` — validated separately by director-validate.ts, exactly like TranslationProvider.translateLesson's contract. Throws on a genuine provider/network failure. */
  directStory(sentences: DirectorSentenceInput[]): Promise<unknown>;
}
