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
