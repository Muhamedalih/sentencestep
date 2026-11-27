"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { LessonSettings } from "@/components/learning/lesson-settings";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { SharedInputHost, SharedInputProvider } from "@/components/learning/shared-input";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import { finishTodayWords } from "@/components/today/today-words-runner";
import { ChoiceScreen, LettersScreen } from "@/components/words/ladder/ladder-round";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { useWordsRoundTracking } from "@/hooks/use-words-round-tracking";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { completeSessionWord } from "@/lib/features/session-completion";
import { splitAroundWord } from "@/lib/passages/text";
import type { SceneWordCard } from "@/lib/today/scene";
import { sceneStrings } from "@/lib/today/scene-strings";
import type { SessionReviewWord } from "@/lib/today/session-words";
import { canScramble, retryOf, scheduleRetry } from "@/lib/word-ladder/sequence";
import type { LadderCard } from "@/lib/word-ladder/sequence";
import { seededShuffle } from "@/lib/word-ladder/random";
import { ladderStrings } from "@/lib/word-ladder/strings";
import { cn } from "@/lib/utils";

type Move = "meaning" | "letters" | "type";

/** The moves of the round: every word's meaning, then every word's letters, then every word from memory. */
function buildMoves(cards: readonly SceneWordCard[], seed: string): LadderCard[] {
  const card = (wordId: string, step: Move): LadderCard => ({
    wordId,
    step,
    retry: false,
    tries: 0,
  });
  const words = cards.map((entry) => entry.word);
  const meaning = words.filter((word) => word.meaningOptions.length >= 2);
  const letters = seededShuffle(
    words.filter((word) => canScramble(word.word)),
    `${seed}:letters`,
  );
  const type = seededShuffle(words, `${seed}:type`);
  return [
    ...meaning.map((word) => card(word.id, "meaning")),
    ...letters.map((word) => card(word.id, "letters")),
    ...type.map((word) => card(word.id, "type")),
  ];
}

/**
 * The third step of the day's scene (permission dailyScene): the words of the lines just typed, in
 * three moves. Each word's meaning is chosen (with its line in view), then its letters are put in
 * order, then it is typed from memory into its line. A miss comes back a few screens later, as in the
 * Word Lists rounds. A word typed right is recorded like a passage's word of Today's words step; the
 * round's end ticks the day's third task and opens Today's finish screen.
 */
