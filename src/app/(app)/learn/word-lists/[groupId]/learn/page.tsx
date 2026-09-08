import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VocabularyLearn } from "@/components/learning/vocabulary-learn";
import { WordGroupLocked } from "@/components/learning/word-group-locked";
import { WordGroupUnavailable } from "@/components/learning/word-group-unavailable";
import { isAdmin } from "@/lib/admin/access";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLocale } from "@/lib/i18n/get-locale";
import { getWordGroupById } from "@/lib/word-lists";

/**
 * Full-screen Learn (flashcard/study) route for one word group — the
 * chooser's other destination alongside the practice route one level up
 * (.../[groupId]). Same "no header/sidebar chrome" reasoning as that route;
 * see its own doc comment. Deliberately its own page rather than a query
 * param on the practice route: the two are different exercises (browse vs.
 * recall), not two view states of the same screen, so keeping the access
 * gating duplicated-but-simple here reads clearer than one page branching
 * on a `mode` param to decide which of two very different bodies to render.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;
  const group = await getWordGroupById(groupId);
  return { title: group ? `${group.title} · Word Lists` : "Word Lists" };
}

export default async function WordGroupLearnPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const locale = await getLocale();
  const group = await getWordGroupById(groupId, locale ?? undefined);
  if (!group) notFound();

  const canAccess =
    group.isFree || (await Promise.all([hasPremiumAccess(), isAdmin()])).some(Boolean);
  if (!canAccess) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <WordGroupLocked title={group.title} supportTitle={group.supportTitle} />
      </div>
    );
  }

  if (group.words.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <WordGroupUnavailable title={group.title} />
      </div>
    );
  }

  const defaultVoiceId = await getDefaultPronunciationVoiceId();

  return <VocabularyLearn group={group} defaultVoiceId={defaultVoiceId} />;
}
