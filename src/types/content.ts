export type LearningMode = "normal" | "stories" | "conversation";

export interface Sentence {
  id: string;
  /** The English text the learner types. */
  en: string;
  /** Arabic translation shown as context/support for the learner. */
  ar: string;
  /** Conversation speaker label (e.g. "A" / "B"), unused outside conversation mode. */
  speaker?: string;
  /** Pronunciation audio reference (Milestone 13). Null/absent is normal — the learner UI falls back to the browser's speech synthesis, so no sentence requires one. */
  audioUrl?: string | null;
  /** Word-by-word English→Arabic translation, in the same order as `en`'s whitespace-separated words — powers the current-word card. Hand-authored, not a mechanical split (English/Arabic word order and count rarely match). Absent for modes/content that don't have it yet (e.g. conversation). */
  wordTranslations?: { en: string; ar: string }[];
  /**
   * The sentence's translation in the request's active support locale
   * (see src/lib/i18n/content-translations.ts) — `ar` for Arabic
   * (identical to the `ar` field above), or the Spanish translation once
   * authored, with an English fallback (and a dev-only console warning) if
   * neither exists yet. Only populated when the fetch layer was given a
   * locale (see getLessons/getLessonById's optional `locale` parameter);
   * absent otherwise, in which case UI should fall back to `ar`/`en`
   * directly exactly as it always has. Additive and not yet consumed by
   * any learning-session component — see the localization checkpoint
   * report for why that migration is deliberately deferred.
   */
  supportText?: string;
  /** Same locale resolution as supportText, for the word-by-word gloss. */
  supportWordTranslations?: { en: string; text: string }[];
  /**
   * Story Vocabulary feature (see src/lib/content/story-vocabulary.ts) —
   * indices into `en`'s whitespace-split words (same indexing as
   * wordTranslations) that this story selected as its target vocabulary.
   * Populated only for stories-mode content, via buildStoryVocabulary/
   * withStoryVocabulary; absent for normal/conversation content and for
   * any story sentence with no target word in it. Purely additive —
   * every reader of it already treats absence as "no marker."
   */
  targetVocabularyIndices?: number[];
}

export interface LessonUnit {
  id: string;
  mode: LearningMode;
  /** Difficulty tier within the mode, lowest = easiest. */
  level: number;
  /** Display order within the mode, independent of level. */
  order: number;
  title: string;
  titleAr: string;
  /** Whether this unit is accessible without a subscription. */
  isFree: boolean;
  /** Admin-set lesson illustration (Supabase Storage public URL). Absent/null falls back to the built-in SVG scene — see LessonIllustration. */
  illustrationUrl?: string | null;
  /** Per-lesson voice override (see src/lib/voice/resolution.ts's resolveVoiceId). Absent/null means "use the global default voice." */
  voiceId?: string | null;
  /** Short English blurb shown on lesson cards — what the lesson is about, not its content. */
  description?: string;
  /** Arabic counterpart of `description`. */
  descriptionAr?: string;
  /** See Sentence.supportText's doc comment — same locale-resolution rules, for the lesson title. */
  supportTitle?: string;
  /** See Sentence.supportText's doc comment — same locale-resolution rules, for the lesson description. */
  supportDescription?: string;
  sentences: Sentence[];
}

// --- Curriculum hierarchy (Course > Unit > Lesson > Activity) ---
//
// This layers on top of LessonUnit/Sentence rather than replacing them:
// every existing component that accepts a LessonUnit keeps working
// unchanged when handed a Lesson, since Lesson is a LessonUnit plus a few
// optional fields. See src/lib/content.ts for how these are composed from
// the local seed (and, once linked, Supabase's levels/lessons tables —
// "Unit" here is the app-facing name for what that schema calls a level).

export interface VocabularyItem {
  id: string;
  en: string;
  ar: string;
  /** Spanish counterpart of `ar` — see PreviewSentence.es's doc comment: this recap list only ever comes from the static src/data/lessons/conversation.ts seed (fetchLessons/fetchLessonById never populate it from the DB), so its Spanish lives directly alongside `ar` here too. */
  es?: string;
  /** Turkish counterpart of `ar`/`es` — see PreviewSentence.tr's doc comment for the same optionality rationale. */
  tr?: string;
  /** See Sentence.supportText's doc comment — same locale-resolution rules; the field the UI actually reads. */
  supportText?: string;
}

export type ActivityType = "typing";

/** Sentence-by-sentence typing practice — the only activity type today. */
export interface TypingActivity {
  type: "typing";
  sentences: Sentence[];
}

/** A union so future activity types (e.g. listening, multiple choice) can be added without touching the lesson engine. */
export type LessonActivity = TypingActivity;

export interface Lesson extends LessonUnit {
  /** Key words worth calling out, shown as a recap on lesson completion. */
  vocabulary?: VocabularyItem[];
}

/** A short English→Arabic/Spanish example pair, standalone (not tied to a lesson/activity) — used for the "Start Simple" level previews below. */
export interface PreviewSentence {
  en: string;
  ar: string;
  /**
   * Only set on the static src/data/units.ts previews — these have no DB
   * row to back a content_translations lookup (they're the fixed fallback
   * used before an admin authors real ones, or when no Supabase project is
   * linked at all), so their Spanish lives directly alongside `ar` here,
   * the same place this file already keeps its own bilingual content.
   * Admin-authored previews (from the `levels` table) get their Spanish
   * from content_translations instead — see resolveWordArrayField.
   */
  es?: string;
  /** Turkish counterpart of `ar`/`es` — same static-fallback rationale as `es`'s doc comment. Optional: older static entries authored before Turkish onboarding have no `tr` yet, so resolveLevelSupportTitle/withSupportTextFallback fall back to English rather than assuming it's always present. */
  tr?: string;
  /** See Sentence.supportText's doc comment — same locale-resolution rules; the field the UI actually reads, resolved from `ar`/`es`/`tr` or content_translations depending on source. */
  supportText?: string;
}

export interface Unit {
  id: string;
  mode: LearningMode;
  /** Matches the level of the lessons that belong to it. */
  level: number;
  title: string;
  titleAr: string;
  /** Spanish counterpart of `title` — see PreviewSentence.es's doc comment for why this lives here rather than in content_translations: these 9 curriculum-tier labels have no DB row at all. */
  titleEs: string;
  description: string;
  descriptionAr: string;
  descriptionEs: string;
  /** A handful of example sentences that show what this level feels like — not lessons, just a taste. Admin-editable per level (see src/lib/admin/content-actions.ts's updateLevelPreview). */
  previewSentences?: PreviewSentence[];
}

export interface Course {
  id: LearningMode;
  title: string;
  description: string;
  units: Unit[];
}
