"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Volume2 } from "lucide-react";

import { LessonSettings } from "@/components/learning/lesson-settings";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { SharedInputHost, SharedInputProvider } from "@/components/learning/shared-input";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { StoryRatingRow } from "@/components/learning/story-rating-row";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { Button } from "@/components/ui/button";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { useWordsRoundTracking } from "@/hooks/use-words-round-tracking";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { splitAroundWord } from "@/lib/passages/text";
import { cn } from "@/lib/utils";
import { fetchBankHomeSentenceAction, recordBankWordAction } from "@/lib/word-bank/actions";
import type { RecordedBankAnswer } from "@/lib/word-bank/actions";
import {
  bankOutcome,
  countKey,
  firstTimeKey,
  summarizeBankRound,
  type BankRoundResult,
  type BankRoundWord,
} from "@/lib/word-bank/round";
import { BANK_ROUND_SIZE } from "@/lib/word-bank/select";
import { firstMetLabel } from "@/lib/word-bank/when-label";
import { splitWordHint } from "@/lib/word-lists-hint";
import type { WordOutcome } from "@/lib/word-mastery/schedule";
import { BLANK_TOKEN } from "@/types/word-lists";

/** One word of the round is on one of these screens: asked, the correction after a miss, or asked once more (practice only). */
type Phase = "ask" | "learn" | "retry";

/** The finish screen's way back: to the section's own page («كلماتي»), or, until that page exists, to Home. */
export type BankBackTo = "words" | "home";

/** The quiet colours the row of stars wears: the page's own tokens. */
const RATING_COLOR = "var(--muted-foreground)";
const RATING_ACCENT = "var(--primary)";

/** A word of the home sentence with the target underlined (a 2px line in the primary colour, nothing else). */
function HomeSentence({ sentence, word }: { sentence: string; word: string }) {
  const parts = splitAroundWord(sentence, word);
  if (!parts) return <>{sentence}</>;
  return (
    <>
      {parts[0]}
      <span className="decoration-primary underline decoration-2 underline-offset-[6px]">
        {parts[1]}
      </span>
      {parts[2]}
    </>
  );
}

/**
 * A review round of the words bank («كلماتي», src/lib/word-bank): up to five words that are due,
 * one on the screen at a time, each asked in the form its strength calls for — its meaning and a
 * sentence with the word left out, another sentence with nothing to lean on, or only its sound
 * (see bankFormFor). It is the focus screen the Today's words step uses (the same typing, the same
 * sounds, the same back link, counter and settings), changing only what is shown.
 *
 * A right answer moves straight on. A wrong one shows the word, what was typed and the sentence the
 * word was first met in (its "home sentence", with its translation once that arrives), then offers
 * the word once more as practice. The bank hears about the FIRST answer to each word only — right
 * with no help (clean), right after the form's one hint (assisted), or wrong (missed, back
 * tomorrow) — and the second go is never sent. The finish screen adds the round up, says how many
 * words the bank holds, and ends with the quiet row of stars.
 *
 * Today the section's own page does not exist yet, so the screen's way back is Home (`backTo`).
 */
