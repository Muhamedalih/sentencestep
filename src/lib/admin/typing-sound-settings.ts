import { DEFAULT_SOUND_PACK } from "@/lib/typing-sound-packs";
import type { SoundPack } from "@/lib/typing-sound-packs";
import {
  DEFAULT_SENTENCE_COMPLETE_SOUND,
  SENTENCE_COMPLETE_SOUND_NAMES,
} from "@/lib/sentence-complete-sounds";
import type { SentenceCompleteSound } from "@/lib/sentence-complete-sounds";
import { LEARNING_SECTION_NAMES } from "@/lib/admin/learning-sections";
import type { LearningSection } from "@/lib/admin/learning-sections";

/**
 * Shared shape for the admin-configured global typing sound (see
 * supabase/migrations/20250115000000_typing_sound_settings.sql and
 * 20250135000000_sentence_complete_sound.sql). Its own small module — no
 * Supabase imports — so both the server-only
 * typing-sound-queries.ts/typing-sound-actions.ts and the client-only
 * use-typing-sound.ts consumers / typing-sound-settings-form.tsx can import
 * the same type and defaults without either side pulling in code it can't
 * run. Mirrors src/lib/admin/voice-settings.ts.
 */
export interface TypingSoundSettings {
  enabled: boolean;
  soundPack: SoundPack;
  volume: number;
  /** Which sound plays once a whole sentence is typed correctly — independent of soundPack (see src/lib/sentence-complete-sounds.ts). This is the fallback every section without its own entry in sectionSentenceCompleteSounds uses (see resolveSectionSentenceCompleteSound). */
  sentenceCompleteSound: SentenceCompleteSound;
  /**
   * Per-section sentence-completion sound overrides (see LearningSection) —
   * only sections an admin has actually customized appear here. A missing
   * key means "use sentenceCompleteSound above," which is what keeps an
   * unconfigured install's every section behaving identically to before
   * this map existed. Ships with three sensible defaults (page-turn for
   * Book Reading, a softer whoosh for Stories, a snappy pop for Word Lists)
   * rather than all-empty, since these three were the ones explicitly asked
   * for; every other section (normal lessons, conversation, fix mistakes)
   * still falls through to the plain global default until an admin opts
   * them into something else.
   */
  sectionSentenceCompleteSounds: Partial<Record<LearningSection, SentenceCompleteSound>>;
}

export const DEFAULT_TYPING_SOUND_SETTINGS: TypingSoundSettings = {
  enabled: true,
  soundPack: DEFAULT_SOUND_PACK,
  volume: 0.6,
  sentenceCompleteSound: DEFAULT_SENTENCE_COMPLETE_SOUND,
  sectionSentenceCompleteSounds: {
    books: "pageTurn",
    stories: "whoosh",
    wordLists: "pop",
  },
};

export const TYPING_SOUND_VOLUME_RANGE = { min: 0, max: 1 };

const VALID_SECTIONS = new Set<string>(LEARNING_SECTION_NAMES);
const VALID_SOUNDS = new Set<string>(SENTENCE_COMPLETE_SOUND_NAMES);

/**
 * Clamps/sanitizes an arbitrary object into a valid section-sound override
 * map, dropping any unknown section key and any value that isn't a real
 * SentenceCompleteSound name — used by the save action so a malformed
 * payload can never corrupt the stored row or crash a learner-facing
 * playSentenceComplete() call. Mirrors sanitizeLessonColorSettings'
 * shape/rationale (src/lib/admin/lesson-color-settings.ts).
 */
export function sanitizeSectionSentenceCompleteSounds(
  input: unknown,
): Partial<Record<LearningSection, SentenceCompleteSound>> {
  if (typeof input !== "object" || input === null) return {};

  const result: Partial<Record<LearningSection, SentenceCompleteSound>> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!VALID_SECTIONS.has(key)) continue;
    if (typeof value !== "string" || !VALID_SOUNDS.has(value)) continue;
    result[key as LearningSection] = value as SentenceCompleteSound;
  }
  return result;
}

/**
 * Which sentence-completion sound a given section should actually play:
 * that section's own override if the admin set one, otherwise the plain
 * global default. Every playSentenceComplete() call site (lesson-session.tsx,
 * book-reading-session.tsx, vocabulary-practice.tsx, word-review-session.tsx,
 * fix-your-mistakes-session.tsx) resolves through this instead of reading
 * sectionSentenceCompleteSounds directly, so the fallback rule only ever
 * lives in one place.
 */
export function resolveSectionSentenceCompleteSound(
  settings: TypingSoundSettings,
  section: LearningSection,
): SentenceCompleteSound {
  return settings.sectionSentenceCompleteSounds[section] ?? settings.sentenceCompleteSound;
}
