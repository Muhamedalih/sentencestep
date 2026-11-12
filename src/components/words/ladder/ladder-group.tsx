"use client";

import { useCallback, useMemo, useState } from "react";

import { LadderRound } from "@/components/words/ladder/ladder-round";
import { LadderTopic } from "@/components/words/ladder/ladder-topic";
import { useWordProgress } from "@/hooks/use-word-progress";
import { planRound } from "@/lib/word-ladder/rounds";
import type { RoundPlan } from "@/lib/word-ladder/rounds";
import type { LadderWord } from "@/lib/word-ladder/types";

/**
 * Word Lists as rounds of three words (the wordLadder permission): the topic's own screen and the
 * round the learner plays from it. The words a round asks are the topic's words not finished yet, in
 * the topic's order, so the old Practice's finished words count and a word that missed twice comes
 * round again. Finished words are the learner's own Word Lists progress (signed in or a guest's, the
 * same as the old Practice), plus the ones typed right in this visit, which are known at once without
 * waiting for the server's answer.
 */
export function LadderGroup({
  group,
  words,
  voiceId,
  bankFeed,
  todayISO,
}: {
  group: { id: string; title: string; supportTitle?: string; level: number };
  words: LadderWord[];
  voiceId: string | null;
  bankFeed: boolean;
  todayISO: string;
}) {
  const { isLoaded, completedWordIds, markWordComplete } = useWordProgress();
  const [view, setView] = useState<"topic" | "round">("topic");
  const [active, setActive] = useState<RoundPlan<LadderWord> | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [visitDone, setVisitDone] = useState<ReadonlySet<string>>(() => new Set());
  // "Start again" after a finished topic: the saved progress is set aside for this visit.
  const [fresh, setFresh] = useState(false);

  const topicIds = useMemo(() => new Set(words.map((word) => word.id)), [words]);
  const done = useMemo(() => {
    const finished = new Set<string>(visitDone);
    if (!fresh) for (const id of completedWordIds) if (topicIds.has(id)) finished.add(id);
    return finished;
  }, [completedWordIds, fresh, topicIds, visitDone]);
  const plan = useMemo(() => planRound(words, done), [words, done]);

  const start = useCallback((next: RoundPlan<LadderWord> | null) => {
    if (!next) return;
    setActive(next);
    setRunKey((key) => key + 1);
    setView("round");
  }, []);

  const complete = useCallback(
    (wordId: string) => {
      markWordComplete(group.id, wordId);
      setVisitDone((previous) => new Set(previous).add(wordId));
    },
    [group.id, markWordComplete],
  );

  function again() {
    setFresh(true);
    setVisitDone(new Set());
    start(planRound(words, new Set()));
  }

  if (view === "round" && active) {
    return (
      <LadderRound
        key={runKey}
        words={active.words}
        number={active.number}
        done={active.done}
        total={active.total}
        group={group}
        voiceId={voiceId}
        bankFeed={bankFeed}
        todayISO={todayISO}
        onWordComplete={complete}
        next={plan ? { number: plan.number, firstWord: plan.words[0]!.word } : null}
        onNext={() => (plan ? start(plan) : setView("topic"))}
      />
    );
  }

  return (
    <LadderTopic
      group={group}
      plan={plan}
      words={words}
      loading={!isLoaded}
      onStart={() => start(plan)}
      onAgain={again}
    />
  );
}
