"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { FinishButton, type StoryFinishAction } from "@/components/learning/story-finish";
import { VideoWordTraining } from "@/components/video-dictation/video-word-training";
import { useLocale } from "@/components/providers/locale-provider";
import { useWordClips } from "@/components/video-dictation/use-word-clips";
import { watchUrl } from "@/lib/video-dictation/content";
import type { TrainingWord } from "@/lib/video-dictation/finish-summary";
import { videoStrings } from "@/lib/video-dictation/strings";
import type { VideoFinishSummary } from "@/components/video-dictation/video-finish-screen";

const GREEN = "#3dba5f";
/** YouTube's red, a little softer for a black page: the bar says this section is about video. */
export const VIDEO_RED = "#e5322d";

/**
 * The screen after a video's last sentence in the look of the Words, Stories and daily-lesson finish
 * pages (permission videoFinishLook): the accuracy and the words typed as two large numbers, a red bar
 * that fills with the share of words typed right the first time, the mistyped words as pale cards (a tap
 * says the word), and large buttons, one of which starts the training on the video's words. Every number
 * on it is about the typing, never about watching (YouTube's rules).
 */
export function VideoFinishLook({
  summary,
  youtubeId,
  nextLessonId,
  nextLessonTitle,
  trainingWords,
  wordClips,
  cleanWords,
}: {
  summary: VideoFinishSummary;
  youtubeId: string;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
  trainingWords: readonly TrainingWord[];
  /** The Word Lists voice's (Emma) clip of each word of the video, word -> URL. */
  wordClips: Readonly<Record<string, string>>;
  /** Words typed without a wrong letter, out of summary.wordsTyped. */
  cleanWords: number;
}) {
  const reduced = useReducedMotion();
  const { locale } = useLocale();
  const strings = videoStrings(locale);
  const speakWord = useWordClips(wordClips);
  const [training, setTraining] = useState(false);

  const total = Math.max(1, summary.wordsTyped);
  const percent = Math.round((cleanWords / total) * 100);
  const [shown, setShown] = useState(reduced ? summary.wordsTyped : 0);
  const [filled, setFilled] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const frame = requestAnimationFrame(() => setFilled(true));
    let step = 0;
    const steps = 24;
    const timer = setInterval(() => {
      step += 1;
      setShown(Math.min(summary.wordsTyped, Math.round((summary.wordsTyped * step) / steps)));
      if (step >= steps) clearInterval(timer);
    }, 35);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, [reduced, summary.wordsTyped]);

  if (training) {
    return (
      <VideoWordTraining
        words={trainingWords}
        wordClips={wordClips}
        nextLessonId={nextLessonId}
        onBack={() => setTraining(false)}
      />
    );
  }

  const actions: (StoryFinishAction & { tone?: "green" | "youtube"; external?: boolean })[] = [];
  if (nextLessonId) {
    actions.push({
      id: "next",
      label: nextLessonTitle ?? strings.nextVideo,
      href: `/learn/video/${nextLessonId}`,
    });
  }
  if (trainingWords.length > 0) {
    actions.push({
      id: "train",
      label: strings.trainButton,
      tone: "green",
      onClick: () => setTraining(true),
    });
  }
  actions.push({ id: "library", label: strings.backToLibrary, href: "/learn/video" });
  actions.push({
    id: "watch",
    label: strings.finishWatch,
    href: watchUrl(youtubeId),
    tone: "youtube",
    external: true,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black text-white">
      <div
        style={{ zoom: 0.9 }}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 py-8 sm:px-10"
      >
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-wrap items-end gap-x-12 gap-y-3" dir="ltr">
            <div className="flex items-end gap-3">
              <span
                style={{ color: summary.accuracy >= 80 ? GREEN : undefined }}
                className="text-[clamp(3.5rem,9vw,6.5rem)] leading-none font-extrabold tabular-nums"
              >
                {summary.accuracy}%
              </span>
              <span className="pb-3 text-lg font-medium tracking-wide text-white/50 uppercase">
                {strings.finishAccuracy}
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-[clamp(3.5rem,9vw,6.5rem)] leading-none font-extrabold tabular-nums">
                {shown}
              </span>
              <span className="pb-3 text-lg font-medium text-white/50">{strings.finishWords}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-lg font-medium text-white/70" dir="auto">
              {strings.finishBarLabel}
            </span>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              dir="ltr"
              className="relative h-4 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "#1a1010" }}
            >
              <motion.div
                initial={{ width: reduced ? `${percent}%` : "0%" }}
                animate={{ width: filled ? `${percent}%` : "0%" }}
                transition={reduced ? { duration: 0 } : { duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full overflow-hidden rounded-full"
                style={{ backgroundColor: VIDEO_RED }}
              >
                {!reduced && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ x: "-120%" }}
                    animate={{ x: "420%" }}
                    transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
                    className="absolute inset-y-0 w-1/4 bg-white/35"
                  />
                )}
              </motion.div>
            </div>
            <p className="min-h-6 text-base font-medium" style={{ color: "#f08a86" }} dir="auto">
              {percent >= 90 ? strings.finishBarGreat : strings.finishBarKeep}
            </p>
          </div>
        </motion.div>

        {summary.reviewWords.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-white/50" dir="auto">
              {strings.finishWordsLabel}
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summary.reviewWords.map((item) => (
                <li key={item.word}>
                  <motion.button
                    type="button"
                    onClick={() => speakWord(item.word)}
                    whileHover={reduced ? undefined : { y: -6, scale: 1.03 }}
                    whileTap={reduced ? undefined : { scale: 0.95, y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    style={{ background: "#ece9e0", color: "#14192b" }}
                    className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-3xl"
                  >
                    <span dir="ltr" className="text-2xl font-bold">
                      {item.word}
                    </span>
                    {item.meaning && (
                      <span dir="rtl" className="text-base" style={{ color: "#5a5f6e" }}>
                        {item.meaning}
                      </span>
                    )}
                  </motion.button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={
                (index === 0 && action.id === "next") ||
                // With the training button the row above holds two buttons: the YouTube button is as long as both.
                (action.id === "watch" && trainingWords.length > 0)
                  ? "col-span-2"
                  : undefined
              }
            >
              <FinishButton
                action={action}
                primary={index === 0 && action.id === "next"}
                tone={action.tone}
              >
                {action.id === "next" ? (
                  <span className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium text-[#5a5f6e]">{strings.nextVideo}</span>
                    <span dir="ltr">{action.label}</span>
                  </span>
                ) : (
                  action.label
                )}
              </FinishButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
