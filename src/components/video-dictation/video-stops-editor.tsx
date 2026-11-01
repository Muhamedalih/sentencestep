"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import { videoStrings } from "@/lib/video-dictation/strings";
import { timingsOf } from "@/lib/video-dictation/timings";
import {
  resetVideoTimingsAction,
  saveVideoTimingsAction,
} from "@/lib/video-dictation/timings-actions";
import type { VideoSentence } from "@/lib/video-dictation/types";

const FINE = 0.05;
const COARSE = 0.25;

const STEP_BUTTON =
  "border-border hover:bg-secondary h-7 min-w-9 rounded-md border px-1.5 text-[11px] font-semibold tabular-nums";

const round = (seconds: number) => Math.round(seconds * 100) / 100;

/**
 * The Admin's editor of where each sentence of a video starts (the replay begins just before it) and
 * where the video stops after it. Times move by hand with the small buttons, or take the playhead's
 * position ("Now": scrub YouTube's own bar to the moment, then press it); "Test" plays the sentence with
 * the times as they are now, so a stop can be heard before it is saved. Saving writes the video's times
 * for everyone (see saveVideoTimingsAction); the page keeps working on the edited copy meanwhile.
 */
export function VideoStopsEditor({
  videoId,
  sentences,
  current,
  getTime,
  onChange,
  onTest,
  onClose,
}: {
  videoId: string;
  sentences: readonly VideoSentence[];
  /** The sentence the practice screen is on, highlighted in the list. */
  current: number;
  /** The playhead of the video, or undefined while the player is not ready. */
  getTime: () => number | undefined;
  onChange: (sentences: VideoSentence[]) => void;
  onTest: (at: number) => void;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const strings = videoStrings(locale);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const setTime = (at: number, key: "startSeconds" | "endSeconds", seconds: number) => {
    setMessage(null);
    onChange(
      sentences.map((sentence, index) =>
        index === at ? { ...sentence, [key]: Math.max(0, round(seconds)) } : sentence,
      ),
    );
  };

  const run = (action: () => Promise<{ success?: string; error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      setMessage(
        result.error ? { text: result.error, ok: false } : { text: result.success ?? "", ok: true },
      );
    });

  const save = () => run(() => saveVideoTimingsAction(videoId, timingsOf(sentences)));
  const reset = () => {
    if (!window.confirm(strings.stopsResetConfirm)) return;
    run(async () => {
      const result = await resetVideoTimingsAction(videoId);
      // The page shows the file's own times again after a reload; the saved ones stay on screen until then.
      return result;
    });
  };

  return (
    <aside
      dir="auto"
      className={cn(
        "bg-background border-border fixed inset-x-0 bottom-0 z-50 flex max-h-[62svh] flex-col border-t shadow-2xl",
        "lg:inset-x-auto lg:top-0 lg:right-0 lg:max-h-none lg:w-[410px] lg:border-t-0 lg:border-l",
      )}
    >
      <div className="flex items-start gap-2 px-4 pt-3 pb-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold">{strings.stopsTitle}</h2>
          <p className="text-muted-foreground mt-0.5 text-[12px] leading-snug">
            {strings.stopsHint}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={strings.stopsClose}
          className="border-border grid size-8 shrink-0 place-items-center rounded-lg border"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ol className="flex-1 space-y-2 overflow-y-auto px-4 pb-3">
        {sentences.map((sentence, at) => (
          <li
            key={sentence.id}
            className={cn(
              "border-border/70 rounded-xl border p-2.5",
              at === current && "border-primary/50 bg-brand-muted/50",
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-muted-foreground text-[11px] font-semibold tabular-nums">
                {at + 1}
              </span>
              <p className="min-w-0 flex-1 truncate text-[12px]" dir="ltr">
                {sentence.en}
              </p>
              <button
                type="button"
                onClick={() => onTest(at)}
                className="border-primary/40 text-primary hover:bg-brand-muted h-7 rounded-md border px-2.5 text-[12px] font-semibold"
              >
                {strings.stopsTest}
              </button>
            </div>
            <TimeRow
              label={strings.stopsStart}
              nowLabel={strings.stopsNow}
              seconds={sentence.startSeconds}
              onSet={(seconds) => setTime(at, "startSeconds", seconds)}
              getTime={getTime}
            />
            <TimeRow
              label={strings.stopsEnd}
              nowLabel={strings.stopsNow}
              seconds={sentence.endSeconds}
              onSet={(seconds) => setTime(at, "endSeconds", seconds)}
              getTime={getTime}
            />
          </li>
        ))}
      </ol>

      <div className="border-border flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <Button type="button" onClick={save} disabled={pending} size="sm">
          {pending ? strings.stopsSaving : strings.stopsSave}
        </Button>
        <Button type="button" onClick={reset} disabled={pending} size="sm" variant="outline">
          {strings.stopsReset}
        </Button>
        {message && (
          <p
            role="status"
            className={cn(
              "basis-full text-[12px]",
              message.ok ? "text-primary" : "text-destructive",
            )}
          >
            {message.text}
          </p>
        )}
      </div>
    </aside>
  );
}

function TimeRow({
  label,
  nowLabel,
  seconds,
  onSet,
  getTime,
}: {
  label: string;
  nowLabel: string;
  seconds: number;
  onSet: (seconds: number) => void;
  getTime: () => number | undefined;
}) {
  return (
    <div className="mt-1 flex items-center gap-1.5" dir="ltr">
      <span className="text-muted-foreground w-14 shrink-0 text-[11px]" dir="auto">
        {label}
      </span>
      <button type="button" className={STEP_BUTTON} onClick={() => onSet(seconds - COARSE)}>
        −{COARSE}
      </button>
      <button type="button" className={STEP_BUTTON} onClick={() => onSet(seconds - FINE)}>
        −{FINE}
      </button>
      <span className="w-12 text-center text-[13px] font-semibold tabular-nums">
        {seconds.toFixed(2)}
      </span>
      <button type="button" className={STEP_BUTTON} onClick={() => onSet(seconds + FINE)}>
        +{FINE}
      </button>
      <button type="button" className={STEP_BUTTON} onClick={() => onSet(seconds + COARSE)}>
        +{COARSE}
      </button>
      <button
        type="button"
        className={cn(STEP_BUTTON, "text-primary border-primary/40")}
        onClick={() => {
          const time = getTime();
          if (time !== undefined) onSet(time);
        }}
        dir="auto"
      >
        {nowLabel}
      </button>
    </div>
  );
}
