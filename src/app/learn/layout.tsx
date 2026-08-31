import type { ReactNode } from "react";

import { AuthUserProvider } from "@/components/providers/auth-user-provider";
import { LessonCompletionThemeProvider } from "@/components/providers/lesson-completion-theme-provider";
import { LessonFontSettingsProvider } from "@/components/providers/lesson-font-settings-provider";
import { PronunciationSettingsProvider } from "@/components/providers/pronunciation-settings-provider";
import { TypingSoundSettingsProvider } from "@/components/providers/typing-sound-settings-provider";
import { VoiceSettingsProvider } from "@/components/providers/voice-settings-provider";
import { buildLessonColorCss } from "@/lib/admin/lesson-color-settings";
import { getLessonColorSettings } from "@/lib/admin/lesson-color-settings-queries";
import { getLessonCompletionTheme } from "@/lib/admin/lesson-completion-theme-queries";
import { getLessonFontSettings } from "@/lib/admin/lesson-font-queries";
import { getTypingSoundSettings } from "@/lib/admin/typing-sound-queries";
import { getVoiceSettings } from "@/lib/admin/voice-queries";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * Shared across every /learn/* route, including the full-screen lesson
 * player at /learn/[mode]/[lessonId] — only context providers live here
 * (auth id, voice settings, typing sound settings, pronunciation
 * speed/Shift-replay state), never dashboard chrome. The header/sidebar are
 * scoped to the "(dashboard)" route group instead (see
 * src/app/learn/(dashboard)/layout.tsx) precisely so the lesson player,
 * which sits outside that group, can render with no header or sidebar at
 * all.
 */
export default async function LearnLayout({ children }: { children: ReactNode }) {
  const [
    user,
    voiceSettings,
    typingSoundSettings,
    lessonCompletionTheme,
    lessonColorSettings,
    lessonFontSettings,
  ] = await Promise.all([
    getCurrentUser(),
    getVoiceSettings(),
    getTypingSoundSettings(),
    getLessonCompletionTheme(),
    getLessonColorSettings(),
    getLessonFontSettings(),
  ]);
  const lessonColorCss = buildLessonColorCss(lessonColorSettings);

  return (
    <>
      {/* Next.js hoists <link> tags rendered anywhere in the tree into the
          document <head> — this doesn't need to live in the root layout.
          Pronunciation audio is served from Supabase Storage, a different
          origin than the app itself; without this, the very first clip a
          learner hears pays a full cold DNS+TCP+TLS handshake to that
          origin on top of the download itself (measured: ~670ms from
          play() to audible for an already-resolved URL, on a fresh
          connection). Preconnecting while the rest of the page is still
          loading overlaps that handshake with work already happening, so
          by the time any PronunciationButton actually requests a clip only
          the GET itself remains. */}
      {process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          crossOrigin="anonymous"
        />
      )}
      {/* Admin -> Color Settings overrides (see lesson-color-settings.ts) —
          only the roles an admin has actually changed get declared here, so
          an unconfigured project falls straight through to globals.css's own
          .lesson-shell defaults. Scoped to the .lesson-shell class only
          (never :root), so this can't recolor the dashboard or marketing
          pages, and applying it here (not per-route) means a color change
          takes effect for every learner on next load — no rebuild/redeploy
          needed. */}
      {lessonColorCss && <style>{lessonColorCss}</style>}
      <AuthUserProvider userId={user?.id ?? null}>
        <VoiceSettingsProvider settings={voiceSettings}>
          <TypingSoundSettingsProvider settings={typingSoundSettings}>
            <LessonFontSettingsProvider settings={lessonFontSettings}>
              <LessonCompletionThemeProvider theme={lessonCompletionTheme}>
                <PronunciationSettingsProvider>{children}</PronunciationSettingsProvider>
              </LessonCompletionThemeProvider>
            </LessonFontSettingsProvider>
          </TypingSoundSettingsProvider>
        </VoiceSettingsProvider>
      </AuthUserProvider>
    </>
  );
}
