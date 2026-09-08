import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CurriculumRecyclingPanel } from "@/components/admin/curriculum-recycling-panel";
import { StoriesCurriculumContextPanel } from "@/components/admin/stories-curriculum-context-panel";
import { LessonForm } from "@/components/admin/lesson-form";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { computeRecyclingReport } from "@/lib/admin/curriculum-recycling";
import { computeStoryCurriculumContext } from "@/lib/admin/stories-curriculum-context";
import {
  getContentLessonById,
  getNormalCurriculumForRecycling,
  getStoriesCurriculumForAdvisory,
  listLevels,
} from "@/lib/admin/content-queries";
import { listEnabledLocales } from "@/lib/admin/translation-queries";
import { getVoices } from "@/lib/admin/voices-queries";
import { getElevenLabsVoices } from "@/lib/admin/elevenlabs-queries";
import { getSpeakerVoiceMap } from "@/lib/voice/speaker-voices";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Edit content",
};

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { lessonId } = await params;
  const [lesson, levels, voices, enabledLocales] = await Promise.all([
    getContentLessonById(lessonId),
    listLevels(),
    getVoices(),
    listEnabledLocales(),
  ]);
  if (!lesson) notFound();

  const [elevenlabsVoices, speakerVoiceMap] =
    lesson.mode === "conversation"
      ? await Promise.all([getElevenLabsVoices(), getSpeakerVoiceMap(lessonId)])
      : [[], {}];

  // Curriculum Recycling (Part 3) — Normal-mode only, since role-aware
  // establish/build/integrate interpretation only applies there. Read-only:
  // this only fetches and computes, never writes anything.
  const recyclingReport =
    lesson.mode === "normal"
      ? computeRecyclingReport(lessonId, await getNormalCurriculumForRecycling())
      : null;

  // Stories Curriculum Context (Stories pass) — Stories-mode only. Reuses
  // getNormalCurriculumForRecycling's output purely as reference vocabulary
  // (level + sentences) for the cross-mode comparison; never role-aware,
  // since Stories have no role. Read-only, same as above.
  const storyContext =
    lesson.mode === "stories"
      ? computeStoryCurriculumContext(
          lessonId,
          await getStoriesCurriculumForAdvisory(),
          await getNormalCurriculumForRecycling(),
        )
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Edit content</h1>
        <p className="text-muted-foreground mt-1">{lesson.title}</p>
      </div>
      {lesson.mode === "normal" && <CurriculumRecyclingPanel report={recyclingReport} />}
      {lesson.mode === "stories" && <StoriesCurriculumContextPanel context={storyContext} />}
      <LessonForm
        levels={levels}
        initial={lesson}
        voices={voices}
        enabledLocales={enabledLocales}
        elevenlabsVoices={elevenlabsVoices}
        speakerVoiceMap={speakerVoiceMap}
      />
    </div>
  );
}
