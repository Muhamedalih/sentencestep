"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Volume2, X } from "lucide-react";

import { LessonSettings } from "@/components/learning/lesson-settings";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { SharedInputHost, SharedInputProvider } from "@/components/learning/shared-input";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { LadderExamResult } from "@/components/words/ladder/ladder-exam-result";
import { LadderFinish } from "@/components/words/ladder/ladder-finish";
import { LadderRatingModal } from "@/components/words/ladder/ladder-rating-modal";
import { WordPosBadge } from "@/components/words/word-pos-badge";
import { Button } from "@/components/ui/button";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { useWordsRoundTracking } from "@/hooks/use-words-round-tracking";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { readRoundsRatingState, writeRoundsRatingState } from "@/lib/feedback/rating-storage";
import { splitAroundWord } from "@/lib/passages/text";
import { cn } from "@/lib/utils";
import { recordBankWordAction } from "@/lib/word-bank/actions";
import { scrambleLetters } from "@/lib/word-ladder/options";
import {
  shouldAskRoundsRating,
  withFinishedRound,
  withRated,
  withSkip,
} from "@/lib/word-ladder/rating-gate";
import {
  LADDER_PHASES,
  buildExamQueue,
  buildQueue,
  ladderOutcome,
  phaseOf,
  retryOf,
  scheduleRetry,
  type LadderCard,
  type LadderPhase,
  type LadderStep,
} from "@/lib/word-ladder/sequence";
import { ladderStrings, type LadderStrings } from "@/lib/word-ladder/strings";
import type { LadderWord } from "@/lib/word-ladder/types";
import { formatIpa } from "@/lib/word-lists-ipa";
import type { WordOutcome } from "@/lib/word-mastery/schedule";
import { BLANK_TOKEN } from "@/types/word-lists";

/** How one word went through the round, kept for the finish page. */
interface Run {
  earlierMisses: number;
  typedFirst: boolean | null;
  typedRight: boolean;
}

export interface LadderRoundProps {
  words: LadderWord[];
  /** Which round of the topic this is, and how many of the topic's words were finished before it. */
  number: number;
  done: number;
  total: number;
  group: { id: string; title: string; supportTitle?: string };
  voiceId: string | null;
  /** The words bank is open for this learner: the words of the round are handed to it. */
  bankFeed: boolean;
  todayISO: string;
  /** A word was typed right: the topic's progress and the visit's own count are updated by the parent. */
  onWordComplete: (wordId: string) => void;
  /** The round that follows this one (its number and first word), or null when the topic is finished. */
  next: { number: number; firstWord: string } | null;
  onNext: () => void;
  /** "round" is the five steps; "exam" is the test after it: every word heard and typed once, then a score. */
  mode?: "round" | "exam";
  /** The finish page's «اختبر» button, and the exam result's «أعد الاختبار»: opens the exam of these words. */
  onExam: () => void;
  /** Where "back" and "done" lead; the Word Lists page unless the round was opened from the Map. */
  backHref?: string;
  /** The round's name in the corner when it is not "Round N" (today's session). */
  roundLabel?: string;
  /** A round of mixed topics has no topic to be "N of M" in: the finish page leaves the topic's progress bar out. */
  mixed?: boolean;
  /** One word opened from the words list: four steps (no hearing test) and no exam button at the end. */
  single?: boolean;
}

/** After a choice: how long the answer stays on screen before the next screen (a miss stays longer, to be read). */
const CORRECT_DELAY_MS = 650;
const WRONG_DELAY_MS = 1400;
/** The bar of a one-word round: learning, then the typed test. */
const SINGLE_PHASES: readonly LadderPhase[] = ["learn", "type"];
/** The shake of a wrong choice. */
const SHAKE = [0, -9, 9, -6, 6, -3, 3, 0];

/**
 * One round of up to four words of a Word Lists topic, in five steps: (1) the word with its meaning
 * and sound, (2) its four meanings, (3) its scrambled letters, (4) its sound and four spellings,
 * (5) its sound and the learner types it. Steps 1 to 3 go word by word in an order that brings each
 * word back after others (see learnOrder), then step 4 and step 5 run over every word. Only the typed
 * step counts as learned. A wrong answer anywhere shows itself (a small shake, a red edge, the right
 * answer) and the same screen comes back three screens later, twice at most, never saved for the end
 * of the round. The first typed answer of each word is what the learner's records hear. When the
 * round ends, the finish page opens (with the exam button) and the rating card is offered when due
 * (see rating-gate.ts). In "exam" mode the queue is just the typed screens, nothing is asked again,
 * nothing is sent to the bank, and the end is a score.
 */
