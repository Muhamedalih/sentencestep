import type { ReactNode } from "react";

import { AuthUserProvider } from "@/components/providers/auth-user-provider";
import { FeatureProvider } from "@/components/providers/feature-provider";
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
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getVoiceSettings } from "@/lib/admin/voice-queries";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * Everything a learner screen needs around it: the context providers (auth id,
 * features, voice settings, typing sound settings, fonts, the completion theme,
 * pronunciation speed and Shift-replay) and the colour overrides an admin
 * tuned. Never dashboard chrome.
 *
 * It is shared by /learn/* (learn/layout.tsx) and by the admin previews
 * (admin/(preview)/layout.tsx), so an admin previewing a draft lesson, section
 * or word group sees exactly what a learner sees — the same colours, fonts,
 * sounds and Shift replay — and not a look-alike rendered without them.
 * `asGuest` is for the previews: nothing in them is tied to the admin's own
 * account (they already skip every write; this keeps them from even knowing who
 * is looking).
 */
export async function LearnerProviders({
  children,
  asGuest = false,
}: {
  children: ReactNode;
  asGuest?: boolean;
}) {
  const [
    user,
    voiceSettings,
    typingSoundSettings,
    lessonCompletionTheme,
    lessonColorSettings,
    lessonFontSettings,
    features,
  ] = await Promise.all([
    asGuest ? Promise.resolve(null) : getCurrentUser(),
    getVoiceSettings(),
    getTypingSoundSettings(),
    getLessonCompletionTheme(),
    getLessonColorSettings(),
    getLessonFontSettings(),
    getEffectiveFeatures(),
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
        <FeatureProvider features={features}>
          <VoiceSettingsProvider settings={voiceSettings}>
            <TypingSoundSettingsProvider settings={typingSoundSettings}>
              <LessonFontSettingsProvider settings={lessonFontSettings}>
                <LessonCompletionThemeProvider theme={lessonCompletionTheme}>
                  <PronunciationSettingsProvider>{children}</PronunciationSettingsProvider>
                </LessonCompletionThemeProvider>
              </LessonFontSettingsProvider>
            </TypingSoundSettingsProvider>
          </VoiceSettingsProvider>
        </FeatureProvider>
      </AuthUserProvider>
    </>
  );
}
