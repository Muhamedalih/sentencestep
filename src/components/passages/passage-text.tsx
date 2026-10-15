"use client";

import { Fragment, useEffect, useRef } from "react";

import { speakerClassFor } from "@/lib/passages/art";
import type { PauseMark } from "@/lib/passages/narration-pauses";
import { passageTextSizeFor } from "@/lib/passages/text";
import type { PassageTextSize } from "@/lib/passages/text";
import type { PassageSentence } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * A part's text, set as a page and not as a list: the sentences run on one
 * after another, wrapping like a paragraph, so a whole part fits on a screen
 * with no scrolling. A character's name sits in front of their sentences in a
 * colour of their own, so a dialogue still reads as a script.
 *
 * Each sentence is one tappable span. While a part is read aloud the speaking
 * sentence has a soft band behind it that fills from its first word to wherever
 * the voice has got to (the others step back) — the band is plain CSS driven by
 * one number (`--passage-p`, see globals.css) that is written straight onto the
 * span on every animation frame, so following the voice never re-renders the
 * page and nothing in the paragraph ever moves. With the translation on, the
 * Arabic sits in a second column and the same sentence is lit there, in step.
 *
 * While a question is open the whole text is blurred: the learner answers from
 * memory, and the text clears the moment they have answered.
 */

interface PassageTextProps {
  sentences: PassageSentence[];
  /** Every character of the passage in the order they first speak — a character keeps the same colour in every part. */
  speakers: readonly string[];
  /** The sentence being spoken (or paused on); null when nothing is playing. */
  activeIndex: number | null;
  /** A part is being read aloud: the sentences that are not speaking step back. */
  readingAloud: boolean;
  /** The active sentence's clip is playing right now — the band follows the voice only then. */
  speaking: boolean;
  /** How far through the playing clip the voice is, 0 to 1. */
  getProgress: () => number;
  /** Tapping a sentence plays it — false while the part has no complete audio. */
  canPlay: boolean;
  onPlay: (index: number) => void;
  showTranslation: boolean;
  /** The sentence that holds the answer, lit green after a wrong answer. */
  evidenceIndex: number | null;
  /** A question is open and not yet answered: the text is blurred so the answer has to come from memory. */
  blurred: boolean;
  /** Where the narrator will pause, by sentence id — given only to an admin, who sees small dots there; absent for a learner. */
  pauseMarks?: Record<string, PauseMark>;
}

/**
 * A sentence's English, with — for an admin only — the small dots that show where the narrator pauses.
 * The dots are aria-hidden and cannot be selected, so they are never read out or copied.
 */
function EnglishText({ text, mark }: { text: string; mark?: PauseMark }) {
  if (!mark) return <>{text}</>;
  const parts = text.split(/(\s+)/);
  let seen = 0;
  let split = parts.length;
  if (mark.afterWord === 0) split = 0;
  else {
    for (let index = 0; index < parts.length; index += 1) {
      if (parts[index] && !/^\s+$/.test(parts[index]!)) seen += 1;
      if (seen === mark.afterWord) {
        split = index + 1;
        break;
      }
    }
  }
  const dots = (
    <span
      aria-hidden="true"
      title="The narrator pauses here (only an admin sees this)"
      className="text-primary mx-[0.15em] align-baseline text-[0.62em] font-bold tracking-[0.12em] opacity-70 select-none"
    >
      {mark.length === "long" ? "·····" : "···"}
    </span>
  );
  return (
    <>
      {parts.slice(0, split).join("")}
      {dots}
      {parts.slice(split).join("").trimStart() ? " " : null}
      {parts.slice(split).join("").trimStart()}
    </>
  );
}

/** The type classes for each size (see passageTextSizeFor). */
const TEXT_SIZES: Record<PassageTextSize, { en: string; enWithTranslation: string; ar: string }> = {
  large: {
    en: "text-[1.6rem] sm:text-[1.9rem] sm:leading-[1.72]",
    enWithTranslation: "text-[1.55rem] sm:text-[1.65rem]",
    ar: "text-[1.3rem] sm:text-[1.45rem]",
  },
  medium: {
    en: "text-[1.45rem] sm:text-[1.65rem] sm:leading-[1.7]",
    enWithTranslation: "text-[1.4rem] sm:text-[1.5rem]",
    ar: "text-[1.2rem] sm:text-[1.3rem]",
  },
  small: {
    en: "text-[1.35rem] sm:text-[1.5rem] sm:leading-[1.68]",
    enWithTranslation: "text-[1.3rem] sm:text-[1.38rem]",
    ar: "text-[1.15rem] sm:text-[1.22rem]",
  },
  xsmall: {
    en: "text-[1.25rem] sm:text-[1.4rem] sm:leading-[1.66]",
    enWithTranslation: "text-[1.2rem] sm:text-[1.28rem]",
    ar: "text-[1.08rem] sm:text-[1.15rem]",
  },
};

