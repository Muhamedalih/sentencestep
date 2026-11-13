"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LadderRound } from "@/components/words/ladder/ladder-round";
import { TopicPicture } from "@/components/words/map/map-parts";
import { useLocale } from "@/components/providers/locale-provider";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { useWordProgress } from "@/hooks/use-word-progress";
import type { LadderWord } from "@/lib/word-ladder/types";
import type { PickReason } from "@/lib/words-map/pick";
import { wordsMapStrings } from "@/lib/words-map/strings";

export const MAP_HREF = "/learn/word-lists?tab=map";

export interface SessionWordInfo {
  reason: PickReason;
  topicTitle: string;
  topicLevel: number;
  coverUrl: string | null;
}

/**
 * Today's session of the Map tab (the wordsMap permission): the four words and why each was picked,
 * then the usual five-step round over them, then the exam of that round. The four come from four
 * topics, so every word is reported, voiced and saved under its OWN topic (see LadderWord.topic): a
 * word typed right counts in its topic's Word Lists progress exactly as it does in the topic's own
 * round, and the words bank hears the same thing it hears from there.
 */
export function SessionRound({
  words,
  info,
  bankFeed,
  todayISO,
}: {
  words: LadderWord[];
  /** By word id. */
  info: Record<string, SessionWordInfo>;
  bankFeed: boolean;
  todayISO: string;
}) {
  const { locale } = useLocale();
  const s = wordsMapStrings(locale);
  const { markWordComplete } = useWordProgress();
  const [view, setView] = useState<"intro" | "round" | "exam">("intro");
  const [runKey, setRunKey] = useState(0);

  const topicOf = useMemo(
    () => new Map(words.map((word) => [word.id, word.topic?.id ?? ""])),
    [words],
  );
  const complete = useCallback(
    (wordId: string) => {
      const topicId = topicOf.get(wordId);
      if (topicId) markWordComplete(topicId, wordId);
    },
    [markWordComplete, topicOf],
  );
  const begin = useCallback(() => {
    setRunKey((key) => key + 1);
    setView("round");
  }, []);
  const exam = useCallback(() => {
    setRunKey((key) => key + 1);
    setView("exam");
  }, []);
  useEnterToContinue(view === "intro", begin);

  if (view !== "intro") {
    return (
      <LadderRound
        key={`${view}:${runKey}`}
        mode={view}
        words={words}
        number={1}
        done={0}
        total={words.length}
        group={{ id: "session", title: s.roundTitle }}
        voiceId={null}
        bankFeed={bankFeed}
        todayISO={todayISO}
        onWordComplete={complete}
        next={null}
        onNext={() => undefined}
        onExam={exam}
        backHref={MAP_HREF}
        roundLabel={s.sessionLabel}
        mixed
      />
    );
  }

  const topics = new Set(words.map((word) => word.topic?.id)).size;
  return (
    <div className="h-app flex w-full flex-col">
      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <Link
          href={MAP_HREF}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium pointer-coarse:min-h-11"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span dir="auto">{s.back}</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-6 text-center lg:px-16">
        <p className="text-muted-foreground text-[12.5px] font-semibold tracking-wide" dir="auto">
          {s.sessionLabel}
        </p>
        <h1
          className="text-[clamp(1.8rem,1.3rem+1.8vw,2.4rem)] leading-tight font-semibold tracking-tight"
          dir="auto"
        >
          {s.sessionTitle(words.length, topics)}
        </h1>
        <div
          dir="ltr"
          className="grid w-full max-w-[980px] grid-cols-2 gap-3 text-left lg:grid-cols-4 lg:gap-4"
        >
          {words.map((word) => {
            const detail = info[word.id]!;
            return (
              <div
                key={word.id}
                className="border-border bg-card overflow-hidden rounded-[18px] border"
              >
                <div className="relative h-[96px] w-full lg:h-[150px]">
                  <TopicPicture
                    topic={{
                      title: detail.topicTitle,
                      level: detail.topicLevel,
                      coverUrl: detail.coverUrl,
                    }}
                  />
                </div>
                <div className="px-4 pt-3 pb-4 lg:px-[18px] lg:pb-[18px]">
                  <div className="text-[24px] leading-tight font-bold tracking-[-0.02em] lg:text-[30px]">
                    {word.word}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-[12.5px]">
                    {detail.topicTitle}
                  </div>
                  <p
                    className="text-foreground/85 mt-2.5 text-[13px] leading-[1.7] lg:text-[13.5px]"
                    dir="auto"
                  >
                    {s.reason(detail.reason, detail.topicTitle)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-muted-foreground max-w-[600px] text-[14px] leading-[1.8]" dir="auto">
          {s.sessionNote}
        </p>
        <button
          type="button"
          onClick={begin}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-[10px] px-11 text-[15px] font-semibold transition-colors"
        >
          <span dir="auto">{s.begin}</span>
        </button>
      </div>
    </div>
  );
}