export function LadderRound({
  words,
  number,
  done,
  total,
  group,
  voiceId,
  bankFeed,
  todayISO,
  onWordComplete,
  next,
  onNext,
  mode = "round",
  onExam,
  backHref = "/learn/word-lists",
  roundLabel,
  mixed = false,
  single = false,
}: LadderRoundProps) {
  const exam = mode === "exam";
  const { locale } = useLocale();
  const s = ladderStrings(locale);
  const reducedMotion = useReducedMotion() ?? false;
  const byId = useMemo(() => new Map(words.map((word) => [word.id, word])), [words]);
  const seed = useMemo(
    () => `${group.id}:${words.map((word) => word.id).join(",")}`,
    [group.id, words],
  );

  const [queue, setQueue] = useState<LadderCard[]>(() =>
    exam ? buildExamQueue(words, seed) : buildQueue(words, seed, single),
  );
  const [pos, setPos] = useState(0);
  const [runs, setRuns] = useState<Record<string, Run>>(() =>
    Object.fromEntries(
      words.map((word) => [word.id, { earlierMisses: 0, typedFirst: null, typedRight: false }]),
    ),
  );
  const [typedWrong, setTypedWrong] = useState<string | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);

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
  // The exam is not a round of the words section: it is not counted with them.
  const tracking = useWordsRoundTracking(exam ? null : "ladder", words.length);

  // The round's words are resolved in the background, so their speakers find the sound cached.
  const { prefetchPronunciation } = usePronunciationSettings();
  useEffect(() => {
    for (const item of words) {
      const voice = item.topic ? item.topic.voiceId : voiceId;
      if (item.audioUrl || !voice) continue;
      prefetchPronunciation({ contentType: "word", contentId: item.id, voiceId: voice });
    }
  }, [words, voiceId, prefetchPronunciation]);

  // What the handlers read: the typing engine may hold on to an older render's callback.
  const live = useRef({ card, word, runs, pos });
  live.current = { card, word, runs, pos };

  // The round ran to its end: it is reported, and the rating card is offered when it is due (not
  // after the exam). The decision is made once (a development double-run of the effect must not
  // count the round twice).
  const askRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!finished || exam) return;
    tracking.finish();
    if (askRef.current === null) {
      const state = withFinishedRound(readRoundsRatingState());
      writeRoundsRatingState(state);
      askRef.current = shouldAskRoundsRating(state);
    }
    if (!askRef.current) return;
    const timer = window.setTimeout(() => setRatingOpen(true), 1100);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the last screen is done
  }, [finished]);

  /** The sound of an answer, the moment it is given: the soft achievement sound for a right one, the error tick for a wrong one. */
  const answered = useCallback(
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
        lessonId: `wordlist:${target.topic?.id ?? group.id}`,
        lessonTitle: target.topic?.title ?? group.title,
        ar: target.term || undefined,
        homeSentence: target.sentence,
      }).catch(() => {});
    },
    [bankFeed, group.id, group.title, todayISO, tracking],
  );

  /** A choice or the letters settled: a miss counts against the word and the screen comes back a few screens later. */
  const settle = useCallback(
    (correct: boolean) => {
      const { card: current, pos: at } = live.current;
      if (!current) return;
      if (!correct) {
        setRuns((previous) => ({
          ...previous,
          [current.wordId]: {
            ...previous[current.wordId]!,
            earlierMisses: previous[current.wordId]!.earlierMisses + 1,
          },
        }));
        const again = retryOf(current);
        if (again) setQueue((previous) => scheduleRetry(previous, at, again));
      }
      advance();
    },
    [advance],
  );

  /** The typed step: the first answer is what the records hear, a right one finishes the word, a wrong one comes back a few screens later. */
  const typed = useCallback(
    (correct: boolean, written: string) => {
      const { card: current, word: target, runs: all, pos: at } = live.current;
      if (!current || !target) return;
      answered(correct);
      const previous = all[target.id]!;
      const first = !current.retry;
      const nextRun: Run = {
        earlierMisses: previous.earlierMisses,
        typedFirst: first ? correct : previous.typedFirst,
        typedRight: previous.typedRight || correct,
      };
      setRuns((state) => ({ ...state, [target.id]: nextRun }));
      if (first && !exam) {
        const outcome = ladderOutcome({
          earlierMisses: nextRun.earlierMisses,
          typedFirst: correct,
        });
        if (outcome) report(target, outcome);
      }
      if (!correct && !exam) {
        const again = retryOf(current);
        if (again) setQueue((state) => scheduleRetry(state, at, again));
      }
      if (correct && !previous.typedRight) onWordComplete(target.id);
      if (correct) advance();
      else setTypedWrong(written.trim().slice(0, 40));
    },
    [advance, answered, exam, onWordComplete, report],
  );

  const step: LadderStep | null = card?.step ?? null;
  const audio = step === "meet" || step === "listen" || step === "type";
  const replay = useCallback(() => settingsRef.current?.replay(), []);

  // Position of this screen inside its kind ("1 of 4"). The screens a miss adds carry no position:
  // they are a second go, not a fifth word.
  const stepScreens = card ? queue.filter((item) => item.step === card.step && !item.retry) : [];
  const stepIndex = card ? stepScreens.indexOf(card) + 1 : 0;
  const stepLabel = step
    ? {
        meet: s.stepMeet,
        meaning: s.stepMeaning,
        letters: s.stepLetters,
        listen: s.stepListen,
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
              href={backHref}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 justify-self-start text-sm font-medium pointer-coarse:min-h-11"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {s.back}
            </Link>
            {finished ? (
              <div />
            ) : (
              <LadderProgress queue={queue} pos={pos} phases={exam ? ["type"] : single ? SINGLE_PHASES : LADDER_PHASES} />
            )}
            <div className="flex items-center gap-3 justify-self-end">
              {!finished && (
                <span className="text-muted-foreground text-sm font-medium" dir="auto">
                  {exam ? s.examTitle : (roundLabel ?? s.nextRound(number))}
                </span>
              )}
              {!finished && word && (
                <LessonSettings
                  ref={settingsRef}
                  text={word.word}
                  audioUrl={word.audioUrl}
                  autoPlay={audio && typedWrong === null}
                  resetKey={`${pos}:${word.id}:${card?.step}`}
                  inputRef={inputRef}
                  kokoroVoiceId={word.topic ? word.topic.voiceId : voiceId}
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
              className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-4 lg:px-16"
            >
              {exam ? (
                <LadderExamResult
                  words={words}
                  results={Object.fromEntries(
                    words.map((item) => [item.id, runs[item.id]?.typedFirst === true]),
                  )}
                  title={group.title}
                  next={next}
                  onRetake={onExam}
                  onNext={onNext}
                  backHref={backHref}
                />
              ) : (
                <LadderFinish
                  words={words}
                  runs={runs}
                  number={number}
                  done={done}
                  total={total}
                  title={group.title}
                  bankFeed={bankFeed}
                  next={next}
                  onNext={onNext}
                  onExam={onExam}
                  backHref={backHref}
                  mixed={mixed}
                  hideExam={single}
                />
              )}
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
                    onAnswered={answered}
                    onSettled={settle}
                  />
                )}
                {card.step === "letters" && (
                  <LettersScreen
                    key={`t${pos}`}
                    s={s}
                    word={word}
                    seed={`${seed}:${card.wordId}:${card.tries}`}
                    onAnswered={answered}
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
                    onAnswered={answered}
                    onSettled={settle}
                    onSpeak={replay}
                    listenLabel={s.listen}
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
                    willReturn={!exam && retryOf(card) !== null}
                  />
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
      <LadderRatingModal
        open={ratingOpen}
        onRated={() => {
          writeRoundsRatingState(withRated(readRoundsRatingState()));
          setRatingOpen(false);
        }}
        onSkip={() => {
          writeRoundsRatingState(withSkip(readRoundsRatingState()));
          setRatingOpen(false);
        }}
      />
    </SharedInputProvider>
  );
}

/** The bar at the top: learning (steps 1 to 3), then each test, a segment full once all its screens are done. */
function LadderProgress({
  queue,
  pos,
  phases,
}: {
  queue: LadderCard[];
  pos: number;
  phases: readonly LadderPhase[];
}) {
  return (
    <div className="flex w-[190px] gap-1.5 sm:w-[300px]" dir="ltr" aria-hidden="true">
      {phases.map((phase) => {
        // The screens a miss adds are not counted: a segment never un-fills.
        const screens = queue
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => phaseOf(item.step) === phase && !item.retry);
        const doneScreens = screens.filter(({ index }) => index < pos).length;
        const width = screens.length === 0 ? 100 : (doneScreens / screens.length) * 100;
        return (
          <span key={phase} className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
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

/** A word is met: the word, how it sounds, what kind of word it is, what it means, and the sentence it lives in. */
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

/**
 * The meaning question (the word and up to four meanings) and the hearing question (its sound and up
 * to four spellings); keys 1 to 4 choose. A right choice plays the achievement sound at once and
 * moves on; a wrong one shakes the chosen option, marks it with a red edge and a cross, shows the
 * right one in green with a tick, and moves on a moment later.
 */
function ChoiceScreen({
  kind,
  word,
  options,
  answer,
  onAnswered,
  onSettled,
  onSpeak,
  listenLabel,
}: {
  kind: "meaning" | "listen";
  word: LadderWord;
  options: string[];
  answer: string;
  /** The choice was made (right or wrong): the sound is played by the round. */
  onAnswered: (correct: boolean) => void;
  /** The moment is over: the round moves on. */
  onSettled: (correct: boolean) => void;
  onSpeak?: () => void;
  listenLabel?: string;
}) {
  const { dir } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;
  const [chosen, setChosen] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const settled = useRef(onSettled);
  settled.current = onSettled;
  const answeredRef = useRef(onAnswered);
  answeredRef.current = onAnswered;

  const pick = useCallback(
    (index: number) => {
      if (chosen !== null || index < 0 || index >= options.length) return;
      setChosen(index);
      const right = options[index] === answer;
      answeredRef.current(right);
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
            <motion.button
              key={`${index}:${option}`}
              type="button"
              disabled={chosen !== null}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(index)}
              animate={state === "wrong" && !reducedMotion ? { x: SHAKE } : { x: 0 }}
              transition={{ duration: 0.42, ease: "easeOut" }}
              className={cn(
                "relative flex min-h-[58px] items-center justify-center rounded-xl border px-12 py-3 text-xl font-medium transition-colors sm:min-h-[68px]",
                state === "idle" &&
                  "border-border bg-card hover:border-primary/60 hover:bg-muted/40",
                state === "right" && "border-success bg-success/10",
                state === "wrong" && "border-danger bg-danger/10",
                state === "dim" && "border-border bg-card opacity-50",
              )}
            >
              <kbd className="border-border text-muted-foreground absolute top-1/2 left-3.5 hidden size-6 -translate-y-1/2 place-items-center rounded-md border text-xs font-semibold sm:grid [html[data-keyboard]_&]:grid">
                {index + 1}
              </kbd>
              <span dir={kind === "meaning" ? dir : "ltr"}>{option}</span>
              {state === "right" && (
                <Check
                  className="text-success absolute top-1/2 right-3.5 size-5 -translate-y-1/2"
                  strokeWidth={2.6}
                  aria-hidden="true"
                />
              )}
              {state === "wrong" && (
                <X
                  className="text-danger absolute top-1/2 right-3.5 size-5 -translate-y-1/2"
                  strokeWidth={2.6}
                  aria-hidden="true"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

/**
 * The letters question: the meaning stays on screen and the word's letters are put in order, tapped
 * or typed on the keyboard. A right word plays the achievement sound and turns green; a wrong one
 * shakes the row, turns it red and shows the right spelling under it before the round moves on.
 */
function LettersScreen({
  s,
  word,
  seed,
  onAnswered,
  onSettled,
}: {
  s: LadderStrings;
  word: LadderWord;
  seed: string;
  onAnswered: (correct: boolean) => void;
  onSettled: (correct: boolean) => void;
}) {
  const { dir } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;
  const tiles = useMemo(() => scrambleLetters(word.word, seed), [word.word, seed]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<"right" | "wrong" | null>(null);
  const placedRef = useRef<number[]>([]);
  const resultRef = useRef<"right" | "wrong" | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const settled = useRef(onSettled);
  settled.current = onSettled;
  const answeredRef = useRef(onAnswered);
  answeredRef.current = onAnswered;

  const update = useCallback((nextPlaced: number[]) => {
    placedRef.current = nextPlaced;
    setPlaced(nextPlaced);
  }, []);

  const place = useCallback(
    (tile: number) => {
      if (resultRef.current || placedRef.current.includes(tile)) return;
      const nextPlaced = [...placedRef.current, tile];
      update(nextPlaced);
      if (nextPlaced.length < tiles.length) return;
      const right = nextPlaced.map((index) => tiles[index]).join("") === word.word;
      resultRef.current = right ? "right" : "wrong";
      setResult(resultRef.current);
      answeredRef.current(right);
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
      <motion.div
        className="flex flex-wrap justify-center gap-2.5"
        dir="ltr"
        animate={result === "wrong" && !reducedMotion ? { x: SHAKE } : { x: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
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
                result === "wrong" && "border-danger bg-danger/10",
              )}
            >
              {letter}
            </button>
          );
        })}
      </motion.div>
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
      {result === "wrong" ? (
        <p className="text-success text-2xl font-bold tracking-tight" dir="ltr" aria-live="polite">
          {word.word}
        </p>
      ) : (
        <p className="text-muted-foreground text-[13px] [html[data-keyboard]_&]:hidden" dir="auto">
          {s.lettersHint}
        </p>
      )}
    </>
  );
}

/** The typed test: only the word's sound, and the learner types it. A miss shows the right spelling and its sentence before moving on. */
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
  /** The word will be asked again a few screens later (not in the exam, and not after the last try). */
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
            <bdi dir="ltr" className="text-danger font-semibold line-through">
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
        {willReturn && (
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
