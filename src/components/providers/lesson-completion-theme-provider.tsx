"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_LESSON_COMPLETION_THEME } from "@/lib/admin/lesson-completion-theme";
import type { LessonCompletionTheme } from "@/lib/admin/lesson-completion-theme";

const LessonCompletionThemeContext = createContext<LessonCompletionTheme>(
  DEFAULT_LESSON_COMPLETION_THEME,
);

/**
 * Makes the admin-configured Lesson Completion theme (resolved server-side,
 * see src/app/learn/layout.tsx) available to LessonCompletion. Nesting a
 * second provider closer to the tree overrides the outer one — that's how
 * the admin customizer's live preview applies in-progress (unsaved) edits
 * without needing a second copy of LessonCompletion: see
 * src/components/admin/lesson-completion-customizer.tsx.
 */
export function LessonCompletionThemeProvider({
  theme,
  children,
}: {
  theme: LessonCompletionTheme;
  children: ReactNode;
}) {
  return (
    <LessonCompletionThemeContext.Provider value={theme}>
      {children}
    </LessonCompletionThemeContext.Provider>
  );
}

export function useLessonCompletionTheme(): LessonCompletionTheme {
  return useContext(LessonCompletionThemeContext);
}
