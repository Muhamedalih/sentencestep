import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VocabularyPractice } from "@/components/learning/vocabulary-practice";
import { WordGroupCaughtUp } from "@/components/learning/word-group-caught-up";
import { WordGroupLocked } from "@/components/learning/word-group-locked";
import { WordGroupUnavailable } from "@/components/learning/word-group-unavailable";
import { isAdmin } from "@/lib/admin/access";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLocale } from "@/lib/i18n/get-locale";
import { getWordGroupById } from "@/lib/word-lists";
import { getLearnerToday, getSmartWordsAccess } from "@/lib/word-mastery/access";
import { readMasteryStates } from "@/lib/word-mastery/queue";
import { selectContinueWords } from "@/lib/word-mastery/schedule";
import type { SmartPracticeConfig } from "@/lib/word-mastery/smart";
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

/**
 * `?scope=all` practices every word of the group instead of only the ones that
 * are new or due. It only matters while "Smart word practice" is open to the
 * visitor (an admin preview, or On for everyone) — otherwise it is ignored and
 * the page is the practice it always was.
 */
export default async function WordGroupPracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { groupId } = await params;
  const { scope } = await searchParams;
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

  // Smart word practice: the visitor's own switch (Off / Admin preview / On),
  // resolved once. When it is open and the learner has an account, "Continue"
  // asks only the words that are due or not met yet — the first ones that are
  // not locked in, instead of word 1 every time.
  const access = await getSmartWordsAccess();
  let practiceWords = group.words;
  let smart: SmartPracticeConfig | null = null;
  if (access.enabled) {
    smart = { spaced: access.spaced };
    if (access.spaced && access.userId && scope !== "all") {
      const [states, today] = await Promise.all([
        readMasteryStates(access.userId),
        getLearnerToday(),
      ]);
      const pick = selectContinueWords(group.words, states, today);
      if (pick.words.length === 0) {
        const dueDates = group.words
          .map((word) => states.get(word.id)?.dueOn)
          .filter((dueOn): dueOn is string => dueOn !== undefined)
          .sort();
        return (
          <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
            <WordGroupCaughtUp
              groupId={group.id}
              title={group.title}
              nextDueISO={dueDates[0] ?? null}
            />
          </div>
        );
      }
      practiceWords = pick.words;
    }
  }

  // Shared with Normal lessons & Mistake Review, isolated from
  // Stories/Conversation's own default (see word-list-voice-generation.ts's
  // own doc comment).
  const defaultVoiceId = await getDefaultPronunciationVoiceId();

  // Same fix as LessonPage's identical pre-resolution: only the first
  // word, cache-only, so a miss just leaves the word to resolve on demand
  // exactly as before.
  const firstWord = practiceWords[0];
  const words =
    firstWord && !firstWord.audioUrl && defaultVoiceId
      ? [
          {
            ...firstWord,
            audioUrl: await lookupCachedAudioUrl(firstWord.targetWord, defaultVoiceId),
          },
          ...practiceWords.slice(1),
        ]
      : practiceWords;

  return (
    <VocabularyPractice group={{ ...group, words }} defaultVoiceId={defaultVoiceId} smart={smart} />
  );
}