export function PassageText({
  sentences,
  speakers,
  activeIndex,
  readingAloud,
  speaking,
  getProgress,
  canPlay,
  onPlay,
  showTranslation,
  evidenceIndex,
  blurred,
  pauseMarks,
}: PassageTextProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const size =
    TEXT_SIZES[
      passageTextSizeFor(sentences.reduce((sum, sentence) => sum + sentence.en.length, 0))
    ];

  // The band behind the speaking sentence follows the voice: its progress is read from the audio
  // clock on every frame and written onto the span, outside React. Paused or between two sentences
  // it just holds the value the clip reached.
  useEffect(() => {
    if (activeIndex === null) return;
    const span = rootRef.current?.querySelector<HTMLElement>(
      `[data-sentence="${activeIndex}"][lang="en"]`,
    );
    if (!span) return;
    span.style.setProperty("--passage-p", getProgress().toFixed(4));
    if (!speaking) return;
    let frame = 0;
    const tick = () => {
      span.style.setProperty("--passage-p", getProgress().toFixed(4));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, speaking, getProgress]);

  function renderSentences(language: "en" | "ar") {
    return sentences.map((sentence, index) => {
      const active = activeIndex === index;
      const evidence = evidenceIndex === index;
      const faded = (readingAloud && !active) || (evidenceIndex !== null && !evidence);
      const showSpeaker =
        Boolean(sentence.speaker) && sentence.speaker !== sentences[index - 1]?.speaker;
      const speakerIndex = sentence.speaker ? speakers.indexOf(sentence.speaker) : -1;

      return (
        <Fragment key={sentence.id}>
          <span
            id={language === "en" ? `sentence-${index}` : undefined}
            data-sentence={index}
            data-state={evidence ? "evidence" : active ? "active" : "idle"}
            data-faded={faded ? "true" : "false"}
            lang={language}
            role={canPlay ? "button" : undefined}
            tabIndex={canPlay ? 0 : undefined}
            aria-current={active ? "true" : undefined}
            onClick={canPlay ? () => onPlay(index) : undefined}
            onKeyDown={
              canPlay
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onPlay(index);
                    }
                  }
                : undefined
            }
            // The Arabic twin has no clip of its own, so its band is simply all there at once.
            style={language === "ar" ? ({ "--passage-p": 1 } as React.CSSProperties) : undefined}
            className="passage-sentence"
          >
            {showSpeaker && (
              <span
                dir="ltr"
                // A plain inline span, not an inline-block: with no space between the name and the
                // sentence there is nowhere to break, so a name can never be stranded at a line's end.
                className={cn(
                  "relative -top-[0.12em] me-[0.55em] font-sans text-[0.38em] font-bold tracking-[0.16em] uppercase",
                  speakerClassFor(speakerIndex),
                )}
              >
                {sentence.speaker}
              </span>
            )}
            {language === "en" ? (
              <EnglishText text={sentence.en} mark={pauseMarks?.[sentence.id]} />
            ) : (
              sentence.ar
            )}
          </span>{" "}
        </Fragment>
      );
    });
  }

  return (
    <div
      ref={rootRef}
      id="passage-text"
      // Inert while blurred: not clickable, not focusable, not read out — the text really is out of reach.
      inert={blurred}
      className={cn(
        "grid gap-x-16 gap-y-10 transition-[filter,opacity] duration-500 ease-out motion-reduce:transition-none",
        showTranslation ? "md:grid-cols-2" : "max-w-[62rem]",
        blurred && "opacity-60 blur-[5px] select-none",
      )}
    >
      <p
        className={cn(
          "font-quote text-foreground leading-[1.78] tracking-[-0.005em]",
          showTranslation ? size.enWithTranslation : size.en,
        )}
        dir="ltr"
        lang="en"
      >
        {renderSentences("en")}
      </p>
      {showTranslation && (
        <p
          className={cn(
            "text-muted-foreground border-border/70 leading-[2.05] md:border-l md:pl-16",
            size.ar,
          )}
          dir="rtl"
          lang="ar"
        >
          {renderSentences("ar")}
        </p>
      )}
    </div>
  );
}
