export type LearningMode = "normal" | "stories" | "conversation";

export interface Sentence {
  id: string;
  /** The English text the learner types. */
  en: string;
  /** Arabic translation shown as context/support for the learner. */
  ar: string;
  /** Conversation speaker label (e.g. "A" / "B"), unused outside conversation mode. */
  speaker?: string;
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

export interface Unit {
  id: string;
  mode: LearningMode;
  /** Matches the level of the lessons that belong to it. */
  level: number;
  title: string;
  titleAr: string;
  description: string;
}

export interface Course {
  id: LearningMode;
  title: string;
  description: string;
  units: Unit[];
}
