import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VocabularyPractice } from "@/components/learning/vocabulary-practice";
import { WordGroupLocked } from "@/components/learning/word-group-locked";
import { WordGroupUnavailable } from "@/components/learning/word-group-unavailable";
import { isAdmin } from "@/lib/admin/access";
import { getDefaultVoiceId } from "@/lib/admin/voices-queries";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLocale } from "@/lib/i18n/get-locale";
import { getWordGroupById } from "@/lib/word-lists";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";

/**
 * Full-screen practice route, deliberately outside the "(dashboard)" route
 * group — same reasoning as /learn/[mode]/[lessonId]: no header/sidebar
 * chrome competing with the exercise. force-dynamic for the same
 * stale-premium-cache reason documented on that route and on
 * /learn/word-lists's list page.
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

export default async function WordGroupPracticePage({
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

  // canAccess only confirms the page-level gate; the words themselves are
  // separately protected by the database's own row-level security (see
  // fetchWordGroupById's doc comment), which can come back empty even when
  // canAccess is true — render that honestly instead of a broken "0 / 0"
  // practice session.
  if (group.words.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <WordGroupUnavailable title={group.title} />
      </div>
    );
  }

  const defaultVoiceId = await getDefaultVoiceId();

  // Same fix as LessonPage's identical pre-resolution: only the first
  // word, cache-only (never triggers Kokoro generation), so a miss just
  // leaves the word to resolve on demand exactly as before.
  const firstWord = group.words[0];
  const words =
    firstWord && !firstWord.audioUrl && defaultVoiceId
      ? [
          {
            ...firstWord,
            audioUrl: await lookupCachedAudioUrl(firstWord.targetWord, defaultVoiceId),
          },
          ...group.words.slice(1),
        ]
      : group.words;

  return <VocabularyPractice group={{ ...group, words }} defaultVoiceId={defaultVoiceId} />;
}