export function SceneWords({
  cards,
  reviews,
}: {
  cards: SceneWordCard[];
  reviews: SessionReviewWord[];
}) {
  const { locale } = useLocale();
  const strings = sceneStrings(locale);
  const ladder = ladderStrings(locale);
  const router = useRouter();
  const reducedMotion = useReducedMotion() ?? false;
  const seed = useMemo(() => cards.map((entry) => entry.word.id).join(","), [cards]);
  const byId = useMemo(() => new Map(cards.map((entry) => [entry.word.id, entry])), [cards]);
  const [queue, setQueue] = useState<LadderCard[]>(() => buildMoves(cards, seed));
  const [position, setPosition] = useState(0);
  const missedRef = useRef(new Set<string>());
  const recordedRef = useRef(new Set<string>());
  const finishedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<PronunciationButtonHandle>(null);

  const current = queue[position];
  const entry = current ? byId.get(current.wordId) : undefined;
  const finished = position >= queue.length;
  const tracking = useWordsRoundTracking("today", cards.length);

  const soundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: soundSettings.soundPack,
    enabled: soundSettings.enabled,
    volume: soundSettings.volume,
    sentenceCompleteSound: soundSettings.sentenceCompleteSound,
  });

  // The round is over: record it as Today's words round and go to the finish screen (once).
  useEffect(() => {
    if (!finished || finishedRef.current) return;
    finishedRef.current = true;
    tracking.finish();
    finishTodayWords({ total: cards.length, clean: cards.length - missedRef.current.size }, router);
  }, [finished, cards.length, router, tracking]);

  const answered = useCallback(
    (correct: boolean) => {
      if (correct) {
        playSentenceComplete(resolveSectionSentenceCompleteSound(soundSettings, "wordLists"));
      } else {
        play("error");
      }
    },
    [play, playSentenceComplete, soundSettings],
  );

  const advance = useCallback(() => setPosition((value) => value + 1), []);

  /** A miss counts against the word and brings the same screen back a few screens later. */
  const miss = useCallback(
    (card: LadderCard) => {
      missedRef.current.add(card.wordId);
      const again = retryOf(card);
      if (again) setQueue((items) => scheduleRetry(items, position, again));
    },
    [position],
  );

  const settle = useCallback(
    (correct: boolean) => {
      if (current && !correct) miss(current);
      advance();
    },
    [advance, current, miss],
  );

  function typed(correct: boolean) {
    if (!current || !entry) return;
    const id = entry.word.id;
    if (!current.retry) tracking.note(id, correct ? "clean" : "missed");
    if (correct) {
      playSentenceComplete(resolveSectionSentenceCompleteSound(soundSettings, "wordLists"));
      const review = reviews.find((word) => word.id === id);
      if (review && !recordedRef.current.has(id)) {
        recordedRef.current.add(id);
        completeSessionWord(review, missedRef.current.has(id)).catch((error: unknown) => {
          console.error("[scene] completion action failed", error);
        });
      }
    } else {
      play("error");
      miss(current);
    }
    advance();
  }

  const move = (current?.step ?? "meaning") as Move;
  const sameMove = queue.filter((item) => item.step === move && !item.retry);
  const caption = current
    ? current.retry
      ? { meaning: strings.moveMeaning, letters: strings.moveLetters, type: strings.moveType }[move]
      : `${{ meaning: strings.moveMeaning, letters: strings.moveLetters, type: strings.moveType }[move]} · ${ladder.position(sameMove.indexOf(current) + 1, sameMove.length)}`
    : "";

  return (
    <SharedInputProvider>
      <div className="h-app relative flex w-full flex-col">
        <SharedInputHost />
        {!finished && move !== "letters" && <ShiftReplayHint />}
        <header className="shrink-0 px-4 pt-3 lg:px-16 lg:pt-5" dir="ltr">
          <div className="mx-auto flex w-full max-w-[900px] items-center gap-2.5">
            <Link
              href="/learn"
              aria-label={strings.exit}
              className="text-muted-foreground hover:text-foreground grid size-8 shrink-0 place-items-center rounded-lg"
            >
              <X className="size-5" aria-hidden="true" />
            </Link>
            <span className="flex min-w-0 flex-1 flex-col leading-[1.4]">
              <b className="truncate text-left text-[13.5px]" dir="auto">
                {strings.taskWords}
              </b>
            </span>
            {entry && (
              <LessonSettings
                ref={settingsRef}
                text={entry.word.word}
                audioUrl={entry.word.audioUrl}
                autoPlay={move === "meaning"}
                resetKey={`${position}:${entry.word.id}`}
                inputRef={inputRef}
                contentType="word"
                contentId={entry.word.id}
                noBrowserVoice
              />
            )}
          </div>
          <div className="mx-auto mt-2 flex w-full max-w-[900px] gap-[5px]" aria-hidden="true">
            {(["meaning", "letters", "type"] as const).map((phase) => {
              const screens = queue
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => item.step === phase && !item.retry);
              const done = screens.filter(({ index }) => index < position).length;
              return (
                <span
                  key={phase}
                  className="bg-foreground/12 h-1 flex-1 overflow-hidden rounded-[3px]"
                >
                  <span
                    className="bg-brand block h-full transition-[width] duration-300 motion-reduce:transition-none"
                    style={{ width: `${screens.length ? (done / screens.length) * 100 : 100}%` }}
                  />
                </span>
              );
            })}
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            {current && entry && (
              <motion.div
                key={`${position}:${current.wordId}:${current.step}`}
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
                {move === "meaning" && (
                  <ChoiceScreen
                    kind="meaning"
                    word={entry.word}
                    options={entry.word.meaningOptions}
                    answer={entry.word.term}
                    onAnswered={answered}
                    onSettled={settle}
                    context={
                      <SceneLineQuote
                        line={entry.word.sentence}
                        word={entry.word.word}
                        label={strings.fromScene}
                      />
                    }
                  />
                )}
                {move === "letters" && (
                  <LettersScreen
                    s={ladder}
                    word={entry.word}
                    seed={`${seed}:${entry.word.id}:${current.tries}`}
                    onAnswered={answered}
                    onSettled={settle}
                  />
                )}
                {move === "type" && (
                  <div className="flex w-full max-w-2xl flex-col items-center gap-6">
                    <p
                      className="text-foreground text-[clamp(1.6rem,1.3rem+1.4vw,2.1rem)] leading-tight font-semibold text-balance"
                      dir="auto"
                    >
                      {entry.word.term}
                    </p>
                    <VocabularySentence
                      key={`${entry.word.id}:${current.tries}`}
                      sentence={entry.blanked}
                      targetWord={entry.word.word}
                      onResult={typed}
                      inputRef={inputRef}
                      inline
                      enlarged
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SharedInputProvider>
  );
}

/** The word's own line from the scene, with the word marked. */
function SceneLineQuote({ line, word, label }: { line: string; word: string; label: string }) {
  const parts = splitAroundWord(line, word);
  return (
    <div className={cn("flex max-w-2xl flex-col items-center gap-1")}>
      <small className="text-muted-foreground text-[11px]" dir="auto">
        {label}
      </small>
      <p className="text-foreground/85 text-base" dir="ltr" lang="en">
        {parts ? (
          <>
            {parts[0]}
            <span className="bg-brand/15 text-brand rounded-md px-1.5 py-px font-semibold">
              {parts[1]}
            </span>
            {parts[2]}
          </>
        ) : (
          line
        )}
      </p>
    </div>
  );
}
