"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, CheckCircle2, Eye, Lightbulb } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { SentenceDiff } from "@/components/learning/sentence-diff";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import {
  compareDictation,
  dictationMistakes,
  firstLetterHint,
  normalizeDictationWords,
} from "@/lib/features/dictation";
import type { DictationResult } from "@/lib/features/dictation";
import type { FromMemoryItem } from "@/lib/features/from-memory";
import { isMistakeWorthTracking } from "@/lib/mistakes/normalize";
import { cn } from "@/lib/utils";
import type { LearningMode } from "@/types/content";

interface FromMemorySessionProps {
  items: FromMemoryItem[];
  mode: LearningMode;
  resolvedVoiceId?: string | null;
  speakerVoiceMap?: Record<string, string>;
  /** Admin options (see /admin/features). */
  allowReveal: boolean;
  showFirstLetters: boolean;
  /** Wrong words go to Fix Your Mistakes, same as a typed or dictated sentence. */
  onMistakes?: (sentenceId: string, words: { word: string; errorIndexes: number[] }[]) => void;
  /** Called once when the learner finishes the last sentence. */
  onFinished?: (summary: { total: number; clean: number }) => void;
  onExit: () => void;
}

interface Answer {
  exact: boolean;
  helped: boolean;
}

/**
 * From memory (Arabic → English): after a lesson, the learner sees each
 * sentence's meaning in their own language and types the English from
 * memory. Grading is whole-sentence on Enter with the same word-by-word diff
 * as Dictation — a translation prompt has exactly one intended answer here
 * (the lesson's own sentence), so an exact match is the bar and the helpers
 * (first letters, reveal a word) are how a learner gets unstuck.
 */
export function FromMemorySession({
  items,
  mode,
  resolvedVoiceId,
  speakerVoiceMap,
  allowReveal,
  showFirstLetters,
  onMistakes,
  onFinished,
  onExit,
}: FromMemorySessionProps) {
  const { dir, t } = useLocale();
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), mode);
  const textStyle = sectionFontFamily ? { fontFamily: sectionFontFamily } : undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [lettersShown, setLettersShown] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [mistakesRecorded, setMistakesRecorded] = useState(false);

  const total = items.length;
  const item = items[index];
  const finished = index >= total;

  useEffect(() => {
    if (!finished) inputRef.current?.focus();
  }, [index, finished]);

  const targetWords = useMemo(
    () => (item ? normalizeDictationWords(item.sentence.en) : []),
    [item],
  );

  function check() {
    if (!item || result || value.trim().length === 0) return;
    const graded = compareDictation(item.sentence.en, value);
    setResult(graded);
    const wrong = dictationMistakes(graded).filter((mistake) =>
      isMistakeWorthTracking(mistake.word),
    );
    if (wrong.length > 0) {
      onMistakes?.(item.sentence.id, wrong);
      setMistakesRecorded(true);
    }
    setAnswers((current) => [
      ...current,
      { exact: graded.exact, helped: revealed > 0 || lettersShown },
    ]);
  }

  function next() {
    if (!result) return;
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setValue("");
    setResult(null);
    setRevealed(0);
    setLettersShown(false);
    if (nextIndex >= total) {
      const clean = answers.filter((answer) => answer.exact && !answer.helped).length;
      onFinished?.({ total, clean });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (result) next();
    else check();
  }

  if (finished) {
    const clean = answers.filter((answer) => answer.exact && !answer.helped).length;
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-6 py-16 text-center">
        <CheckCircle2 className="text-success size-12" aria-hidden="true" />
        <h2 className="text-3xl font-semibold tracking-tight">{t.fromMemory.summaryHeading}</h2>
        <p className="text-muted-foreground text-lg">
          {t.fromMemory.summaryBody
            .replace("{clean}", String(clean))
            .replace("{total}", String(total))}
        </p>
        {mistakesRecorded && (
          <p className="text-muted-foreground text-sm">{t.fromMemory.mistakesSaved}</p>
        )}
        <Button type="button" onClick={onExit}>
          {t.fromMemory.backToResults}
        </Button>
      </div>
    );
  }

  if (!item) return null;

  const sentenceVoiceId =
    (mode === "conversation" &&
      item.sentence.speaker &&
      speakerVoiceMap?.[item.sentence.speaker]) ||
    resolvedVoiceId;
  const isLast = index === total - 1;
  const revealedText = targetWords.slice(0, revealed).join(" ");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 lg:py-12">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t.fromMemory.backToResults}
        </button>
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          {index + 1} / {total}
        </span>
      </div>
      <Progress value={(index / total) * 100} className="h-1" />

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {t.fromMemory.title} · {t.fromMemory.promptLabel}
        </p>
        <p className="text-3xl leading-snug font-semibold text-balance sm:text-4xl" dir={dir}>
          {item.prompt}
        </p>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        readOnly={result !== null}
        onChange={(event) => !result && setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={(event) => event.preventDefault()}
        placeholder={t.fromMemory.placeholder}
        aria-label={t.fromMemory.placeholder}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        dir="ltr"
        style={textStyle}
        className={cn(
          "border-border/70 bg-background/60 focus-visible:border-ring focus-visible:ring-ring/40 w-full rounded-xl border-2 px-4 py-3.5 text-2xl outline-none focus-visible:ring-4 sm:text-3xl",
          result && "opacity-70",
        )}
      />

      {!result ? (
        <div className="flex flex-col gap-4">
          {(lettersShown || revealed > 0) && (
            <p dir="ltr" className="text-muted-foreground text-xl tracking-wide" style={textStyle}>
              {revealed > 0 && (
                <span className="text-foreground font-semibold">{revealedText} </span>
              )}
              {lettersShown && (
                <span>
                  {firstLetterHint(item.sentence.en).split(" ").slice(revealed).join(" ")}
                </span>
              )}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={check} disabled={value.trim().length === 0}>
              {t.dictation.check}
            </Button>
            {showFirstLetters && !lettersShown && (
              <Button type="button" variant="outline" onClick={() => setLettersShown(true)}>
                <Lightbulb className="size-4" aria-hidden="true" />
                {t.fromMemory.showFirstLetters}
              </Button>
            )}
            {allowReveal && revealed < targetWords.length && (
              <Button type="button" variant="outline" onClick={() => setRevealed((n) => n + 1)}>
                <Eye className="size-4" aria-hidden="true" />
                {t.fromMemory.revealWord}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4" aria-live="polite">
          <p
            className={cn(
              "flex items-center gap-2 text-lg font-semibold",
              result.exact ? "text-success" : "text-accent",
            )}
          >
            {result.exact && <CheckCircle2 className="size-5" aria-hidden="true" />}
            {result.exact ? t.dictation.perfect : t.dictation.almost}
          </p>
          <SentenceDiff result={result} textStyle={textStyle} />
          {result.exact && (
            <p dir="ltr" className="text-xl sm:text-2xl" style={textStyle}>
              {item.sentence.en}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" onClick={next}>
              {isLast ? t.fromMemory.finish : t.dictation.continue}
            </Button>
            <PronunciationButton
              text={item.sentence.en}
              audioUrl={item.sentence.audioUrl}
              resetKey={`memory-${item.sentence.id}`}
              inputRef={inputRef}
              kokoroVoiceId={sentenceVoiceId}
              contentType="sentence"
              contentId={item.sentence.id}
              variant="outline"
              className="border-border/60 bg-background/85 shadow-sm backdrop-blur-md"
            />
            <span className="text-muted-foreground text-sm">{t.dictation.pressEnterContinue}</span>
          </div>
        </div>
      )}
    </div>
  );
}
