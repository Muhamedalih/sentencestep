/**
 * The boundary a real translation provider (Anthropic today, potentially
 * another vendor later) implements — mirrors src/lib/email/provider.ts's
 * shape exactly, for the same reason: the rest of the app (the generation
 * orchestration in generate.ts, and eventually the review dashboard and the
 * scheduled sweep) only ever calls through this interface, never a
 * provider's SDK directly. Adding or swapping a provider means writing one
 * adapter that implements this and registering it in provider-registry.ts.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface GlossaryTerm {
  term: string;
  /** How this term must be handled — "preserve" (never translate/transliterate, e.g. the product name) or "consistent" (may be transliterated, but the same way every time, e.g. a recurring character's name). */
  rule: "preserve" | "consistent";
  note?: string;
}

export interface TranslationSentenceInput {
  /** The sentence's real, deterministic id (e.g. "story-1-s3") — round-tripped back on the output so the caller never has to trust a model-invented id. */
  id: string;
  en: string;
  /**
   * The English vocabulary highlights this sentence has (from the sentence's
   * canonical word_translations source), in order — never invented by the
   * provider, only ever a subset of the words/phrases that literally appear
   * in `en`. Empty (not omitted) when this sentence has no word-level
   * vocabulary highlights, so every sentence in a batch has the same shape
   * and the provider's strict-mode schema never needs an optional field.
   */
  words: string[];
}

export interface LessonTranslationInput {
  targetLocale: SupportLocale;
  title: string;
  /** Null when the lesson has no description — the provider must return null back, not invent one. */
  description: string | null;
  /** In lesson order. The provider must preserve this order and translate every one — this is lesson-level batching, never a per-sentence call. */
  sentences: TranslationSentenceInput[];
  /** A short human-readable level hint (e.g. "Beginner"), when known — helps the model match sentence simplicity to the lesson's actual difficulty. Omitted when not available; never invented by the caller. */
  levelLabel?: string;
  glossary: GlossaryTerm[];
}

export interface TranslationWordOutput {
  /** Echoes one of the input sentence's `words` entries exactly, so the caller can match output back to the specific English phrase it translates without trusting positional order alone. */
  en: string;
  text: string;
}

export interface TranslationSentenceOutput {
  id: string;
  text: string;
  /** One entry per input `words` entry, same order, same length — empty when the input's `words` was empty. */
  words: TranslationWordOutput[];
}

export interface LessonTranslationOutput {
  title: string;
  description: string | null;
  sentences: TranslationSentenceOutput[];
}

export interface TranslationProvider {
  readonly name: string;
  /**
   * Returns the provider's raw response, deliberately untyped as `unknown`
   * rather than `LessonTranslationOutput` — the shape is untrusted model
   * output, not yet a validated LessonTranslationOutput. Every provider's
   * result goes through the exact same validateLessonTranslationOutput
   * (see validate.ts) in generate.ts before anything is trusted or written,
   * so validation logic lives in exactly one place regardless of how many
   * providers exist, rather than being duplicated (and potentially
   * drifting) per adapter. Throws on a genuine provider/network failure —
   * malformed-but-received output is a validate.ts concern, not this
   * layer's.
   */
  translateLesson(input: LessonTranslationInput): Promise<unknown>;
}
