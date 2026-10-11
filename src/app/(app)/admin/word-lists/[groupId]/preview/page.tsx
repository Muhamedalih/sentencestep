import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { VocabularyPractice } from "@/components/learning/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { getWordGroupByIdAdmin } from "@/lib/admin/word-lists-queries";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveWordGroupPlaybackVoiceId } from "@/lib/voice/word-group-playback-voice";
import type { WordGroup } from "@/types/word-lists";

export const metadata: Metadata = {
  title: "Preview",
};

/**
 * Renders the exact learner-facing VocabularyPractice — no second
 * implementation — in previewMode (see that component's own doc comment),
 * which skips marking words as reviewed so an admin clicking through a
 * draft group never pollutes a real learner's mistake/review ledger.
 */
export default async function AdminWordGroupPreviewPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { groupId } = await params;
  const [detail, siteDefaultVoiceId] = await Promise.all([
    getWordGroupByIdAdmin(groupId),
    getDefaultPronunciationVoiceId(),
  ]);
  if (!detail) notFound();
  if (detail.words.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={`/admin/word-lists/${detail.id}/edit`}>← Back to editor</Link>
        </Button>
        <p className="text-muted-foreground">This group has no words yet — nothing to preview.</p>
      </div>
    );
  }

  const group: WordGroup = {
    id: detail.id,
    level: detail.level,
    order: detail.orderIndex,
    title: detail.title,
    titleAr: detail.titleAr,
    description: detail.description ?? undefined,
    descriptionAr: detail.descriptionAr ?? undefined,
    isFree: detail.isFree,
    words: detail.words.map((word) => ({
      id: word.id,
      groupId: word.groupId,
      order: word.orderIndex,
      targetWord: word.targetWord,
      sentence: word.sentence,
      hintAr: word.hintAr,
      ipa: word.ipa ?? word.suggestedIpa,
    })),
  };

  // The voice learners hear for this group — its own once every word is ready
  // in it, else the Word Lists default (the Stories default this used to
  // read isn't what Word Lists audio is generated with).
  const defaultVoiceId = await resolveWordGroupPlaybackVoiceId(
    { voiceId: detail.voiceId ?? undefined, words: group.words },
    siteDefaultVoiceId,
  );

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={`/admin/word-lists/${detail.id}/edit`}>← Back to editor</Link>
      </Button>
      <VocabularyPractice group={group} previewMode defaultVoiceId={defaultVoiceId} />
    </div>
  );
}
