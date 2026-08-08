import type { LearningMode, Unit } from "@/types/content";

/**
 * Named units, one per difficulty level within a mode. Purely descriptive —
 * which lessons belong to a unit is still derived from LessonUnit.level, so
 * adding a new level to a lesson data file is enough to place it in a unit;
 * add a matching entry here to give that level a name.
 */
export const unitsByMode: Record<LearningMode, Unit[]> = {
  normal: [
    {
      id: "normal-unit-1",
      mode: "normal",
      level: 1,
      title: "Everyday Basics",
      titleAr: "أساسيات يومية",
      description: "Short, common sentences to get comfortable with English.",
    },
    {
      id: "normal-unit-2",
      mode: "normal",
      level: 2,
      title: "Daily Life",
      titleAr: "الحياة اليومية",
      description: "Everyday routines, people, and places.",
    },
    {
      id: "normal-unit-3",
      mode: "normal",
      level: 3,
      title: "Confident English",
      titleAr: "إنجليزية بثقة",
      description: "Longer sentences with more natural phrasing.",
    },
  ],
  stories: [
    {
      id: "stories-unit-1",
      mode: "stories",
      level: 1,
      title: "Gentle Beginnings",
      titleAr: "بدايات هادئة",
      description: "Short, easy stories to build reading confidence.",
    },
    {
      id: "stories-unit-2",
      mode: "stories",
      level: 2,
      title: "New Chapters",
      titleAr: "فصول جديدة",
      description: "Everyday moments with a bit more detail.",
    },
    {
      id: "stories-unit-3",
      mode: "stories",
      level: 3,
      title: "Everyday Adventures",
      titleAr: "مغامرات يومية",
      description: "Fuller scenes with richer vocabulary.",
    },
  ],
  conversation: [
    {
      id: "conversation-unit-1",
      mode: "conversation",
      level: 1,
      title: "Getting Started",
      titleAr: "البداية",
      description: "Simple, common exchanges.",
    },
    {
      id: "conversation-unit-2",
      mode: "conversation",
      level: 2,
      title: "Getting Around",
      titleAr: "التنقل",
      description: "Practical conversations for everyday situations.",
    },
    {
      id: "conversation-unit-3",
      mode: "conversation",
      level: 3,
      title: "Real Situations",
      titleAr: "مواقف حقيقية",
      description: "Longer, more natural dialogue.",
    },
  ],
};
