import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SessionRound } from "@/components/words/map/session-round";
import type { SessionWordInfo } from "@/components/words/map/session-round";
import { isAdmin } from "@/lib/admin/access";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";
import { buildLadderWords } from "@/lib/word-ladder/build";
import { loadSpellingChecks } from "@/lib/word-ladder/load";
import type { LadderWord } from "@/lib/word-ladder/types";
import { getWordGroupById } from "@/lib/word-lists";
import { getLearnerToday } from "@/lib/word-mastery/access";
import { resolveWordGroupPlaybackVoiceId } from "@/lib/voice/word-group-playback-voice";
import { loadSessionPick } from "@/lib/words-map/load";
import { wordsMapStrings } from "@/lib/words-map/strings";

/**
 * Today's session of the Map tab (the wordsMap permission): four new words from four topics, played
 * as the usual five-step round. Full-screen and outside the "(dashboard)" group, like a topic's own
 * round. The four are worked out again here, from the learner's own progress (the same rule the Map's
 * band used), so the page never trusts a list sent from the browser. force-dynamic: it depends on the
 * learner's progress, which changes after every round.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session · Words" };

export default async function WordsSessionPage() {
  const [user, features, locale] = await Promise.all([
    getCurrentUser(),
    getEffectiveFeatures(),
    getLocale(),
  ]);
  if (!user) redirect("/login?next=/learn/word-lists/session");
  if (!features.rollouts.wordsMap) redirect("/learn/word-lists");

  const s = wordsMapStrings(locale);
  const [isAdminUser, hasPremium, todayISO, checks, defaultVoiceId] = await Promise.all([
    isAdmin(),
    hasPremiumAccess(),
    getLearnerToday(),
    loadSpellingChecks(),
    getDefaultPronunciationVoiceId(),
  ]);
  const bankFeed = features.rollouts.wordBank;
  const { picked, topics } = await loadSessionPick({
    userId: user.id,
    isAdminUser,
    locale,
    hasPremium,
    bankOpen: bankFeed,
  });
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  // Each topic is read once (its words and its own sounds), then the picked words are taken out of it.
  const groupIds = [...new Set(picked.map((word) => word.groupId))];
  const groups = await Promise.all(groupIds.map((id) => getWordGroupById(id, locale ?? undefined)));
  const ladderByTopic = new Map<
    string,
    { words: Map<string, LadderWord>; voiceId: string | null }
  >();
  for (const group of groups) {
    if (!group || group.words.length === 0) continue;
    const voiceId = (await resolveWordGroupPlaybackVoiceId(group, defaultVoiceId)) ?? null;
    ladderByTopic.set(group.id, {
      words: new Map(buildLadderWords(group.words, checks).map((word) => [word.id, word])),
      voiceId,
    });
  }

  const words: LadderWord[] = [];
  const info: Record<string, SessionWordInfo> = {};
  for (const pick of picked) {
    const topic = topicById.get(pick.groupId);
    const built = ladderByTopic.get(pick.groupId)?.words.get(pick.id);
    // A locked topic or an unreadable word is left out rather than shown half-working.
    if (!topic || !built || !(topic.isFree || hasPremium || isAdminUser)) continue;
    words.push({
      ...built,
      topic: {
        id: topic.id,
        title: topic.title,
        voiceId: ladderByTopic.get(pick.groupId)?.voiceId ?? null,
      },
    });
    info[pick.id] = {
      reason: pick.reason,
      topicTitle: topic.title,
      topicLevel: topic.level,
      coverUrl: topic.coverUrl,
    };
  }

  if (words.length === 0) {
    return (
      <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground" dir="auto">
          {s.sessionEmpty}
        </p>
        <Link
          href="/learn/word-lists?tab=map"
          className="bg-primary text-primary-foreground rounded-[10px] px-6 py-2.5 text-sm font-semibold"
        >
          <span dir="auto">{s.back}</span>
        </Link>
      </div>
    );
  }

  return <SessionRound words={words} info={info} bankFeed={bankFeed} todayISO={todayISO} />;
}
