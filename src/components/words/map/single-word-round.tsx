"use client";

import { useCallback } from "react";

import { LadderRound } from "@/components/words/ladder/ladder-round";
import { useWordProgress } from "@/hooks/use-word-progress";
import type { LadderWord } from "@/lib/word-ladder/types";

export const WORD_LIST_HREF = "/learn/word-lists?tab=map&view=list";

/**
 * One word opened from the Map tab's word list: the round's four steps over that word alone
 * (meaning, its four choices, its letters in order, then typed). The word is reported, voiced and
 * counted under its own topic exactly as in a topic's round (see LadderWord.topic).
 */
export function SingleWordRound({
  word,
  bankFeed,
  todayISO,
}: {
  word: LadderWord;
  bankFeed: boolean;
  todayISO: string;
}) {
  const { markWordComplete } = useWordProgress();
  const topicId = word.topic?.id ?? "";
  const complete = useCallback(
    (wordId: string) => {
      if (topicId) markWordComplete(topicId, wordId);
    },
    [markWordComplete, topicId],
  );
  return (
    <LadderRound
      words={[word]}
      number={1}
      done={0}
      total={1}
      group={{ id: topicId || "word", title: word.topic?.title ?? word.word }}
      voiceId={null}
      bankFeed={bankFeed}
      todayISO={todayISO}
      onWordComplete={complete}
      next={null}
      onNext={() => undefined}
      onExam={() => undefined}
      backHref={WORD_LIST_HREF}
      roundLabel={word.word}
      mixed
      single
    />
  );
}
