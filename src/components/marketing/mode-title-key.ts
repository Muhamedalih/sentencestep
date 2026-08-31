import type { Dictionary } from "@/lib/i18n/dictionary/types";
import type { LearningMode } from "@/types/content";

/** Reuses the sidebar's nav.* title keys (see learn-sidebar.tsx) for per-mode titles, rather than modeMeta's English-only title, so a page heading and the sidebar link never disagree in a support locale. Shared by the marketing page and the in-app mode/lesson-list page (see LessonListView's title prop). */
export const MODE_TITLE_KEY: Record<LearningMode, keyof Dictionary["nav"]> = {
  normal: "normalLessons",
  stories: "stories",
  conversation: "conversation",
};

/** Same reasoning as MODE_TITLE_KEY, for the translated per-mode description shown under that title. */
export const MODE_DESCRIPTION_KEY: Record<LearningMode, keyof Dictionary["marketing"]> = {
  normal: "normalModeDescription",
  stories: "storiesModeDescription",
  conversation: "conversationModeDescription",
};
