import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SingleWordRound, WORD_LIST_HREF } from "@/components/words/map/single-word-round";
import { isAdmin } from "@/lib/admin/access";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";
import { buildLadderWords } from "@/lib/word-ladder/build";
import { loadSpellingChecks } from "@/lib/word-ladder/load";
import { getWordGroupById } from "@/lib/word-lists";
import { getLearnerToday } from "@/lib/word-mastery/access";
import { resolveWordGroupPlaybackVoiceId } from "@/lib/voice/word-group-playback-voice";

/**
 * One word of the Map tab's word list (the wordsMap permission), played alone in the round's four
 * steps. Full-screen and outside the "(dashboard)" group, like today's session. The word's topic comes
 * in `?g=`; it is read again here and a word of a topic the learner may not open is never played (the
 * list does not link to it either), so the address cannot be used to get around a locked topic.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Word · Words" };

export default async function SingleWordPage({
  params,
  searchParams,
}: {
  params: Promise<{ wordId: string }>;
  searchParams: Promise<{ g?: string | string[] }>;
}) {
  const { wordId } = await params;
  const groupParam = (await searchParams).g;
  const groupId = Array.isArray(groupParam) ? groupParam[0] : groupParam;

  const [user, features, locale] = await Promise.all([
    getCurrentUser(),
    getEffectiveFeatures(),
    getLocale(),
  ]);
  if (!user) redirect("/login?next=/learn/word-lists?tab=map");
  if (!features.rollouts.wordsMap || !groupId) redirect("/learn/word-lists");

  const group = await getWordGroupById(groupId, locale ?? undefined);
  if (!group) redirect(WORD_LIST_HREF);

  const [isAdminUser, hasPremium] = await Promise.all([isAdmin(), hasPremiumAccess()]);
  // A word of a locked topic does not open: the learner is sent to the topic's own lock screen.
  if (!(group.isFree || hasPremium || isAdminUser)) redirect(`/learn/word-lists/${group.id}`);

  const [checks, defaultVoiceId, todayISO] = await Promise.all([
    loadSpellingChecks(),
    getDefaultPronunciationVoiceId(),
    getLearnerToday(),
  ]);
  const built = buildLadderWords(group.words, checks).find((word) => word.id === wordId);
  if (!built) redirect(WORD_LIST_HREF);

  const voiceId = (await resolveWordGroupPlaybackVoiceId(group, defaultVoiceId)) ?? null;
  return (
    <SingleWordRound
      word={{ ...built, topic: { id: group.id, title: group.title, voiceId } }}
      bankFeed={features.rollouts.wordBank}
      todayISO={todayISO}
    />
  );
}
