"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, LayoutGrid } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useSpeech } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";
import { watchUrl } from "@/lib/video-dictation/content";
import type { MissedWord } from "@/lib/video-dictation/finish-summary";
import { fill, videoStrings } from "@/lib/video-dictation/strings";

/** What the learner did in this video, as the new finish screen shows it. */
export interface VideoFinishSummary {
  /** Correct letters out of all letters typed, 0-100. */
  accuracy: number;
  /** One entry per sentence, in order: true when a wrong letter was typed in it. */
  sentenceMistakes: readonly boolean[];
  /** The words offered for review (see pickReviewWords), at most four. */
  reviewWords: readonly MissedWord[];
  /** The number of words in the video's sentences. */
  wordsTyped: number;
}

// The colour of a sentence typed without a mistake in the panel: the lesson finish screen's own "excellent" green.
const CLEAN_GREEN = "text-[#34d399]";
// The thin lines of the lesson finish screen: the text colour at 12%.
const HAIRLINE = "border-foreground/12";

/**
 * The screen after a video's last sentence, drawn in the language of the lesson finish screen (the
 * approved mock-up of 2026-11-08, "videoFinish" permission): one centred column with the accuracy and
 * the title over a bar of one segment per sentence, up to four mistyped words with their meaning (a tap
 * says the word), a panel of what was typed, and the way on. Nothing on it is a reward for watching
 * (YouTube's rules): every number is about the typing.
 */
export function VideoFinishScreen({
  summary,
  youtubeId,
  nextLessonId,
  nextLessonTitle,
}: {
  summary: VideoFinishSummary;
  youtubeId: string;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
}) {
  const { locale } = useLocale();
  const strings = videoStrings(locale);
  const { speakWord } = useSpeech();

  const total = summary.sentenceMistakes.length;
  const clean = summary.sentenceMistakes.filter((mistake) => !mistake).length;
  const cleanLine =
    clean === total ? strings.finishAllClean : fill(strings.finishCleanLine, { clean, total });

  const watchLink = (
    <a
      href={watchUrl(youtubeId)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-foreground/5 inline-flex h-10 items-center gap-2 rounded-[13px] border px-[18px] text-[15px] font-medium transition-colors",
        HAIRLINE,
      )}
    >
      <ExternalLink className="size-4" aria-hidden="true" />
      <span dir="auto">{strings.finishWatch}</span>
    </a>
  );
  const libraryLink = (
    <Link
      href="/learn/video"
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-foreground/5 inline-flex h-10 items-center gap-2 rounded-[13px] border px-[18px] text-[15px] font-medium transition-colors",
        HAIRLINE,
      )}
    >
      <LayoutGrid className="size-4" aria-hidden="true" />
      <span dir="auto">{strings.backToLibrary}</span>
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-4">
      <div className="w-full max-w-[496px]">
        <div
          className={cn(
            "mb-4 flex items-center justify-between gap-4",
            "[@media(max-height:720px)]:mb-3",
          )}
        >
          <span
            className="text-[44px] leading-none font-bold tabular-nums sm:text-[52px]"
            dir="ltr"
          >
            {summary.accuracy}%
          </span>
          <div className="min-w-0 text-right" dir="rtl">
            <h1 className="text-2xl font-bold sm:text-[28px]">{strings.finishTitle}</h1>
            <p className="text-muted-foreground mt-0.5 text-[13px] sm:text-[15px]">{cleanLine}</p>
          </div>
        </div>
        <div className="flex gap-[5px]" dir="ltr" aria-hidden="true">
          {summary.sentenceMistakes.map((mistake, at) => (
            <span
              key={at}
              className={cn(
                "h-[7px] flex-1 rounded-full",
                mistake ? "bg-brand-muted" : "bg-primary",
              )}
            />
          ))}
        </div>
      </div>

      {summary.reviewWords.length > 0 && (
        <div className={cn("mt-[22px] w-full max-w-[496px]", "[@media(max-height:720px)]:mt-4")}>
          <p
            className="text-muted-foreground mb-2.5 text-center text-xs font-semibold tracking-[0.08em]"
            dir="auto"
          >
            {strings.finishWordsLabel}
          </p>
          <div className="flex flex-wrap justify-center gap-3" dir="ltr">
            {summary.reviewWords.map((item) => (
              <button
                key={item.word}
                type="button"
                onClick={() => speakWord(item.word)}
                className={cn(
                  "bg-primary/10 border-primary/35 hover:bg-primary/15 flex w-[calc(50%-6px)] flex-col items-center gap-[5px] rounded-[20px] border px-1.5 pt-[17px] pb-[15px] text-center transition-colors sm:w-[calc(25%-9px)]",
                  "[@media(max-height:720px)]:pt-[13px] [@media(max-height:720px)]:pb-[11px]",
                )}
              >
                <span className="text-xl leading-tight font-extrabold">{item.word}</span>
                {item.meaning && (
                  <span className="text-muted-foreground text-sm" dir="rtl">
                    {item.meaning}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn("mt-[22px] w-full max-w-[496px]", "[@media(max-height:720px)]:mt-4")}>
        <div
          className={cn(
            "flex rounded-2xl border px-1.5 py-3.5",
            HAIRLINE,
            "[@media(max-height:720px)]:py-3",
          )}
          dir="rtl"
        >
          {[
            { value: total, label: strings.finishStatSentences, tone: "" },
            { value: clean, label: strings.finishStatClean, tone: CLEAN_GREEN },
            { value: summary.wordsTyped, label: strings.finishStatWords, tone: "" },
          ].map((stat, at) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 text-center",
                at > 0 && "border-r",
                HAIRLINE,
              )}
            >
              <span className={cn("text-[23px] font-semibold tabular-nums", stat.tone)}>
                {stat.value}
              </span>
              <span className="text-muted-foreground text-xs">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn("bg-foreground/12 mt-[22px] h-px w-full", "[@media(max-height:720px)]:mt-4")}
      />

      <div
        className={cn(
          "mt-4 flex flex-col items-center gap-2.5",
          "[@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:gap-2",
        )}
      >
        {nextLessonId ? (
          <>
            {nextLessonTitle && (
              <p className="text-muted-foreground text-sm" dir="auto">
                {strings.finishNext}{" "}
                <bdi className="text-foreground font-medium">{nextLessonTitle}</bdi>
              </p>
            )}
            <Link
              href={`/learn/video/${nextLessonId}`}
              className="bg-primary text-primary-foreground inline-flex h-[50px] items-center gap-2.5 rounded-2xl px-8 text-base font-semibold transition-opacity hover:opacity-90"
            >
              <span dir="auto">{strings.nextVideo}</span>
              <ArrowRight className="size-[19px]" aria-hidden="true" />
            </Link>
            <div className="flex flex-wrap justify-center gap-2">
              {watchLink}
              {libraryLink}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {watchLink}
            {libraryLink}
          </div>
        )}
      </div>
    </div>
  );
}
