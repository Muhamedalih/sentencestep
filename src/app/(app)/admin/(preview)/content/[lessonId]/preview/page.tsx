import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { LessonSession } from "@/components/learning/lesson-session";
import { Button } from "@/components/ui/button";
import { getContentLessonById } from "@/lib/admin/content-queries";
import { getDefaultVoiceId } from "@/lib/admin/voices-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveVoiceId } from "@/lib/voice/resolution";
import type { Lesson } from "@/types/content";

export const metadata: Metadata = {
  title: "Preview",
};

/**
 * Renders the exact learner-facing LessonSession/typing engine — no second
 * implementation — in previewMode, which suppresses progress/analytics/email
 * side effects so an admin clicking through a draft never pollutes their
 * own real learning history. It sits in the `(preview)` group, not the admin
 * console, so it is the learner's full screen with none of the admin bar.
 */
export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { lessonId } = await params;
  const [detail, defaultVoiceId] = await Promise.all([
    getContentLessonById(lessonId),
    getDefaultVoiceId(),
  ]);
  if (!detail) notFound();
  const resolvedVoiceId = resolveVoiceId(detail.voiceId, defaultVoiceId);

  const unit: Lesson = {
    id: detail.id,
    mode: detail.mode,
    level: detail.level,
    order: detail.orderIndex,
    title: detail.title,
    titleAr: detail.titleAr,
    isFree: detail.isFree,
    sentences: detail.sentences.map((sentence) => ({
      id: sentence.id,
      en: sentence.en,
      ar: sentence.ar,
      ...(sentence.speaker ? { speaker: sentence.speaker } : {}),
    })),
  };

  // The learner's frame: a full-viewport column, with the way back to the editor in a slim row
  // above the session (the session itself has no back link of its own).
  return (
    <div className="flex h-svh w-full flex-col">
      <div className="flex shrink-0 items-center px-6 pt-3 lg:px-16">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={`/admin/content/${detail.id}/edit`}>← Back to editor</Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <LessonSession unit={unit} previewMode resolvedVoiceId={resolvedVoiceId} />
      </div>
    </div>
  );
}
