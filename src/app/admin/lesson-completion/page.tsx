import type { Metadata } from "next";

import { LessonCompletionCustomizer } from "@/components/admin/lesson-completion-customizer";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { getLessonCompletionTheme } from "@/lib/admin/lesson-completion-theme-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Lesson completion",
};

export default async function AdminLessonCompletionPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const theme = await getLessonCompletionTheme();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Lesson completion</h1>
        <p className="text-muted-foreground mt-1">
          Visually customize colors, typography, spacing, and effects on the end-of-lesson screen
          learners see. Changes below preview live and only apply to learners once saved.
        </p>
      </div>
      <LessonCompletionCustomizer initial={theme} />
    </div>
  );
}
