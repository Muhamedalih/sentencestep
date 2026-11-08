"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { CurrentWordLabel } from "@/components/learning/current-word-label";
import { TypingText } from "@/components/learning/typing-text";
import { useLocale } from "@/components/providers/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { trackVideoAction } from "@/lib/analytics/track-actions";
import { isMistakeWorthTracking, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { solveFitZoom } from "@/lib/today/fit-zoom";
import { getCurrentWordIndex, locateWordAtCharIndex } from "@/lib/typing";
import { cn } from "@/lib/utils";
import { watchUrl } from "@/lib/video-dictation/content";
import {
  isSameVideo,
  nextLead,
  nextRate,
  POLL_MS,
  replayPosition,
  segmentTick,
  START_LEAD_SECONDS,
} from "@/lib/video-dictation/segments";
import {
  meaningInSentence,
  pickReviewWords,
  recordMissedWord,
  wordsInVideo,
  type MissedWord,
} from "@/lib/video-dictation/finish-summary";
import { fill, videoStrings } from "@/lib/video-dictation/strings";
import type { VideoLesson, VideoSentence } from "@/lib/video-dictation/types";

import { useYouTubePlayer, type PlayerControls } from "./use-youtube-player";
import { VideoFinishRecorder } from "./video-finish-recorder";
import { VideoFinishScreen } from "./video-finish-screen";
import { VideoRatingPrompt } from "./video-rating-prompt";
import { VideoStopsEditor } from "./video-stops-editor";
import { PLAYER_STATE } from "./youtube-api";

/** The learner's choice to hide the words, remembered per browser: a convenience, never the source of truth for anything. */
const HIDE_WORDS_KEY = "sentencestep:video-hide-words";

type Phase = "armed" | "listening" | "typing" | "done";

/** What the page tells the learner once the last sentence is typed. */
interface Summary {
  accuracy: number;
  words: string[];
  /** For the new finish screen ("videoFinish"): one entry per sentence, true when a wrong letter was typed in it. */
  sentenceMistakes: boolean[];
  /** For the new finish screen: up to four mistyped words with their meaning (see pickReviewWords). */
  reviewWords: MissedWord[];
}

const ICON_BUTTON =
  "border-border text-foreground grid size-9 shrink-0 place-items-center rounded-xl border transition-colors disabled:opacity-40 pointer-coarse:size-11";

/**
 * Video dictation's practice screen: YouTube's own player on top, and under it the sentence the video
 * has just played, typed the way Stories are typed (the whole sentence shown faded, turning white as it
 * is typed, the word being typed with its meaning above it, a tap on any word for its meaning). The page
 * stops the video at the end of each sentence and carries on by itself once the sentence is typed.
 * The first play is YouTube's own play button, so the view counts for the channel.
 */
export function VideoSession({
  lesson,
  nextLessonId,
  nextLessonTitle = null,
  newFinish = false,
  canEditStops = false,
}: {
  lesson: VideoLesson;
  nextLessonId: string | null;
  /** The next video's title, named above "Next video" on the new finish screen. */
  nextLessonTitle?: string | null;
  /** The "videoFinish" permission: the finish screen in the lesson finish screen's look (VideoFinishScreen). */
  newFinish?: boolean;
  /** An Admin can move where each sentence starts and where the video stops (see VideoStopsEditor). */
  canEditStops?: boolean;
}) {
  const { locale } = useLocale();
  const strings = videoStrings(locale);
  // The sentences' times are state only so an Admin can move them by hand and test them at once.
  const [sentences, setSentences] = useState<VideoSentence[]>(lesson.sentences);
  const [editingStops, setEditingStops] = useState(false);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("armed");
  const [rate, setRate] = useState(1);
  const [hideWords, setHideWords] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);

  // What the player's own callbacks and the timers read: always the latest, never a stale render.
  const live = useRef<{ index: number; phase: Phase }>({ index: 0, phase: "armed" });
  const controlsRef = useRef<PlayerControls | null>(null);
  const pollRef = useRef<number | null>(null);
  const resumeRef = useRef<number | null>(null);
  // How much earlier than a sentence's end the stop is asked for, learned from this device's own delay
  // (see nextLead), and the end of the sentence the page has just stopped at, until the pause is measured.
  const leadRef = useRef(START_LEAD_SECONDS);
  const stopEndRef = useRef<number | null>(null);
  const stats = useRef({
    correct: 0,
    total: 0,
    words: new Set<string>(),
    // For the new finish screen: each mistyped word with its meaning, and the sentences typed with a wrong letter.
    missed: new Map<string, MissedWord>(),
    mistakeSentences: new Set<number>(),
  });

  // Analytics: the video was opened (VIDEO_STARTED), once per video shown; a reload counts again.
  const reportedOpen = useRef<string | null>(null);
  useEffect(() => {
    if (reportedOpen.current === lesson.id) return;
    reportedOpen.current = lesson.id;
    trackVideoAction({ event: "started", videoId: lesson.id }).catch(() => undefined);
  }, [lesson.id]);

  const move = useCallback((next: { index?: number; phase?: Phase }) => {
    if (next.index !== undefined) {
      live.current.index = next.index;
      setIndex(next.index);
    }
    if (next.phase !== undefined) {
      live.current.phase = next.phase;
      setPhase(next.phase);
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) window.clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  /** Reads the playhead until it reaches the end of the sentence, then pauses the video and hands over to typing. */
  const startPolling = useCallback(
    (endSeconds: number) => {
      stopPolling();
      let sawBefore = false;
      pollRef.current = window.setInterval(() => {
        const player = controlsRef.current;
        if (!player) return;
        if (!isSameVideo(player.getDuration(), lesson.durationSeconds)) {
          setAdPlaying(true);
          return;
        }
        setAdPlaying(false);
        const tick = segmentTick(sawBefore, player.getTime(), endSeconds - leadRef.current);
        sawBefore = tick.sawBefore;
        if (!tick.stop) return;
        stopPolling();
        stopEndRef.current = endSeconds;
        player.pause();
        move({ phase: "typing" });
        setFocusTick((n) => n + 1);
      }, POLL_MS);
    },
    [lesson.durationSeconds, move, stopPolling],
  );

  const replay = useCallback(() => {
    const player = controlsRef.current;
    const sentence = sentences[live.current.index];
    if (!player || !sentence || live.current.phase === "armed" || live.current.phase === "done")
      return;
    stopPolling();
    setNeedsTap(false);
    player.seekTo(replayPosition(sentence.startSeconds));
    player.play();
    move({ phase: "listening" });
    startPolling(sentence.endSeconds);
  }, [move, sentences, startPolling, stopPolling]);

  /** The Admin's "Test": plays one sentence from its replay start to its stop with the times as they are now. */
  const previewSentence = useCallback(
    (at: number) => {
      const player = controlsRef.current;
      const target = sentences[at];
      if (!player || !target) return;
      stopPolling();
      setNeedsTap(false);
      move({ index: at, phase: "listening" });
      player.seekTo(replayPosition(target.startSeconds));
      player.play();
      startPolling(target.endSeconds);
    },
    [move, sentences, startPolling, stopPolling],
  );

  const handleState = useCallback(
    (state: number) => {
      if (state === PLAYER_STATE.PAUSED && stopEndRef.current !== null) {
        // The page's own stop: where the video really paused tells how late this device answers.
        const end = stopEndRef.current;
        stopEndRef.current = null;
        const stoppedAt = controlsRef.current?.getTime();
        if (stoppedAt !== undefined) leadRef.current = nextLead(leadRef.current, stoppedAt, end);
        return;
      }
      if (state === PLAYER_STATE.ENDED && live.current.phase === "listening") {
        // The video itself ended while a sentence played: the last sentence can run to the very end of a video
        // (YouTube may even report a whole second more than the picture lasts), so the playhead never reaches
        // its stop. The end of the video is the stop. An ad's end is not.
        const player = controlsRef.current;
        if (!player || !isSameVideo(player.getDuration(), lesson.durationSeconds)) return;
        stopPolling();
        stopEndRef.current = null;
        move({ phase: "typing" });
        setFocusTick((n) => n + 1);
        return;
      }
      if (state !== PLAYER_STATE.PLAYING) return;
      const { phase: current, index: at } = live.current;
      const sentence = sentences[at];
      if (current === "armed" && sentence) {
        move({ phase: "listening" });
        startPolling(sentence.endSeconds);
        // Started with the mouse on YouTube's own button: the keyboard belongs to the sentence again.
        setFocusTick((n) => n + 1);
      } else if (current === "typing") {
        // The learner pressed YouTube's own play button while typing: hear this sentence again, then stop.
        replay();
        setFocusTick((n) => n + 1);
      }
    },
    [lesson.durationSeconds, move, replay, sentences, startPolling, stopPolling],
  );

  const { hostRef, failure, controls } = useYouTubePlayer({
    youtubeId: lesson.youtubeId,
    startSeconds: lesson.clipStartSeconds,
    onState: handleState,
  });
  controlsRef.current = controls;

  useEffect(
    () => () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
      if (resumeRef.current !== null) window.clearTimeout(resumeRef.current);
    },
    [],
  );

  // Shift pressed alone (not as part of a capital letter) plays the sentence, and again replays it from its start.
  useEffect(() => {
    let lone = false;
    const onDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        if (!event.repeat) lone = true;
      } else {
        lone = false;
      }
    };
    const onUp = (event: KeyboardEvent) => {
      if (event.key !== "Shift" || !lone) return;
      lone = false;
      const { phase: current } = live.current;
      if (current === "done") return;
      if (current === "armed") controlsRef.current?.play();
      else replay();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [replay]);

  useEffect(() => {
    try {
      setHideWords(window.localStorage.getItem(HIDE_WORDS_KEY) === "1");
    } catch {
      // Storage is blocked: the words stay shown.
    }
  }, []);

  const toggleHideWords = () => {
    setHideWords((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(HIDE_WORDS_KEY, next ? "1" : "0");
      } catch {
        // Not remembered, which only costs the learner one more tap next time.
      }
      return next;
    });
    setFocusTick((n) => n + 1);
  };

  const cycleRate = () => {
    const next = nextRate(rate);
    controls.setRate(next);
    setRate(next);
    setFocusTick((n) => n + 1);
  };

  /** The sentence is typed whole: on to the next one, or the end. */
  const handleSentenceDone = useCallback(() => {
    const player = controlsRef.current;
    const next = live.current.index + 1;
    if (next >= sentences.length) {
      stopPolling();
      player?.pause();
      const { correct, total, words, missed, mistakeSentences } = stats.current;
      setSummary({
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 100,
        words: [...words].slice(0, 8),
        sentenceMistakes: sentences.map((_, at) => mistakeSentences.has(at)),
        reviewWords: pickReviewWords(missed.values()),
      });
      move({ phase: "done" });
      return;
    }
    const sentence = sentences[next];
    if (!sentence) return;
    setNeedsTap(false);
    move({ index: next, phase: "listening" });
    if (player && player.getState() !== PLAYER_STATE.PLAYING) {
      player.play();
      // A phone can refuse to start a video that no tap started: the button below is then the tap.
      if (resumeRef.current !== null) window.clearTimeout(resumeRef.current);
      resumeRef.current = window.setTimeout(() => {
        if (live.current.phase === "listening" && player.getState() !== PLAYER_STATE.PLAYING)
          setNeedsTap(true);
      }, 1200);
    }
    startPolling(sentence.endSeconds);
  }, [move, sentences, startPolling, stopPolling]);

  const handleKeystroke = useCallback((correct: boolean) => {
    stats.current.total += 1;
    if (correct) stats.current.correct += 1;
    else stats.current.mistakeSentences.add(live.current.index);
  }, []);

  const handleMistakeWord = useCallback((word: string, meaning: string) => {
    stats.current.words.add(word);
    recordMissedWord(stats.current.missed, word, meaning);
  }, []);

  const tapToContinue = () => {
    setNeedsTap(false);
    controls.play();
  };

  const sentence = sentences[index];
  const progress = phase === "done" ? 100 : (index / Math.max(1, sentences.length)) * 100;

  if (failure) {
    return (
      <Shell>
        <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold" dir="auto">
            {strings.unavailableTitle}
          </h1>
          <p className="text-muted-foreground" dir="auto">
            {failure === "blocked" ? strings.blockedBody : strings.unavailableBody}
          </p>
          <Link href="/learn/video" className={buttonVariants({ variant: "outline" })}>
            <span dir="auto">{strings.backToLibrary}</span>
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell stage={phase !== "done"} makeRoom={canEditStops && editingStops && phase !== "done"}>
      <header className="mx-auto flex w-full max-w-[640px] items-center gap-3 px-4 pt-3 pb-2 lg:max-w-[1000px]">
        <Link href="/learn/video" aria-label={strings.back} className={ICON_BUTTON}>
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-semibold" dir="ltr">
            {lesson.title}
          </p>
          <p className="text-muted-foreground text-[11px] tabular-nums" dir="auto">
            {fill(strings.progress, {
              n: Math.min(phase === "done" ? sentences.length : index + 1, sentences.length),
              total: sentences.length,
            })}
          </p>
        </div>
        {phase !== "done" && (
          <div className="flex gap-1.5">
            {canEditStops && (
              <button
                type="button"
                onClick={() => setEditingStops((open) => !open)}
                aria-pressed={editingStops}
                aria-label={strings.stopsOpen}
                title={strings.stopsOpen}
                className={cn(ICON_BUTTON, editingStops && "bg-brand-muted border-transparent")}
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={replay}
              disabled={phase === "armed"}
              aria-label={strings.replay}
              title={strings.replay}
              className={ICON_BUTTON}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={cycleRate}
              aria-label={strings.slow}
              title={strings.slow}
              className={cn(ICON_BUTTON, rate !== 1 && "bg-brand-muted border-transparent")}
            >
              {rate === 1 ? (
                <Gauge className="size-4" aria-hidden="true" />
              ) : (
                <span className="text-[11px] font-semibold tabular-nums">{rate}×</span>
              )}
            </button>
            <button
              type="button"
              onClick={toggleHideWords}
              aria-pressed={hideWords}
              aria-label={hideWords ? strings.showWords : strings.hideWords}
              title={hideWords ? strings.showWords : strings.hideWords}
              className={cn(ICON_BUTTON, hideWords && "bg-brand-muted border-transparent")}
            >
              {hideWords ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </header>
      <div className="bg-muted/70 h-[3px] w-full">
        <div
          className="bg-primary h-full transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main
        className={cn(
          "mx-auto flex w-full max-w-[640px] flex-1 flex-col px-4 pt-3 pb-8",
          // Laptop and wider: one screen without scrolling (see FitArea): the video is sized from the window's height and the sentence fills what is left.
          phase !== "done" && "lg:min-h-0 lg:max-w-[1000px] lg:items-center lg:pt-2 lg:pb-3",
        )}
      >
        {/* The player stays mounted on the finish screen too, only hidden, so the video is never reloaded. */}
        <div className={cn(phase === "done" ? "hidden" : "lg:flex lg:justify-center")}>
          <div className="lg:w-fit lg:max-w-full">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black lg:h-[max(11rem,min(48svh,calc(100svh-340px)))] lg:w-auto">
              <div ref={hostRef} className="absolute inset-0 [&_iframe]:size-full" />
            </div>
            <div
              className="text-muted-foreground mt-2 flex items-center justify-between gap-2 text-xs"
              dir="ltr"
            >
              <a
                href={lesson.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:underline"
              >
                {lesson.channel}
              </a>
              <a
                href={watchUrl(lesson.youtubeId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex shrink-0 items-center gap-1 hover:underline"
              >
                {strings.watchOnYouTube}
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {phase === "done" && summary ? (
          <Finish
            lesson={lesson}
            summary={summary}
            nextLessonId={nextLessonId}
            nextLessonTitle={nextLessonTitle}
            newFinish={newFinish}
            wordsTyped={wordsInVideo(sentences)}
            count={sentences.length}
          />
        ) : (
          sentence && (
            <>
              <FitArea watch={sentence.id}>
                <div className="lg:hidden">
                  {phase === "armed" && (
                    <p className="mb-3 text-center text-[15px]" dir="auto">
                      {strings.pressPlay}
                      <span className="text-muted-foreground mt-1 block text-[13px]">
                        {strings.pressPlayHint}
                      </span>
                    </p>
                  )}
                  {adPlaying && (
                    <p className="text-muted-foreground mb-3 text-center text-[13px]" dir="auto">
                      {strings.adPlaying}
                    </p>
                  )}
                </div>
                <SentenceTyper
                  key={sentence.id}
                  sentence={sentence}
                  hideWords={hideWords}
                  dim={phase === "armed"}
                  focusTick={focusTick}
                  onKeystroke={handleKeystroke}
                  onMistakeWord={handleMistakeWord}
                  onComplete={handleSentenceDone}
                />
                <div className="lg:hidden">
                  {phase === "listening" && !needsTap && !adPlaying && index > 0 && (
                    <p className="text-muted-foreground mt-3 text-center text-[13px]" dir="auto">
                      {strings.resumingSoon}
                    </p>
                  )}
                  {needsTap && (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={tapToContinue}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        <Play className="size-4" aria-hidden="true" />
                        <span dir="auto">{strings.continueNow}</span>
                      </button>
                    </div>
                  )}
                </div>
              </FitArea>
              {/* Laptop and wider: the one-line hints live in a strip of their own, so they never change the size of the sentence above. */}
              <div
                className="hidden h-9 shrink-0 items-center justify-center gap-2 text-center text-[13px] lg:flex"
                dir="auto"
              >
                {phase === "armed" ? (
                  <span>
                    <span className="text-[15px]">{strings.pressPlay}</span>
                    <span className="text-muted-foreground"> · {strings.pressPlayHint}</span>
                  </span>
                ) : adPlaying ? (
                  <span className="text-muted-foreground">{strings.adPlaying}</span>
                ) : needsTap ? (
                  <button
                    type="button"
                    onClick={tapToContinue}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Play className="size-4" aria-hidden="true" />
                    <span dir="auto">{strings.continueNow}</span>
                  </button>
                ) : phase === "listening" && index > 0 ? (
                  <span className="text-muted-foreground">{strings.resumingSoon}</span>
                ) : null}
              </div>
            </>
          )
        )}
      </main>
      {canEditStops && editingStops && phase !== "done" && (
        <VideoStopsEditor
          videoId={lesson.id}
          sentences={sentences}
          current={index}
          getTime={() => controlsRef.current?.getTime()}
          onChange={setSentences}
          onTest={previewSentence}
          onClose={() => setEditingStops(false)}
        />
      )}
    </Shell>
  );
}

/**
 * Where the typed sentence sits. Below laptop width it is a plain block (nothing changes). From laptop width
 * up it takes all the height the video leaves and sets one number, `--stage-zoom`, the largest at which the
 * sentence and its translation (their font sizes are multiplied by it) still fit, so a long sentence gets a
 * smaller type and a short one a bigger type and nothing ever scrolls. It is a font size, not CSS `zoom`: the
 * typing underline is placed from the letters' measured positions, which a zoomed parent would throw off.
 * It measures again when the sentence or the window changes.
 */
function FitArea({ children, watch }: { children: ReactNode; watch: string }) {
  const blockRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const block = blockRef.current;
    const measure = measureRef.current;
    if (!block || !measure) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    let frame = 0;

    const fit = () => {
      if (!wide.matches) {
        block.style.removeProperty("--stage-zoom");
        return;
      }
      const zoom = solveFitZoom(
        (candidate) => {
          block.style.setProperty("--stage-zoom", String(candidate));
          return measure.getBoundingClientRect().height;
        },
        block.clientHeight,
        { min: 0.5, max: 1.25 },
      );
      block.style.setProperty("--stage-zoom", String(zoom));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    const observer = new ResizeObserver(schedule);
    observer.observe(block);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [watch]);

  return (
    <div
      ref={blockRef}
      className="mt-4 flex-1 lg:mt-1 lg:flex lg:min-h-0 lg:w-full lg:items-center lg:justify-center"
    >
      <div ref={measureRef} className="lg:w-full">
        {children}
      </div>
    </div>
  );
}

function Shell({
  children,
  stage = false,
  makeRoom = false,
}: {
  children: ReactNode;
  stage?: boolean;
  /** The Admin's stops editor is open at the right edge (laptop and wider): the screen leaves its width free. */
  makeRoom?: boolean;
}) {
  return (
    <div
      className={cn(
        "lesson-shell bg-background text-foreground flex min-h-svh flex-col",
        // The practice screen on a laptop is one screen: exactly the window's height, nothing scrolls.
        stage && "lg:h-svh lg:overflow-hidden",
        makeRoom && "lg:pr-[410px]",
      )}
    >
      {children}
    </div>
  );
}

/** One sentence typed the Stories way: its own typing engine, remounted for every sentence (keyed by its id). */
function SentenceTyper({
  sentence,
  hideWords,
  dim,
  focusTick,
  onKeystroke,
  onMistakeWord,
  onComplete,
}: {
  sentence: VideoSentence;
  hideWords: boolean;
  /** Before the first play: the sentence is there but nothing is asked yet. */
  dim: boolean;
  focusTick: number;
  onKeystroke: (correct: boolean) => void;
  /** A mistyped word (normalised) and its meaning in this sentence ("" when the file has none). */
  onMistakeWord: (word: string, meaning: string) => void;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const { speakWord } = useSpeech();
  const engine = useTypingEngine({
    target: sentence.en,
    resetKey: sentence.id,
    onComplete: () => onComplete(),
    onCorrectChar: () => onKeystroke(true),
    onErrorChar: () => onKeystroke(false),
  });
  const { inputRef, errorIndex } = engine;

  // After the video stops, or a button was pressed, the keyboard goes back to the sentence.
  useEffect(() => {
    if (focusTick === 0) return;
    // After a click on YouTube's player the keyboard sits inside its iframe: take it back first.
    const active = document.activeElement;
    if (active instanceof HTMLIFrameElement) active.blur();
    window.focus();
    inputRef.current?.focus();
  }, [focusTick, inputRef]);

  // A word with a wrong letter is remembered once per letter hit, to be offered again at the end.
  useEffect(() => {
    if (errorIndex === null) return;
    const located = locateWordAtCharIndex(sentence.en, errorIndex);
    if (located && isMistakeWorthTracking(located.word)) {
      const word = normalizeMistakeWord(located.word);
      onMistakeWord(word, meaningInSentence(sentence, word));
    }
  }, [errorIndex, onMistakeWord, sentence]);

  const glosses = useMemo(
    () => sentence.wordTranslations.map((word) => ({ en: word.en, text: word.ar })),
    [sentence.wordTranslations],
  );
  const current = glosses[getCurrentWordIndex(sentence.en, engine.typed.length)];
  const label = current
    ? {
        en: hideWords ? "•".repeat(Math.min(current.en.length, 8)) : current.en,
        text: current.text,
      }
    : undefined;

  return (
    <div className={cn("transition-opacity", dim && "opacity-60")}>
      <div className="mb-1 min-h-[3.25rem] lg:flex lg:justify-center">
        <CurrentWordLabel word={label} dir="rtl" />
      </div>
      <TypingText
        target={sentence.en}
        typed={engine.typed}
        letterStates={engine.letterStates}
        inputRef={inputRef}
        onChange={engine.handleChange}
        onPaste={engine.handlePaste}
        reducedMotion={reducedMotion}
        textClassName="font-serif text-[1.75rem] sm:text-[2.5rem] lg:text-[calc(3.3rem*var(--stage-zoom,1))] lg:leading-[1.2] lg:text-center lesson-sentence"
        onWordClick={(word) => speakWord(word.replace(/[^\p{L}\p{N}']/gu, ""))}
        wordTranslations={glosses}
        translationDir="rtl"
        obscureUntyped={hideWords}
        errorChar={engine.errorChar}
        autoFocus={false}
      />
      <p
        className="mt-4 text-lg text-[var(--lesson-subtitle)] select-none sm:text-xl lg:text-center lg:text-[calc(1.7rem*var(--stage-zoom,1))]"
        dir="rtl"
      >
        {sentence.ar}
      </p>
    </div>
  );
}

function Finish({
  lesson,
  summary,
  nextLessonId,
  nextLessonTitle,
  newFinish,
  wordsTyped,
  count,
}: {
  lesson: VideoLesson;
  summary: Summary;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
  newFinish: boolean;
  wordsTyped: number;
  count: number;
}) {
  const { locale } = useLocale();
  const strings = videoStrings(locale);
  // Analytics: this finish screen was reached (VIDEO_FINISHED), every time, a repeat too.
  const reportedFinish = useRef(false);
  useEffect(() => {
    if (reportedFinish.current) return;
    reportedFinish.current = true;
    trackVideoAction({
      event: "finished",
      videoId: lesson.id,
      accuracy: summary.accuracy / 100,
    }).catch(() => undefined);
  }, [lesson.id, summary.accuracy]);
  // The "videoFinish" permission: the same recording and rating card, in the lesson finish screen's look.
  if (newFinish)
    return (
      <>
        <VideoFinishRecorder videoId={lesson.id} />
        <VideoRatingPrompt videoId={lesson.id} />
        <VideoFinishScreen
          summary={{
            accuracy: summary.accuracy,
            sentenceMistakes: summary.sentenceMistakes,
            reviewWords: summary.reviewWords,
            wordsTyped,
          }}
          youtubeId={lesson.youtubeId}
          nextLessonId={nextLessonId}
          nextLessonTitle={nextLessonTitle}
        />
      </>
    );
  return (
    <div className="flex flex-1 flex-col gap-5 pt-4">
      <VideoFinishRecorder videoId={lesson.id} />
      <VideoRatingPrompt videoId={lesson.id} />
      <div>
        <h1 className="text-2xl font-bold" dir="auto">
          {strings.finishTitle}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm" dir="ltr">
          {lesson.title} · {lesson.channel}
        </p>
      </div>
      <div className="border-border/60 bg-muted/30 rounded-2xl border p-5">
        <p className="text-5xl font-bold tabular-nums">{summary.accuracy}%</p>
        <p className="text-muted-foreground mt-2" dir="auto">
          {fill(strings.accuracyLine, { percent: summary.accuracy, count })}
        </p>
        <div className="bg-muted mt-4 h-1 overflow-hidden rounded-full">
          <div className="bg-primary h-full" style={{ width: `${summary.accuracy}%` }} />
        </div>
      </div>
      {summary.words.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-2 text-[13px] font-semibold" dir="auto">
            {strings.reviewWords}
          </p>
          <div className="flex flex-wrap gap-2" dir="ltr">
            {summary.words.map((word) => (
              <span key={word} className="border-border rounded-full border px-3 py-1 text-[13px]">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto flex flex-col gap-3 pt-6">
        {nextLessonId && (
          <Link
            href={`/learn/video/${nextLessonId}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            <span dir="auto">{strings.nextVideo}</span>
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        )}
        <a
          href={watchUrl(lesson.youtubeId)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
        >
          <span dir="auto">{strings.watchFull}</span>
          <ExternalLink className="size-5" aria-hidden="true" />
        </a>
        <Link href="/learn/video" className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>
          <span dir="auto">{strings.backToLibrary}</span>
        </Link>
        <p className="text-muted-foreground text-center text-xs" dir="auto">
          {fill(strings.videoFrom, { channel: lesson.channel })}
        </p>
      </div>
    </div>
  );
}
