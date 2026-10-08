import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VocabularyPractice } from "@/components/learning/vocabulary-practice";
import { WordGroupLocked } from "@/components/learning/word-group-locked";
import { WordGroupUnavailable } from "@/components/learning/word-group-unavailable";
import { getFromMonthlyPrice } from "@/lib/billing/from-price";
import { getGateFigures } from "@/lib/stats/gate-figures";
import { isAdmin } from "@/lib/admin/access";
import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLocale } from "@/lib/i18n/get-locale";
import { getWordGroupById } from "@/lib/word-lists";
import {
  getLearnerToday,
  getSmartWordsAccess,
  getWordsRedesignEnabled,
} from "@/lib/word-mastery/access";
import { selectWeakWords } from "@/lib/word-mastery/dashboard";
import { readMasteryStates } from "@/lib/word-mastery/queue";
import { practiceScope, practiceVisitKey, selectContinueWords } from "@/lib/word-mastery/schedule";
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
 * `?scope=resume` (the card's Continue, for a group the learner has part-finished)
 * opens the same practice at the first block with a word not finished yet, and
 * `?scope=all` practices every word of the group instead of only the ones that
 * are new or due, and `?scope=weak` (the redesigned word wall's button) only the
 * ones the learner has met but not secured. They only matter while "Smart word
 * practice" is open to the visitor (an admin preview, or On for everyone) —
 * otherwise they are ignored and the page is the practice it always was; `weak`
 * additionally needs the redesign to be open, and is Continue without it.
 *
 * This page is rendered again after every answer (each answer is reported with a
 * Server Action that revalidates, and Next answers such an action with a fresh
 * render of the page it was called from), and a Continue visit's word list is
 * worked out from the schedule those answers change. So the practice must not
 * follow what this page returns while it runs: VocabularyPractice keeps the
 * words, the mode and the "all caught up" outcome of the visit it opened with,
 * and the `key` below says which visit that is.
 */
export default async function WordGroupPracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { groupId } = await params;
  const { scope: rawScope } = await searchParams;
  // The redesign is admin-controlled (see getWordsRedesignEnabled); `weak` is part of it.
  const redesign = await getWordsRedesignEnabled();
  const requestedScope = practiceScope(rawScope);
  const scope = requestedScope === "weak" && !redesign ? "continue" : requestedScope;
  const locale = await getLocale();
  const group = await getWordGroupById(groupId, locale ?? undefined);
  if (!group) notFound();

  const canAccess =
    group.isFree || (await Promise.all([hasPremiumAccess(), isAdmin()])).some(Boolean);
  if (!canAccess) {
    return (
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-4 pt-8 pb-28 sm:px-6 sm:py-14">
        <WordGroupLocked
          title={group.title}
          supportTitle={group.supportTitle}
          description={group.description}
          supportDescription={group.supportDescription}
          fromPrice={await getFromMonthlyPrice()}
          figures={await getGateFigures(locale)}
        />
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
  // Which visit this is: another group, or Practice all instead of Continue, is
  // a different visit and starts fresh. Being rendered again after an answer is
  // the same visit and must not (see above).
  const visitKey = practiceVisitKey(group.id, scope);
  let practiceWords = group.words;
  let smart: SmartPracticeConfig | null = null;
  if (access.enabled) {
    smart = { spaced: access.spaced };
    if (access.spaced && access.userId && (scope === "continue" || scope === "weak")) {
      const [states, today] = await Promise.all([
        readMasteryStates(access.userId),
        getLearnerToday(),
      ]);
      const picked =
        scope === "weak"
          ? selectWeakWords(group.words, states)
          : selectContinueWords(group.words, states, today).words;
      if (picked.length === 0) {
        const dueDates = group.words
          .map((word) => states.get(word.id)?.dueOn)
          .filter((dueOn): dueOn is string => dueOn !== undefined)
          .sort();
        // Shown by the practice itself, not returned from here: a render of this
        // page that finds everything done after the learner's own last answer
        // must not replace the practice they are looking at.
        return (
          <VocabularyPractice
            key={visitKey}
            group={{ ...group, words: [] }}
            caughtUp={{ nextDueISO: dueDates[0] ?? null }}
          />
        );
      }
      practiceWords = picked;
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
    <VocabularyPractice
      key={visitKey}
      group={{ ...group, words }}
      defaultVoiceId={defaultVoiceId}
      smart={smart}
      groupWordIds={group.words.map((word) => word.id)}
      redesign={redesign}
      resume={scope === "resume"}
    />
  );
}
