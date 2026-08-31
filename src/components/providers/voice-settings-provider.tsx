"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_VOICE_SETTINGS } from "@/lib/admin/voice-settings";
import type { VoiceSettings } from "@/lib/admin/voice-settings";

const VoiceSettingsContext = createContext<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

/** Makes the admin-configured default voice (resolved server-side, see src/app/learn/layout.tsx) available to client components — see useSpeech, which matches it against the device's own live voice list. */
export function VoiceSettingsProvider({
  settings,
  children,
}: {
  settings: VoiceSettings;
  children: ReactNode;
}) {
  return <VoiceSettingsContext.Provider value={settings}>{children}</VoiceSettingsContext.Provider>;
}

export function useVoiceSettings(): VoiceSettings {
  return useContext(VoiceSettingsContext);
}
