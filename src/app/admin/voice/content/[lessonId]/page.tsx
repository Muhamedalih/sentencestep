import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { SentenceVoiceReview } from "@/components/admin/sentence-voice-review";
import { getLessonVoiceDetail } from "@/lib/admin/voice-generation-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Story Audio" };

export default async function AdminVoiceContentDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { lessonId } = await params;
  const detail = await getLessonVoiceDetail(lessonId);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{detail.title}</h1>
        <p className="text-muted-foreground mt-1">Per-sentence ElevenLabs audio status.</p>
      </div>
      <SentenceVoiceReview
        lessonId={detail.lessonId}
        statuses={detail.statuses}
        sentenceText={detail.sentenceText}
      />
    </div>
  );
}
