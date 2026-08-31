/**
 * The learner-facing "sections" an admin can assign a distinct typing sound
 * or font to (see typing-sound-settings.ts and lesson-font-settings.ts,
 * which both key their per-section override maps on this same type so the
 * two features share one roster instead of drifting apart). Deliberately
 * broader than LearningMode (src/types/content.ts), which only covers
 * normal/stories/conversation — "books" (book-reading-session.tsx) and
 * "wordLists" (vocabulary-practice.tsx/word-review-session.tsx) are
 * separate screens outside that type, and "fixMistakes"
 * (mistake-review-sentence.tsx) is a fourth screen outside it too.
 */
export type LearningSection =
  "normal" | "stories" | "conversation" | "books" | "wordLists" | "fixMistakes";

export const LEARNING_SECTION_NAMES: LearningSection[] = [
  "normal",
  "stories",
  "conversation",
  "books",
  "wordLists",
  "fixMistakes",
];

export const LEARNING_SECTION_LABELS: Record<LearningSection, string> = {
  normal: "Normal lessons",
  stories: "Stories",
  conversation: "Conversation",
  books: "Book reading",
  wordLists: "Word lists",
  fixMistakes: "Fix your mistakes",
};
