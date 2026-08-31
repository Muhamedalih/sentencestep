"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_TYPING_SOUND_SETTINGS } from "@/lib/admin/typing-sound-settings";
import type { TypingSoundSettings } from "@/lib/admin/typing-sound-settings";

const TypingSoundSettingsContext = createContext<TypingSoundSettings>(
  DEFAULT_TYPING_SOUND_SETTINGS,
);

/** Makes the admin-configured typing sound (resolved server-side, see src/app/learn/layout.tsx) available to client components — see useTypingSound, consumed by LessonSession. */
export function TypingSoundSettingsProvider({
  settings,
  children,
}: {
  settings: TypingSoundSettings;
  children: ReactNode;
}) {
  return (
    <TypingSoundSettingsContext.Provider value={settings}>
      {children}
    </TypingSoundSettingsContext.Provider>
  );
}

export function useTypingSoundSettings(): TypingSoundSettings {
  return useContext(TypingSoundSettingsContext);
}
