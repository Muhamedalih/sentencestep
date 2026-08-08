import type { LearningMode, Lesson } from "@/types/content";

import { conversationLessons } from "@/data/lessons/conversation";
import { normalLessons } from "@/data/lessons/normal";
import { storyLessons } from "@/data/lessons/stories";

/**
 * Local dev/test seed data. This is read through src/lib/content.ts, not
 * imported directly — that's the one place the rest of the app goes for
 * lesson content, so it can transparently swap to Supabase later.
 */
export const lessonsByMode: Record<LearningMode, Lesson[]> = {
  normal: normalLessons,
  stories: storyLessons,
  conversation: conversationLessons,
};
