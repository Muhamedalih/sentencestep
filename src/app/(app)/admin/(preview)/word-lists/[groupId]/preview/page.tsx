import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { VocabularyPractice } from "@/components/learning/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { getWordGroupByIdAdmin } from "@/lib/admin/word-lists-queries";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { isPassageWordGroupId } from "@/lib/passages/ids";
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
 * It sits in the `(preview)` group, not the admin console, so it is the
 * learner's full screen with none of the admin bar around it.
 */
export default async function AdminWordGroupPreviewPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { groupId } = await params;
  const [detail, siteDefaultVoiceId, locale] = await Promise.all([
    getWordGroupByIdAdmin(groupId),
    getDefaultPronunciationVoiceId(),
    getLocale(),
  ]);
  if (!detail) notFound();
  const backLink = { href: `/admin/word-lists/${detail.id}/edit`, label: "Back to editor" };
  if (detail.words.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={backLink.href}>← {backLink.label}</Link>
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
      // The meaning a learner sees next to the word (Arabic only here — the other languages come from the translations table).
      ...(locale === "ar" ? { supportHint: word.hintAr } : {}),
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

  // The learner's screen as it is — the layout around it (admin/(preview)/layout.tsx) draws no
  // admin bar. A passage's word lesson leads back to the Passages list, as it does for a learner;
  // any other group's back links lead to the editor instead of the learner's list.
  return (
    <VocabularyPractice
      group={group}
      previewMode
      backLink={isPassageWordGroupId(detail.id) ? undefined : backLink}
      defaultVoiceId={defaultVoiceId}
    />
  );
}
