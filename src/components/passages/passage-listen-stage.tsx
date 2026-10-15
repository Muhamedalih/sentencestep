"use client";

import { EyeOff, Loader2, Pause, Play } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import type { usePassageAudio } from "@/hooks/use-passage-audio";
import type { PassageSentence } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * The listen-only screen: in place of the text, one big play control and a row
 * of bars — one per sentence, as long as the sentence is — that fill in as the
 * part is read out. Nothing of the words is on screen, so the learner has to
 * understand it by ear; after the question the text is revealed. "Show the
 * text" is always one press away (a learner who is lost should not be stuck).
 */
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
  const total = sentences.length;
  const inRun = audio.readingThrough && audio.activeIndex !== null;
  const speaking = inRun && !audio.paused;

  const caption = inRun
    ? t.passages.listeningLine
        .replace("{n}", String((audio.activeIndex ?? 0) + 1))
        .replace("{total}", String(total))
    : audio.finished
      ? t.passages.listeningDone
      : t.passages.pressToListen;

  function handleMainPress() {
    if (speaking) audio.pause();
    else if (inRun) audio.resume();
    else audio.playAll();
  }

  return (
    <div className="border-border bg-card/60 flex min-h-[19rem] flex-col items-center justify-center gap-7 rounded-[2rem] border px-6 py-12 text-center">
      <div className="relative flex size-24 items-center justify-center">
        {speaking && !audio.loading && (
          <>
            <span
              aria-hidden="true"
              className="bg-primary/25 absolute inset-0 animate-ping rounded-full motion-reduce:hidden"
            />
            <span
              aria-hidden="true"
              className="bg-primary/15 absolute -inset-3 animate-pulse rounded-full motion-reduce:hidden"
            />
          </>
        )}
        <button
          type="button"
          onClick={handleMainPress}
          aria-label={speaking ? t.passages.pause : t.passages.listen}
          className="bg-primary text-primary-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative flex size-24 items-center justify-center rounded-full shadow-lg transition-transform duration-200 outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
        >
          {audio.loading && speaking ? (
            <Loader2 className="size-9 animate-spin" aria-hidden="true" />
          ) : speaking ? (
            <Pause className="size-9" fill="currentColor" aria-hidden="true" />
          ) : (
            <Play className="size-9 translate-x-0.5" fill="currentColor" aria-hidden="true" />
          )}
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
          const played =
            audio.finished || (audio.activeIndex !== null && index < audio.activeIndex);
          const current = audio.activeIndex === index && !audio.finished;
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

      <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={onShowText}>
        <EyeOff className="size-4" aria-hidden="true" />
        {t.passages.showText}
      </Button>
    </div>
  );
}
