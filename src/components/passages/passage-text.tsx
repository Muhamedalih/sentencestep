"use client";

import { Fragment } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { speakerClassFor } from "@/lib/passages/art";
import type { PassageSentence } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * A part's text, set as a page and not as a list: the sentences run on one
 * after another, wrapping like a paragraph, so a whole part fits on a screen
 * with no scrolling. A character's name sits in front of their sentences in a
 * colour of their own, so a dialogue still reads as a script.
 *
 * Each sentence is one tappable span. While a part is read aloud the speaking
 * sentence is lit by a soft tint and a thin underline (the others step back) —
 * the highlight changes only colour and opacity, never size or position, so
 * nothing in the paragraph ever moves. With the translation on, the Arabic sits
 * in a second column with the same sentences lit in step.
 */

interface PassageTextProps {
  sentences: PassageSentence[];
  /** Every character of the passage in the order they first speak — a character keeps the same colour in every part. */
  speakers: readonly string[];
  /** The sentence being spoken (or paused on); null when nothing is playing. */
  activeIndex: number | null;
  /** A part is being read aloud: the sentences that are not speaking step back. */
  readingAloud: boolean;
  /** Tapping a sentence plays it — false while the part has no complete audio. */
  canPlay: boolean;
  onPlay: (index: number) => void;
  showTranslation: boolean;
  /** The sentence that holds the answer, lit green after a wrong answer. */
  evidenceIndex: number | null;
  /** The question is open: the text steps back so the question has the attention (the evidence sentence stays bright). */
  dimmed: boolean;
}

// The underline is a real text decoration (transparent until a sentence is lit), not a shadow: a
// shadow follows the rounded corners and reads as a border, a decoration is just a clean line.
// scroll-mt: room above a sentence that is scrolled to, so the sticky header never covers it.
const SENTENCE_BASE =
  "scroll-mt-36 rounded-[0.35em] px-[0.3em] py-[0.1em] -mx-[0.3em] box-decoration-clone underline decoration-transparent decoration-2 underline-offset-[0.3em] outline-none transition-[background-color,text-decoration-color,opacity,color] duration-300 ease-out";

function sentenceClasses(state: {
  canPlay: boolean;
  active: boolean;
  evidence: boolean;
  faded: boolean;
}): string {
  return cn(
    SENTENCE_BASE,
    state.canPlay &&
      "hover:bg-foreground/[0.07] focus-visible:ring-ring cursor-pointer focus-visible:ring-2",
    state.active && "bg-primary/20 decoration-primary/70",
    state.evidence && "bg-success/25 decoration-success",
    state.faded && "opacity-40",
  );
}

export function PassageText({
  sentences,
  speakers,
  activeIndex,
  readingAloud,
  canPlay,
  onPlay,
  showTranslation,
  evidenceIndex,
  dimmed,
}: PassageTextProps) {
  const { t } = useLocale();

  function renderSentences(language: "en" | "ar") {
    return sentences.map((sentence, index) => {
      const active = activeIndex === index;
      const evidence = evidenceIndex === index;
      const faded = (readingAloud && !active) || (dimmed && !evidence);
      const showSpeaker =
        Boolean(sentence.speaker) && sentence.speaker !== sentences[index - 1]?.speaker;
      const speakerIndex = sentence.speaker ? speakers.indexOf(sentence.speaker) : -1;

      return (
        <Fragment key={sentence.id}>
          <span
            id={language === "en" ? `sentence-${index}` : undefined}
            role={canPlay ? "button" : undefined}
            tabIndex={canPlay ? 0 : undefined}
            title={canPlay ? t.passages.replayLine : undefined}
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
            className={cn(
              sentenceClasses({ canPlay, active, evidence, faded }),
              language === "ar" && active && "text-foreground",
            )}
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
            {language === "en" ? sentence.en : sentence.ar}
          </span>{" "}
        </Fragment>
      );
    });
  }

  return (
    <div
      id="passage-text"
      className={cn("grid gap-x-16 gap-y-10", showTranslation ? "md:grid-cols-2" : "max-w-[62rem]")}
    >
      <p
        className={cn(
          "font-quote text-foreground leading-[1.78] tracking-[-0.005em]",
          showTranslation
            ? "text-[1.55rem] sm:text-[1.65rem]"
            : "text-[1.6rem] sm:text-[1.9rem] sm:leading-[1.72]",
        )}
        dir="ltr"
        lang="en"
      >
        {renderSentences("en")}
      </p>
      {showTranslation && (
        <p
          className="text-muted-foreground border-border/70 text-[1.3rem] leading-[2.05] sm:text-[1.45rem] md:border-l md:pl-16"
          dir="rtl"
          lang="ar"
        >
          {renderSentences("ar")}
        </p>
      )}
    </div>
  );
}
