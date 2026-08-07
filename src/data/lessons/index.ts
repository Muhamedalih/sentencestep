import type { LearningMode, LessonUnit } from "@/types/content";

import { conversationLessons } from "@/data/lessons/conversation";
import { normalLessons } from "@/data/lessons/normal";
import { storyLessons } from "@/data/lessons/stories";

export const lessonsByMode: Record<LearningMode, LessonUnit[]> = {
  normal: normalLessons,
  stories: storyLessons,
  conversation: conversationLessons,
};

export function getLessons(mode: LearningMode): LessonUnit[] {
  return lessonsByMode[mode];
}

export function getFreeLessons(mode: LearningMode): LessonUnit[] {
  return lessonsByMode[mode].filter((unit) => unit.isFree);
}

export function getLessonById(mode: LearningMode, id: string): LessonUnit | undefined {
  return lessonsByMode[mode].find((unit) => unit.id === id);
}

export function getLevels(mode: LearningMode): number[] {
  const levels = new Set(lessonsByMode[mode].map((unit) => unit.level));
  return Array.from(levels).sort((a, b) => a - b);
}

export function getLessonsByLevel(mode: LearningMode, level: number): LessonUnit[] {
  return lessonsByMode[mode].filter((unit) => unit.level === level);
}

export function getSentenceCount(mode: LearningMode): number {
  return lessonsByMode[mode].reduce((total, unit) => total + unit.sentences.length, 0);
}

export { conversationLessons, normalLessons, storyLessons };