export function BankReviewSession({
  words: initialWords,
  bankTotal,
  more,
  todayISO,
  backTo = "words",
  loadTranslation,
  record,
}: {
  words: BankRoundWord[];
  /** Every word in the learner's bank, for "your words now". */
  bankTotal: number;
  /** More words would be due after this round (the finish screen's second button). */
  more: boolean;
  /** The learner's own calendar day: sent with every answer, and what "first met" is counted from. */
  todayISO: string;
  backTo?: BankBackTo;
  /** The translation of a word's home sentence; by default the learner's own bank row is asked (a test screen passes its own). */
  loadTranslation?: (word: string) => Promise<string | null>;
  /** How an answer reaches the bank; by default the Server Action (a test screen passes its own, so it records nothing). */
  record?: (input: unknown) => Promise<RecordedBankAnswer>;
}) {
  const { t, dir, locale } = useLocale();
  const copy = t.myWords;
  const reducedMotion = useReducedMotion() ?? false;
  // Snapshotted once, like the other review screens: the page may refetch in the background.
  const [words] = useState(initialWords);
  const total = words.length;

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ask");
  const [helped, setHelped] = useState(false);
  const [typedWrong, setTypedWrong] = useState("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [results, setResults] = useState<BankRoundResult[]>([]);
  // Answers on their way to the bank: "more words" waits for them, so the next round is built from the bank as it now stands.
  const [pending, setPending] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<PronunciationButtonHandle>(null);
  const finished = index >= total;
  const word = words[index];
  // What the answer handler reads: the typing engine may hold on to an older render's callback.
  const live = useRef({ word, phase, helped });
  live.current = { word, phase, helped };

  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "wordLists");
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });
  const round = useWordsRoundTracking("bank", total);

  const backHref = backTo === "words" ? "/learn/words" : "/learn";
  const backLabel = backTo === "words" ? copy.title : t.mistakes.learningHome;

  useEffect(() => {
    if (finished) round.finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the last word is done
  }, [finished]);

  // After a miss: the translation of the home sentence, asked for the moment the card appears.
  useEffect(() => {
    if (phase !== "learn" || !word?.homeSentence) return;
    let cancelled = false;
    setTranslation(null);
    const load =
      loadTranslation ??
      ((target: string) =>
        fetchBankHomeSentenceAction(target).then((answer) => answer.translation));
    load(word.word)
      .then((text) => {
        if (!cancelled) setTranslation(text);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when the correction appears
  }, [phase, word?.word]);

  function next() {
    setIndex((current) => current + 1);
    setPhase("ask");
    setHelped(false);
    setTypedWrong("");
    setTranslation(null);
  }

  /** Tells the bank how a word's first answer went, and keeps where it left the word for the finish screen. */
  function report(target: BankRoundWord, outcome: WordOutcome) {
    setPending((count) => count + 1);
    void (record ?? recordBankWordAction)({
      word: target.word,
      outcome,
      todayISO,
      source: target.source,
      lessonId: target.lessonId ?? undefined,
      lessonTitle: target.lessonTitle ?? undefined,
      ar: target.ar || undefined,
      homeSentence: target.homeSentence ?? undefined,
    })
      .then((answer) => {
        setResults((current) =>
          current.map((result) =>
            result.word === target.word
              ? { ...result, strength: answer.strength ?? null, advanced: answer.advanced ?? false }
              : result,
          ),
        );
      })
      .catch(() => {})
      .finally(() => setPending((count) => count - 1));
  }

  function handleResult(correct: boolean) {
    const { word: current, phase: currentPhase, helped: wasHelped } = live.current;
    if (!current) return;
    if (correct)
      playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "wordLists"));
    else play("error");

    // The second go after a miss is practice: nothing is recorded, and either way the round moves on.
    if (currentPhase === "retry") {
      next();
      return;
    }
    const outcome = bankOutcome({ correct, helped: wasHelped });
    round.note(current.word, outcome);
    setResults((previous) => [
      ...previous,
      { word: current.word, outcome, strength: null, advanced: false },
    ]);
    report(current, outcome);
    if (correct) {
      next();
      return;
    }
    setTypedWrong((inputRef.current?.value ?? "").trim().slice(0, 40));
    setPhase("learn");
  }

  // Enter continues from the correction, like the other screens' Continue.
  useEnterToContinue(phase === "learn" && !finished, () => setPhase("retry"));

  const hint = word?.ar ? splitWordHint(word.ar) : { term: undefined, definition: undefined };
  const showMeaning = word && (word.form === "meaning" || helped) && hint.term;
  const summary = summarizeBankRound(results);

  return (
    <SharedInputProvider>
      <div className="h-app relative flex w-full flex-col">
        <SharedInputHost />
        {!finished && phase !== "learn" && <ShiftReplayHint />}
        <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5 [html[data-keyboard]_&]:pt-2">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={backHref}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium pointer-coarse:min-h-11"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {backLabel}
            </Link>
            {!finished && word && (
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-muted-foreground text-sm font-medium" dir="ltr">
                  {index + 1} / {total}
                </span>
                <LessonSettings
                  ref={settingsRef}
                  text={word.word}
                  audioUrl={word.audioUrl}
                  // The word's sound would be the answer to the form that asks it in another sentence.
                  autoPlay={word.form !== "context" || phase === "learn"}
                  resetKey={`${word.word}:${phase}`}
                  inputRef={inputRef}
                  noBrowserVoice
                />
              </div>
            )}
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
              <div className="flex w-full max-w-[520px] flex-col items-center gap-3 text-center">
                <div className="bg-success/15 text-success ring-success/25 grid size-11 place-items-center rounded-full ring-1">
                  <Check className="size-[22px]" strokeWidth={2.4} aria-hidden="true" />
                </div>
                <h2
                  className="text-foreground text-[clamp(2rem,1.6rem+1.6vw,2.6rem)] font-semibold tracking-tight"
                  dir="auto"
                >
                  {(countKey(summary.asked) === "one"
                    ? copy.reviewedOne
                    : countKey(summary.asked) === "two"
                      ? copy.reviewedTwo
                      : copy.reviewedMany
                  ).replace("{n}", String(summary.asked))}
                </h2>
                {firstTimeKey(summary) !== "none" && (
                  <p className="text-muted-foreground text-[15px]" dir="auto">
                    {firstTimeKey(summary) === "all"
                      ? copy.firstTimeAll
                      : copy.firstTimeSome.replace("{n}", String(summary.clean))}
                  </p>
                )}
                <div className="my-1 flex items-center gap-1.5" aria-hidden="true">
                  {results.map((result) => (
                    <span
                      key={result.word}
                      className={cn(
                        "h-[7px] w-[30px] rounded-full",
                        result.outcome === "clean"
                          ? "bg-success"
                          : result.outcome === "assisted"
                            ? "bg-success/45"
                            : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <div className="border-border bg-card w-full rounded-2xl border px-5 py-4">
                  <p className="text-foreground text-lg font-semibold" dir="auto">
                    {copy.yourWordsNow.replace("{n}", String(bankTotal))}
                  </p>
                  {summary.stabilized > 0 && (
                    <p className="text-muted-foreground mt-0.5 text-sm" dir="auto">
                      {(countKey(summary.stabilized) === "one"
                        ? copy.stabilizedOne
                        : countKey(summary.stabilized) === "two"
                          ? copy.stabilizedTwo
                          : copy.stabilizedMany
                      ).replace("{n}", String(summary.stabilized))}
                    </p>
                  )}
                </div>
                <StoryRatingRow
                  lessonId="bank"
                  mode="words"
                  question={copy.ratingQuestion}
                  color={RATING_COLOR}
                  accentColor={RATING_ACCENT}
                />
                <div className="flex w-full items-center gap-3">
                  <Button asChild className="flex-1">
                    <Link href={backHref}>
                      <span dir="auto">
                        {backTo === "words" ? copy.backToMyWords : copy.finishBackHome}
                      </span>
                    </Link>
                  </Button>
                  {more && (
                    // A full page load of the same route, not a client navigation: this screen keeps the
                    // words it mounted with, so only a fresh load builds the next round.
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={pending > 0}
                      onClick={() => window.location.assign("/learn/words/review")}
                    >
                      <span dir="auto">
                        {copy.moreWords.replace("{n}", String(BANK_ROUND_SIZE))}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : phase === "learn" && word ? (
            <motion.div
              key={`${word.word}:learn`}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col items-center justify-center gap-2.5 px-6 py-8 lg:px-16"
              aria-live="polite"
            >
              {typedWrong && (
                <p className="text-muted-foreground text-sm" dir="auto">
                  {copy.youTyped.split("{word}")[0]}
                  <bdi dir="ltr" className="line-through">
                    {typedWrong}
                  </bdi>
                  {copy.youTyped.split("{word}")[1]}
                </p>
              )}
              <p
                className="text-foreground text-[clamp(3.25rem,2.4rem+3.6vw,4.5rem)] leading-none font-bold tracking-tight"
                dir="ltr"
              >
                {word.word}
              </p>
              {word.homeSentence && (
                <div className="border-border bg-card mt-2 w-full max-w-[640px] rounded-2xl border px-6 py-[18px] text-start">
                  <p className="text-muted-foreground text-left text-[13px]" dir="auto">
                    {(() => {
                      const when = firstMetLabel(word.firstSeenOn, todayISO, locale, copy);
                      if (!word.lessonTitle)
                        return copy.homeSentenceLabelPlain.replace("{when}", when);
                      const [before, after] = copy.homeSentenceLabel
                        .replace("{when}", when)
                        .split("{title}");
                      return (
                        <>
                          {before}
                          <bdi className="text-foreground font-semibold">{word.lessonTitle}</bdi>
                          {after}
                        </>
                      );
                    })()}
                  </p>
                  <p
                    className="text-foreground mt-2 text-[clamp(1.25rem,1.1rem+0.7vw,1.5rem)] leading-snug font-semibold"
                    dir="ltr"
                  >
                    <HomeSentence sentence={word.homeSentence} word={word.word} />
                  </p>
                  {translation && (
                    <p className="text-muted-foreground mt-1 text-left text-base" dir="auto">
                      {translation}
                    </p>
                  )}
                </div>
              )}
              <Button className="mt-2" onClick={() => setPhase("retry")}>
                {copy.tryAgain}
              </Button>
              <p className="text-muted-foreground text-sm" dir="auto">
                {copy.comesBackTomorrow}
              </p>
            </motion.div>
          ) : (
            word && (
              <motion.div
                key={`${word.word}:${phase}`}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 lg:px-16 [html[data-keyboard]_&]:gap-3 [html[data-keyboard]_&]:py-3"
              >
                {showMeaning && hint.term && (
                  <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
                    <p
                      className="text-foreground text-[clamp(2.1rem,1.68rem+1.92vw,2.7rem)] leading-tight font-bold text-balance"
                      dir={dir}
                    >
                      {hint.term}
                    </p>
                    {hint.definition && (
                      <p
                        className="text-muted-foreground text-[clamp(1.02rem,0.96rem+0.36vw,1.2rem)] font-medium"
                        dir={dir}
                      >
                        {hint.definition}
                      </p>
                    )}
                  </div>
                )}

                {word.form === "meaning" && (
                  <div className="bg-border compact-hide h-10 w-px" aria-hidden="true" />
                )}

                {word.form === "context" && (
                  <span
                    className="border-border text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium"
                    dir="auto"
                  >
                    {copy.newSentenceChip}
                  </span>
                )}

                {word.form === "audio" && (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      type="button"
                      aria-label={copy.playAgain}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => settingsRef.current?.replay()}
                      className="border-border bg-card text-primary focus-visible:ring-ring grid size-[92px] place-items-center rounded-full border outline-none focus-visible:ring-2"
                    >
                      <Volume2 className="size-8" aria-hidden="true" />
                    </button>
                    <p className="text-foreground text-xl font-semibold" dir="auto">
                      {copy.listenAndType}
                    </p>
                  </div>
                )}

                <div className="flex w-full max-w-2xl flex-col items-center gap-2">
                  <VocabularySentence
                    key={`${word.word}:${phase}`}
                    sentence={word.form === "audio" ? BLANK_TOKEN : word.prompt}
                    targetWord={word.word}
                    onResult={handleResult}
                    inputRef={inputRef}
                    fontFamily={sectionFontFamily}
                    enlarged
                  />
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {!finished && phase === "ask" && word?.form === "context" && !helped && word.ar && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setHelped(true);
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground absolute bottom-4 left-6 text-sm font-medium lg:left-10 [html[data-keyboard]_&]:hidden"
            dir="auto"
          >
            {copy.hint}
          </button>
        )}
      </div>
    </SharedInputProvider>
  );
}
