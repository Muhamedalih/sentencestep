"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Volume2 } from "lucide-react";

import { LessonSettings } from "@/components/learning/lesson-settings";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { SharedInputHost, SharedInputProvider } from "@/components/learning/shared-input";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { LadderRoundBar } from "@/components/words/ladder/ladder-round-bar";
import { WordPosBadge } from "@/components/words/word-pos-badge";
import { Button } from "@/components/ui/button";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { useWordsRoundTracking } from "@/hooks/use-words-round-tracking";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { splitAroundWord } from "@/lib/passages/text";
import { cn } from "@/lib/utils";
import { recordBankWordAction } from "@/lib/word-bank/actions";
import { scrambleLetters } from "@/lib/word-ladder/options";
import {
  buildQueue,
  ladderOutcome,
  retryOf,
  type LadderCard,
  type LadderStep,
} from "@/lib/word-ladder/sequence";
import { ladderStrings, type LadderStrings } from "@/lib/word-ladder/strings";
import type { LadderWord } from "@/lib/word-ladder/types";
import { formatIpa } from "@/lib/word-lists-ipa";
import type { WordOutcome } from "@/lib/word-mastery/schedule";
import { BLANK_TOKEN } from "@/types/word-lists";

/** How one word went through the round, kept for the finish screen. */
interface Run {
  earlierMisses: number;
  typedFirst: boolean | null;
  typedRight: boolean;
}

export interface LadderRoundProps {
  words: LadderWord[];
  /** Which round of the topic this is, how many rounds it has, and how many of its words are finished. */
  number: number;
  count: number;
  done: number;
  total: number;
  group: { id: string; title: string; supportTitle?: string };
  voiceId: string | null;
  /** The words bank is open for this learner: the words of the round are handed to it. */
  bankFeed: boolean;
  todayISO: string;
  /** A word was typed right: the topic's progress and the visit's own count are updated by the parent. */
  onWordComplete: (wordId: string) => void;
  /** The round that follows this one (its number), or null when the topic is finished. */
  nextNumber: number | null;
  onNext: () => void;
}

/** A miss on the typed step shows the right spelling; the others show their own feedback in place. */
const CORRECT_DELAY_MS = 450;
const WRONG_DELAY_MS = 1200;

/**
 * One round of three words of a Word Lists topic: five steps, each asked about every word before the
 * next step begins (see buildQueue). Only the typed step counts as learned; the others are the
 * scaffolding that gets the word there. A wrong answer in any step earns that screen once more at
 * the end of the round. The first typed answer of each word is what the learner's records hear.
 */
