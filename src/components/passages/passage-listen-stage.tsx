"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { EyeOff, Loader2, Pause, Play, RotateCcw } from "lucide-react";

import { PassageButton, passageButtonClass } from "@/components/passages/passage-button";
import { useLocale } from "@/components/providers/locale-provider";
import type { usePassageAudio } from "@/hooks/use-passage-audio";
import type { PassageSentence } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * The listen-only screen: in place of the text, one big audio button and a row
 * of bars — one per sentence, as long as the sentence is — that fill in as the
 * part is read out. Nothing of the words is on screen, so the learner has to
 * understand it by ear; after the question the text is revealed. "Show the
 * text" is always one press away (a learner who is lost should not be stuck).
 *
 * The button is the one thing that moves. A thin ring around it fills as the
 * part is heard (written from the audio clock on every frame, outside React, like
 * the highlight in the text); rings leave it one after another while the voice
 * speaks; a soft halo breathes behind it while it waits; and its icon turns into
 * the next one — play, pause, spinner, "again" — instead of being swapped.
 */

const RING_RADIUS = 56;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** One icon of the button's stack: the active one is shown, the others are turned away and faded — a cross-fade with a quarter turn, done with CSS so it never waits on a timer. */
function IconLayer({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        active ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0",
      )}
    >
      {children}
    </span>
  );
}

export function PassageListenStage({
  sentences,
  audio,
  onShowText,
}: {
  sentences: PassageSentence[];
  audio: ReturnType<typeof usePassageAudio>;
  onShowText: () => void;
}) {
  const { t } = useLocale();
  const { activeIndex, finished, getProgress, loading, paused, readingThrough } = audio;
  const total = sentences.length;
  const inRun = readingThrough && activeIndex !== null;
  const speaking = inRun && !paused;
  const voiceOn = speaking && !loading;
  const ringRef = useRef<SVGCircleElement | null>(null);

  const caption = inRun
    ? t.passages.listeningLine
        .replace("{n}", String((activeIndex ?? 0) + 1))
        .replace("{total}", String(total))
    : finished
      ? t.passages.listeningDone
      : t.passages.pressToListen;

  // The ring: how much of the whole part has been heard. Paused, it holds; finished, it is full.
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const parts = Math.max(total, 1);
    const apply = () => {
      const heard = finished
        ? 1
        : inRun
          ? Math.min(1, ((activeIndex ?? 0) + getProgress()) / parts)
          : 0;
      ring.style.strokeDashoffset = String(RING_LENGTH * (1 - heard));
    };
    apply();
    if (!speaking) return;
    let frame = 0;
    const tick = () => {
      apply();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, finished, getProgress, inRun, speaking, total]);

  function handleMainPress() {
    if (speaking) audio.pause();
    else if (inRun) audio.resume();
    else audio.playAll();
  }

  const showSpinner = loading && speaking;
  const showPause = speaking && !loading;
  const showAgain = !inRun && finished;
  const showPlay = !showSpinner && !showPause && !showAgain;

  return (
    <div className="border-border bg-card/60 flex min-h-[19rem] flex-col items-center justify-center gap-7 rounded-[2rem] border px-6 py-12 text-center">
      <div className="relative flex size-[7.5rem] items-center justify-center">
        {/* A wide, soft light behind the button while the voice is on. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_20%,transparent),transparent)] transition-opacity duration-700",
            voiceOn ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Rings that leave the button one after another while the voice speaks. */}
        {voiceOn &&
          [0, 1, 2].map((index) => (
            <span
              key={index}
              aria-hidden="true"
              className="passage-orb-ripple border-primary/50 pointer-events-none absolute inset-[0.75rem] rounded-full border"
              style={{ animationDelay: `${index * 0.8}s` }}
            />
          ))}
        {/* The halo that breathes while the button waits to be pressed. */}
        {!inRun && (
          <span
            aria-hidden="true"
            className="passage-orb-breathe bg-primary/25 pointer-events-none absolute inset-[0.75rem] rounded-full"
          />
        )}
        {/* The ring that fills as the part is heard. */}
        <svg
          viewBox="0 0 120 120"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full -rotate-90"
        >
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-foreground/10"
          />
          <circle
            ref={ringRef}
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH}
            className="text-primary"
          />
        </svg>
        <button
          type="button"
          onClick={handleMainPress}
          aria-label={
            speaking ? t.passages.pause : showAgain ? t.passages.listenAgain : t.passages.listen
          }
          className={cn(
            passageButtonClass("primary", "lg"),
            "size-24 rounded-full px-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_2px_4px_rgb(0_0_0/0.3),0_16px_32px_-14px_color-mix(in_oklab,var(--primary)_70%,transparent)]",
          )}
        >
          <span className="relative block size-10">
            <IconLayer active={showSpinner}>
              <Loader2 className="size-9 animate-spin" />
            </IconLayer>
            <IconLayer active={showPause}>
              <Pause className="size-9" fill="currentColor" />
            </IconLayer>
            <IconLayer active={showAgain}>
              <RotateCcw className="size-8" />
            </IconLayer>
            <IconLayer active={showPlay}>
              <Play className="size-9 translate-x-0.5" fill="currentColor" />
            </IconLayer>
          </span>
        </button>
      </div>

      <p className="text-muted-foreground min-h-6 text-base" role="status">
        <bdi>{caption}</bdi>
      </p>

      <div
        className="flex max-w-2xl flex-wrap items-center justify-center gap-2"
        aria-hidden="true"
      >
        {sentences.map((sentence, index) => {
          const played = finished || (activeIndex !== null && index < activeIndex);
          const current = activeIndex === index && !finished;
          return (
            <span
              key={sentence.id}
              className={cn(
                "h-2 rounded-full transition-colors duration-500",
                played || current ? "bg-primary" : "bg-border",
                current && speaking && "animate-pulse",
              )}
              style={{ width: `${Math.min(Math.max(sentence.en.length * 2.1, 24), 96)}px` }}
            />
          );
        })}
      </div>

      <PassageButton variant="quiet" size="md" onClick={onShowText}>
        <EyeOff className="size-4" aria-hidden="true" />
        {t.passages.showText}
      </PassageButton>
    </div>
  );
}
