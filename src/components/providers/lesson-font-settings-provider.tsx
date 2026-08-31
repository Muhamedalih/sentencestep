"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_LESSON_FONT_SETTINGS } from "@/lib/admin/lesson-font-settings";
import type { LessonFontSettings } from "@/lib/admin/lesson-font-settings";

const LessonFontSettingsContext = createContext<LessonFontSettings>(DEFAULT_LESSON_FONT_SETTINGS);

/** Makes the admin-configured per-section font overrides (resolved server-side, see src/app/learn/layout.tsx) available to client components — see resolveSectionFontFamily, consumed by TypingSentence/BookSentenceReader/VocabularyPractice/WordReviewSession/MistakeReviewSentence. */
export function LessonFontSettingsProvider({
  settings,
  children,
}: {
  settings: LessonFontSettings;
  children: ReactNode;
}) {
  return (
    <LessonFontSettingsContext.Provider value={settings}>
      {children}
    </LessonFontSettingsContext.Provider>
  );
}

export function useLessonFontSettings(): LessonFontSettings {
  return useContext(LessonFontSettingsContext);
}