export function LadderRound({
  words,
  number,
  count,
  done,
  total,
  group,
  voiceId,
  bankFeed,
  todayISO,
  onWordComplete,
  nextNumber,
  onNext,
}: LadderRoundProps) {
  const { locale } = useLocale();
  const s = ladderStrings(locale);
  const reducedMotion = useReducedMotion() ?? false;
  const byId = useMemo(() => new Map(words.map((word) => [word.id, word])), [words]);
  const seed = useMemo(
    () => `${group.id}:${words.map((word) => word.id).join(",")}`,
    [group.id, words],
  );

  const [queue, setQueue] = useState<LadderCard[]>(() => buildQueue(words, seed));
  const [pos, setPos] = useState(0);
  const [runs, setRuns] = useState<Record<string, Run>>(() =>
    Object.fromEntries(
      words.map((word) => [word.id, { earlierMisses: 0, typedFirst: null, typedRight: false }]),
    ),
  );
  const [typedWrong, setTypedWrong] = useState<string | null>(null);

  const finished = pos >= queue.length;
  const card = queue[pos];
  const word = card ? byId.get(card.wordId) : undefined;

  const inputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<PronunciationButtonHandle>(null);
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "wordLists");
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });
  const tracking = useWordsRoundTracking("ladder", words.length);

  // The round's three words are resolved in the background, so their speakers find the sound cached.
  const { prefetchPronunciation } = usePronunciationSettings();
  useEffect(() => {
    if (!voiceId) return;
    for (const item of words) {
      if (item.audioUrl) continue;
      prefetchPronunciation({ contentType: "word", contentId: item.id, voiceId });
    }
  }, [words, voiceId, prefetchPronunciation]);

  // What the handlers read: the typing engine may hold on to an older render's callback.
  const live = useRef({ card, word, runs, queue });
  live.current = { card, word, runs, queue };

  useEffect(() => {
    if (finished) tracking.finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the last screen is done
  }, [finished]);

  const feedback = useCallback(
    (correct: boolean) => {
      if (correct) {
        playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "wordLists"));
      } else {
        play("error");
      }
    },
    [play, playSentenceComplete, typingSoundSettings],
  );

  const advance = useCallback(() => {
    setTypedWrong(null);
    setPos((current) => current + 1);
  }, []);

  /** Tells the learner's records how a word's first typed answer went: the bank (when it is open) and the round's tally. */
  const report = useCallback(
    (target: LadderWord, outcome: WordOutcome) => {
      tracking.note(target.id, outcome);
      if (!bankFeed) return;
      void recordBankWordAction({
        word: target.word,
        outcome,
        todayISO,
        source: "lesson",
        lessonId: `wordlist:${group.id}`,
        lessonTitle: group.title,
        ar: target.term || undefined,
        homeSentence: target.sentence,
      }).catch(() => {});
    },
    [bankFeed, group.id, group.title, todayISO, tracking],
  );

  /** A choice or the letters settled: a miss counts against the word and earns the screen once more at the end. */
  const settle = useCallback(
    (correct: boolean) => {
      const { card: current } = live.current;
      if (!current) return;
      feedback(correct);
      if (!correct) {
        setRuns((previous) => ({
          ...previous,
          [current.wordId]: {
            ...previous[current.wordId]!,
            earlierMisses: previous[current.wordId]!.earlierMisses + 1,
          },
        }));
        const again = retryOf(current);
        if (again) setQueue((previous) => [...previous, again]);
      }
      advance();
    },
    [advance, feedback],
  );

  /** The typed step: the first answer is what the records hear, a right one finishes the word. */
  const typed = useCallback(
    (correct: boolean, written: string) => {
      const { card: current, word: target, runs: all } = live.current;
      if (!current || !target) return;
      feedback(correct);
      const previous = all[target.id]!;
      const first = !current.retry;
      const next: Run = {
        earlierMisses: previous.earlierMisses,
        typedFirst: first ? correct : previous.typedFirst,
        typedRight: previous.typedRight || correct,
      };
      setRuns((state) => ({ ...state, [target.id]: next }));
      if (first) {
        const outcome = ladderOutcome({ earlierMisses: next.earlierMisses, typedFirst: correct });
        if (outcome) report(target, outcome);
        if (!correct) {
          const again = retryOf(current);
          if (again) setQueue((state) => [...state, again]);
        }
      }
      if (correct && !previous.typedRight) onWordComplete(target.id);
      if (correct) advance();
      else setTypedWrong(written.trim().slice(0, 40));
    },
    [advance, feedback, onWordComplete, report],
  );

  const step: LadderStep | null = card?.step ?? null;
  const audio = step === "meet" || step === "listen" || step === "type";
  const replay = useCallback(() => settingsRef.current?.replay(), []);

  // Position of this screen inside its step ("1 of 3"). The screens a miss adds at the end carry no
  // position: they are a second go, not a fourth word.
  const stepScreens = card ? queue.filter((item) => item.step === card.step && !item.retry) : [];
  const stepIndex = card ? stepScreens.indexOf(card) + 1 : 0;
  const stepLabel = step
    ? {
        meet: s.stepMeet,
        meaning: s.stepMeaning,
        listen: s.stepListen,
        letters: s.stepLetters,
        type: s.stepType,
      }[step]
    : "";
  const caption = !card
    ? ""
    : card.retry
      ? stepLabel
      : `${stepLabel} · ${s.position(stepIndex, stepScreens.length)}`;

  return (
    <SharedInputProvider>
      <div className="h-app relative flex w-full flex-col">
        <SharedInputHost />
        {!finished && audio && typedWrong === null && <ShiftReplayHint />}
        <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5 [html[data-keyboard]_&]:pt-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Link
              href="/learn/word-lists"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 justify-self-start text-sm font-medium pointer-coarse:min-h-11"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {s.back}
            </Link>
            <LadderProgress queue={queue} pos={pos} finished={finished} />
            <div className="flex items-center gap-3 justify-self-end">
              <span className="text-muted-foreground text-sm font-medium" dir="auto">
                {s.nextRound(number)}
              </span>
              {!finished && word && (
                <LessonSettings
                  ref={settingsRef}
                  text={word.word}
                  audioUrl={word.audioUrl}
                  autoPlay={audio && typedWrong === null}
                  resetKey={`${pos}:${word.id}:${card?.step}`}
                  inputRef={inputRef}
                  kokoroVoiceId={voiceId}
                  contentType="word"
                  contentId={word.id}
                />
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div
              key="finish"
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 items-center justify-center px-6 py-8 lg:px-16"
            >
              <Finish
                s={s}
                words={words}
                runs={runs}
                number={number}
                count={count}
                done={done}
                total={total}
                title={group.title}
                bankFeed={bankFeed}
                nextNumber={nextNumber}
                onNext={onNext}
              />
            </motion.div>
          ) : (
            card &&
            word && (
              <motion.div
                key={`${pos}:${card.wordId}:${card.step}`}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6 text-center lg:px-16 [html[data-keyboard]_&]:gap-3 [html[data-keyboard]_&]:py-3"
              >
                <p
                  className="text-muted-foreground text-[12.5px] font-semibold tracking-wide"
                  dir="auto"
                >
                  {caption}
                </p>
                {card.step === "meet" && (
                  <MeetScreen s={s} word={word} onSpeak={replay} onNext={advance} />
                )}
                {card.step === "meaning" && (
                  <ChoiceScreen
                    key={`m${pos}`}
                    kind="meaning"
                    word={word}
                    options={word.meaningOptions}
                    answer={word.term}
                    onSettled={settle}
                  />
                )}
                {card.step === "listen" && (
                  <ChoiceScreen
                    key={`l${pos}`}
                    kind="listen"
                    word={word}
                    options={word.spellingOptions}
                    answer={word.word}
                    onSettled={settle}
                    onSpeak={replay}
                    listenLabel={s.listen}
                  />
                )}
                {card.step === "letters" && (
                  <LettersScreen
                    key={`t${pos}`}
                    s={s}
                    word={word}
                    seed={`${seed}:${card.wordId}:${card.retry ? 1 : 0}`}
                    onSettled={settle}
                  />
                )}
                {card.step === "type" && (
                  <TypeScreen
                    s={s}
                    word={word}
                    retry={card.retry}
                    wrong={typedWrong}
                    inputRef={inputRef}
                    fontFamily={sectionFontFamily}
                    onSpeak={replay}
                    onResult={typed}
                    onContinue={advance}
                    willReturn={!card.retry}
                  />
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </SharedInputProvider>
  );
}

/** The five-step bar of the top: a step is full once all its screens are done. */
function LadderProgress({
  queue,
  pos,
  finished,
}: {
  queue: LadderCard[];
  pos: number;
  finished: boolean;
}) {
  const steps: LadderStep[] = ["meet", "meaning", "listen", "letters", "type"];
  return (
    <div className="flex w-[190px] gap-1.5 sm:w-[300px]" dir="ltr" aria-hidden="true">
      {steps.map((step) => {
        // The screens a miss adds at the end are not counted: a step never un-fills.
        const screens = queue
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => item.step === step && !item.retry);
        const doneScreens = finished
          ? screens.length
          : screens.filter(({ index }) => index < pos).length;
        const width = screens.length === 0 ? 100 : (doneScreens / screens.length) * 100;
        return (
          <span key={step} className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
            <span
              className="bg-primary block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${width}%` }}
            />
          </span>
        );
      })}
    </div>
  );
}

/** Step 1: the word, how it sounds, what kind of word it is, what it means, and the sentence it lives in. */
function MeetScreen({
  s,
  word,
  onSpeak,
  onNext,
}: {
  s: LadderStrings;
  word: LadderWord;
  onSpeak: () => void;
  onNext: () => void;
}) {
  const { dir } = useLocale();
  useEnterToContinue(true, onNext);
  const ipa = formatIpa(word.ipa);
  const parts = splitAroundWord(word.sentence, word.word);
  return (
    <>
      <p
        className="text-foreground text-[clamp(3.5rem,2.6rem+4vw,5.5rem)] leading-none font-bold tracking-tight"
        dir="ltr"
      >
        {word.word}
      </p>
      <div className="flex items-center gap-3">
        <WordPosBadge pos={word.pos} />
        {ipa && (
          <span className="text-muted-foreground text-lg" dir="ltr">
            {ipa}
          </span>
        )}
        <button
          type="button"
          aria-label={s.listen}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onSpeak}
          className="border-border bg-card text-foreground focus-visible:ring-ring grid size-10 place-items-center rounded-[10px] border outline-none focus-visible:ring-2"
        >
          <Volume2 className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
      <div className="flex max-w-2xl flex-col items-center gap-1.5">
        <p
          className="text-foreground text-[clamp(1.8rem,1.4rem+1.8vw,2.3rem)] leading-tight font-semibold text-balance"
          dir={dir}
        >
          {word.term}
        </p>
        {word.definition && (
          <p className="text-muted-foreground text-base" dir={dir}>
            {word.definition}
          </p>
        )}
      </div>
      <p className="text-foreground/85 max-w-2xl text-lg" dir="ltr">
        {parts ? (
          <>
            {parts[0]}
            <span className="bg-primary/15 text-primary rounded-md px-2 py-px font-semibold">
              {parts[1]}
            </span>
            {parts[2]}
          </>
        ) : (
          word.sentence
        )}
      </p>
      <Button size="lg" onClick={onNext}>
        {s.next}
      </Button>
    </>
  );
}

/** Steps 2 and 3: the word (or its sound) and up to four choices; keys 1 to 4 choose. A right choice moves on at once, a wrong one shows the right one first. */
function ChoiceScreen({
  kind,
  word,
  options,
  answer,
  onSettled,
  onSpeak,
  listenLabel,
}: {
  kind: "meaning" | "listen";
  word: LadderWord;
  options: string[];
  answer: string;
  onSettled: (correct: boolean) => void;
  onSpeak?: () => void;
  listenLabel?: string;
}) {
  const { dir } = useLocale();
  const [chosen, setChosen] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const settled = useRef(onSettled);
  settled.current = onSettled;

  const pick = useCallback(
    (index: number) => {
      if (chosen !== null || index < 0 || index >= options.length) return;
      setChosen(index);
      const right = options[index] === answer;
      timer.current = window.setTimeout(
        () => settled.current(right),
        right ? CORRECT_DELAY_MS : WRONG_DELAY_MS,
      );
    },
    [answer, chosen, options],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 4) {
        event.preventDefault();
        pick(digit - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick]);

  return (
    <>
      {kind === "meaning" ? (
        <p
          className="text-foreground text-[clamp(3rem,2.4rem+3vw,4.5rem)] leading-none font-bold tracking-tight"
          dir="ltr"
        >
          {word.word}
        </p>
      ) : (
        <button
          type="button"
          aria-label={listenLabel}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onSpeak}
          className="border-border bg-card text-primary focus-visible:ring-ring grid size-[104px] place-items-center rounded-2xl border outline-none focus-visible:ring-2"
        >
          <Volume2 className="size-9" aria-hidden="true" />
        </button>
      )}
      <div className="grid w-full max-w-[780px] grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option, index) => {
          const right = option === answer;
          const state =
            chosen === null ? "idle" : right ? "right" : chosen === index ? "wrong" : "dim";
          return (
            <button
              key={`${index}:${option}`}
              type="button"
              disabled={chosen !== null}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(index)}
              className={cn(
                "relative flex min-h-[58px] items-center justify-center rounded-xl border px-12 py-3 text-xl font-medium transition-colors sm:min-h-[68px]",
                state === "idle" &&
                  "border-border bg-card hover:border-primary/60 hover:bg-muted/40",
                state === "right" && "border-success bg-success/10",
                state === "wrong" && "border-destructive bg-destructive/10",
                state === "dim" && "border-border bg-card opacity-60",
              )}
            >
              <kbd className="border-border text-muted-foreground absolute top-1/2 left-3.5 hidden size-6 -translate-y-1/2 place-items-center rounded-md border text-xs font-semibold sm:grid [html[data-keyboard]_&]:grid">
                {index + 1}
              </kbd>
              <span dir={kind === "meaning" ? dir : "ltr"}>{option}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Step 4: the meaning stays on screen and the word's letters are put in order, tapped or typed on the keyboard. */
function LettersScreen({
  s,
  word,
  seed,
  onSettled,
}: {
  s: LadderStrings;
  word: LadderWord;
  seed: string;
  onSettled: (correct: boolean) => void;
}) {
  const { dir } = useLocale();
  const tiles = useMemo(() => scrambleLetters(word.word, seed), [word.word, seed]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<"right" | "wrong" | null>(null);
  const placedRef = useRef<number[]>([]);
  const resultRef = useRef<"right" | "wrong" | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const settled = useRef(onSettled);
  settled.current = onSettled;

  const update = useCallback((next: number[]) => {
    placedRef.current = next;
    setPlaced(next);
  }, []);

  const place = useCallback(
    (tile: number) => {
      if (resultRef.current || placedRef.current.includes(tile)) return;
      const next = [...placedRef.current, tile];
      update(next);
      if (next.length < tiles.length) return;
      const right = next.map((index) => tiles[index]).join("") === word.word;
      resultRef.current = right ? "right" : "wrong";
      setResult(resultRef.current);
      timer.current = window.setTimeout(
        () => settled.current(right),
        right ? CORRECT_DELAY_MS : WRONG_DELAY_MS,
      );
    },
    [tiles, update, word.word],
  );

  const remove = useCallback(
    (from: number) => {
      if (resultRef.current) return;
      update(placedRef.current.slice(0, from));
    },
    [update],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "Backspace") {
        event.preventDefault();
        remove(Math.max(0, placedRef.current.length - 1));
        return;
      }
      if (!/^[a-zA-Z]$/.test(event.key)) return;
      const letter = event.key.toLowerCase();
      const index = tiles.findIndex((tile, i) => tile === letter && !placedRef.current.includes(i));
      if (index !== -1) {
        event.preventDefault();
        place(index);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [place, remove, tiles]);

  return (
    <>
      <div className="flex max-w-2xl flex-col items-center gap-1.5">
        <p
          className="text-foreground text-[clamp(1.8rem,1.4rem+1.8vw,2.3rem)] leading-tight font-semibold text-balance"
          dir={dir}
        >
          {word.term}
        </p>
        {word.definition && (
          <p className="text-muted-foreground text-base" dir={dir}>
            {word.definition}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2.5" dir="ltr">
        {tiles.map((_, slot) => {
          const tile = placed[slot];
          const letter = tile === undefined ? "" : tiles[tile];
          return (
            <button
              key={slot}
              type="button"
              aria-label={letter || undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => letter && remove(slot)}
              className={cn(
                "grid h-[72px] w-16 place-items-center rounded-xl border text-3xl font-semibold transition-colors",
                letter ? "border-border bg-card" : "border-border/70 border-dashed",
                result === "right" && "border-success bg-success/10",
                result === "wrong" && "border-destructive bg-destructive/10",
              )}
            >
              {letter}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-2.5" dir="ltr">
        {tiles.map((letter, index) => (
          <button
            key={index}
            type="button"
            disabled={placed.includes(index) || result !== null}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => place(index)}
            className={cn(
              "bg-muted border-border grid size-[58px] place-items-center rounded-[11px] border text-2xl font-semibold transition-opacity",
              placed.includes(index) && "invisible",
            )}
          >
            {letter}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground text-[13px] [html[data-keyboard]_&]:hidden" dir="auto">
        {s.lettersHint}
      </p>
    </>
  );
}

/** Step 5: only the word's sound, and the learner types it. A miss shows the right spelling and its sentence before moving on. */
function TypeScreen({
  s,
  word,
  retry,
  wrong,
  inputRef,
  fontFamily,
  onSpeak,
  onResult,
  onContinue,
  willReturn,
}: {
  s: LadderStrings;
  word: LadderWord;
  retry: boolean;
  wrong: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  fontFamily: string | undefined;
  onSpeak: () => void;
  onResult: (correct: boolean, written: string) => void;
  onContinue: () => void;
  willReturn: boolean;
}) {
  const { dir } = useLocale();
  useEnterToContinue(wrong !== null, onContinue);
  const parts = splitAroundWord(word.sentence, word.word);

  if (wrong !== null) {
    return (
      <div className="flex max-w-2xl flex-col items-center gap-2.5" aria-live="polite">
        {wrong && (
          <p className="text-muted-foreground text-sm" dir="auto">
            {s.youTyped("")}
            <bdi dir="ltr" className="text-destructive font-semibold line-through">
              {wrong}
            </bdi>
          </p>
        )}
        <p
          className="text-success text-[clamp(3rem,2.4rem+3.4vw,4.5rem)] leading-none font-bold tracking-tight"
          dir="ltr"
        >
          {word.word}
        </p>
        <p className="text-muted-foreground text-base" dir={dir}>
          {word.term}
          {word.definition ? ` · ${word.definition}` : ""}
        </p>
        <p className="text-foreground/85 mt-1 text-lg" dir="ltr">
          {parts ? (
            <>
              {parts[0]}
              <span className="bg-primary/15 text-primary rounded-md px-2 py-px font-semibold">
                {parts[1]}
              </span>
              {parts[2]}
            </>
          ) : (
            word.sentence
          )}
        </p>
        {willReturn && !retry && (
          <p className="text-muted-foreground text-[13px]" dir="auto">
            {s.comesBackOnce}
          </p>
        )}
        <Button className="mt-2" size="lg" onClick={onContinue}>
          {s.next}
        </Button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={s.listen}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSpeak}
        className="border-border bg-card text-primary focus-visible:ring-ring grid size-[104px] place-items-center rounded-2xl border outline-none focus-visible:ring-2"
      >
        <Volume2 className="size-9" aria-hidden="true" />
      </button>
      <div className="flex w-full max-w-2xl flex-col items-center gap-2">
        <VocabularySentence
          key={`${word.id}:${retry ? "retry" : "first"}`}
          sentence={BLANK_TOKEN}
          targetWord={word.word}
          onResult={(correct) => onResult(correct, inputRef.current?.value ?? "")}
          inputRef={inputRef}
          fontFamily={fontFamily}
          enlarged
        />
      </div>
    </>
  );
}

/** The finish screen: each word of the round and how it went, where the words come back, how far the topic is, and the next round. */
function Finish({
  s,
  words,
  runs,
  number,
  count,
  done,
  total,
  title,
  bankFeed,
  nextNumber,
  onNext,
}: {
  s: LadderStrings;
  words: LadderWord[];
  runs: Record<string, Run>;
  number: number;
  count: number;
  done: number;
  total: number;
  title: string;
  bankFeed: boolean;
  nextNumber: number | null;
  onNext: () => void;
}) {
  const { dir } = useLocale();
  const right = words.filter((word) => runs[word.id]?.typedRight);
  const allRight = right.length === words.length;
  useEnterToContinue(true, onNext);
  return (
    <div className="flex w-full max-w-[520px] flex-col items-center gap-3 text-center">
      <div className="bg-success/15 text-success ring-success/25 grid size-11 place-items-center rounded-full ring-1">
        <Check className="size-[22px]" strokeWidth={2.4} aria-hidden="true" />
      </div>
      <p className="text-muted-foreground text-[12.5px] font-semibold tracking-wide" dir="auto">
        {s.roundOver(number)}
      </p>
      {right.length > 0 && (
        <h2
          className="text-foreground text-[clamp(1.8rem,1.5rem+1.4vw,2.2rem)] font-semibold tracking-tight"
          dir="auto"
        >
          {s.gotWords(right.length)}
        </h2>
      )}
      <div className="border-border bg-card w-full rounded-2xl border px-5 py-1.5 text-start">
        {words.map((word) => {
          const run = runs[word.id]!;
          const chip =
            run.typedFirst && run.earlierMisses === 0
              ? "clean"
              : run.typedRight
                ? "assisted"
                : "missed";
          return (
            <div
              key={word.id}
              className="border-border grid grid-cols-[110px_1fr_auto] items-baseline gap-3 border-b py-3 last:border-b-0"
            >
              <span className="text-foreground text-xl font-semibold" dir="ltr">
                {word.word}
              </span>
              <span className="text-muted-foreground text-[15px]" dir={dir}>
                {word.term}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
                  chip === "clean"
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border text-muted-foreground",
                )}
                dir="auto"
              >
                {chip === "clean"
                  ? s.chipClean
                  : chip === "assisted"
                    ? s.chipAssisted
                    : s.chipMissed}
              </span>
            </div>
          );
        })}
      </div>
      {bankFeed && (
        <p className="text-muted-foreground text-sm" dir="auto">
          {s.comesBack}
        </p>
      )}
      <div className="mt-1 w-full">
        <LadderRoundBar
          count={count}
          done={allRight ? number : number - 1}
          current={allRight ? null : number - 1}
        />
        <p className="text-muted-foreground mt-2 text-sm" dir="auto">
          {s.progressIn(done + right.length, total, title)}
        </p>
      </div>
      <Button size="lg" className="mt-3" onClick={onNext}>
        <span dir="auto">{nextNumber === null ? s.back : s.nextRound(nextNumber)}</span>
      </Button>
      <Link
        href="/learn/word-lists"
        className="text-muted-foreground hover:text-foreground text-sm"
      >
        <span dir="auto">{s.enough}</span>
      </Link>
    </div>
  );
}
