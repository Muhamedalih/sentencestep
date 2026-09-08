import type { Metadata } from "next";

import { LessonForm } from "@/components/admin/lesson-form";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { listLevels } from "@/lib/admin/content-queries";
import { listEnabledLocales } from "@/lib/admin/translation-queries";
import { getVoices } from "@/lib/admin/voices-queries";
import { isLearningMode } from "@/lib/learning-modes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LearningMode } from "@/types/content";

export const metadata: Metadata = {
  title: "New content",
};

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { mode } = await searchParams;
  const defaultMode: LearningMode | undefined = mode && isLearningMode(mode) ? mode : undefined;
  const [levels, voices, enabledLocales] = await Promise.all([
    listLevels(),
    getVoices(),
    listEnabledLocales(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New content</h1>
        <p className="text-muted-foreground mt-1">
          Create an ordinary lesson, story, or conversation.
        </p>
      </div>
      <LessonForm
        levels={levels}
        defaultMode={defaultMode}
        voices={voices}
        enabledLocales={enabledLocales}
      />
    </div>
  );
}
