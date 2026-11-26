"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Keyboard, SkipForward, Volume2 } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { useLocale } from "@/components/providers/locale-provider";
import {
  GERMAN_KEYBOARD_ROWS,
  GERMAN_LETTERS,
  germanLettersStrings,
  matchesGermanLetter,
} from "@/lib/german-letters";
import { markGermanLettersDone } from "@/lib/german-letters-state";
import { cn } from "@/lib/utils";

/** Reads a text aloud in the browser's German voice, when it has one: a convenience, the lesson never depends on it. */
function speakGerman(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.8;
    synth.speak(utterance);
  } catch {
    // No voice, no sound: the written pronunciation note is still there.
  }
}

/**
 * The German letters lesson (permission germanZero): one letter at a time with its example word, how it
 * sounds and a sound button; the learner types the letter (the letter itself, its plain stand-in or the
 * spelled form all count, see matchesGermanLetter). The small keyboard button shows a German keyboard with
 * the letter's key lit; it is for looking at only, its keys never type. «Skip» counts the lesson as done,
 * and the lesson can be started again from the Words page. The done mark is kept on this browser.
 */
export function GermanLettersLesson({ next }: { next: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const s = germanLettersStrings(locale);
  const arabic = locale === "ar";
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [solved, setSolved] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const letter = GERMAN_LETTERS[index];

  useEffect(() => {
    if (!finished) inputRef.current?.focus();
  }, [index, finished]);
  if (!letter) return null;
  const wrong = value.trim() !== "" && !solved && !matchesGermanLetter(letter.letter, value);

  function leave() {
    markGermanLettersDone();
    router.push(next);
  }

  function advance() {
    if (index === GERMAN_LETTERS.length - 1) {
      markGermanLettersDone();
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setValue("");
    setSolved(false);
  }

  const target = letter.letter;
  function handleChange(text: string) {
    if (solved) return;
    setValue(text);
    if (matchesGermanLetter(target, text)) setSolved(true);
  }

  if (finished) {
    return (
      <div className="bg-background fixed inset-0 z-50 flex flex-col">
        <div className="flex shrink-0 items-center px-3 pt-2.5 pb-2">
          <Logo size="sm" />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div
            className="flex w-full max-w-sm flex-col items-center gap-4 text-center"
            dir={arabic ? "rtl" : "ltr"}
          >
            <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
              <Check className="size-7" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{s.doneTitle}</h1>
            <p className="text-muted-foreground text-sm">{s.doneBody}</p>
            <button
              type="button"
              onClick={() => router.push(next)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-11 rounded-full px-8 text-base font-medium"
            >
              {s.doneCta}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col overflow-y-auto">
      <div className="flex shrink-0 items-center gap-4 px-3 pt-2.5 pb-2">
        <Link href="/learn" className="flex shrink-0" aria-label="SentenceStep">
          <Logo size="sm" />
        </Link>
        <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full" dir="ltr">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300"
            style={{ width: `${((index + (solved ? 1 : 0)) / GERMAN_LETTERS.length) * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground text-xs tabular-nums" dir="ltr">
          {index + 1} / {GERMAN_LETTERS.length}
        </span>
        <button
          type="button"
          onClick={leave}
          className="border-border bg-card hover:bg-accent flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap"
        >
          {s.skip}
          <SkipForward className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-xl flex-col items-center text-center">
          <h1 className="text-muted-foreground mb-3 text-sm font-medium">{s.title}</h1>

          <div className="flex items-center gap-4" dir="ltr">
            <div className="text-[88px] leading-none font-semibold" lang="de">
              {letter.letter}
            </div>
            <button
              type="button"
              onClick={() => speakGerman(letter.speak)}
              aria-label={s.listen}
              className="border-border bg-card hover:bg-accent flex size-12 items-center justify-center rounded-full border"
            >
              <Volume2 className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="text-muted-foreground mt-2 text-base" lang="de" dir="ltr">
            {letter.word} <span aria-hidden="true">·</span> {arabic ? letter.wordAr : letter.wordEn}
          </div>
          <p
            className="bg-muted text-muted-foreground mt-3 max-w-md rounded-2xl px-4 py-2 text-sm"
            dir={arabic ? "rtl" : "ltr"}
          >
            {arabic ? letter.soundAr : letter.soundEn}
          </p>

          <p className="mt-7 mb-2 text-sm" dir={arabic ? "rtl" : "ltr"}>
            {s.typeIt}
          </p>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && solved) advance();
            }}
            maxLength={2}
            inputMode="text"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            lang="de"
            dir="ltr"
            placeholder={s.placeholder}
            aria-label={s.typeIt}
            className={cn(
              "bg-card h-14 w-32 rounded-xl border text-center text-2xl font-semibold outline-none placeholder:text-sm placeholder:font-normal focus-visible:ring-2 focus-visible:ring-offset-2",
              solved
                ? "border-emerald-500 focus-visible:ring-emerald-500"
                : wrong
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-border focus-visible:ring-ring",
            )}
          />
          <p
            className={cn("mt-2 min-h-5 text-sm", solved ? "text-emerald-600" : "text-destructive")}
            dir={arabic ? "rtl" : "ltr"}
            aria-live="polite"
          >
            {solved ? s.right : wrong ? s.wrong : ""}
          </p>

          {solved ? (
            <button
              type="button"
              onClick={advance}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 h-11 rounded-full px-8 text-base font-medium"
            >
              {index === GERMAN_LETTERS.length - 1 ? s.finish : s.next}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setHelpOpen((open) => !open)}
              aria-expanded={helpOpen}
              className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 mt-3 inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium"
              dir={arabic ? "rtl" : "ltr"}
            >
              <Keyboard className="size-5" aria-hidden="true" />
              {s.help}
            </button>
          )}

          {helpOpen && !solved && (
            <div className="border-border bg-card mt-4 w-full max-w-md rounded-2xl border p-3 sm:p-4">
              <p className="text-muted-foreground mb-3 text-xs" dir={arabic ? "rtl" : "ltr"}>
                {s.helpOpen}
              </p>
              <div className="flex flex-col items-center gap-1.5" dir="ltr" aria-hidden="true">
                {GERMAN_KEYBOARD_ROWS.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex gap-1.5"
                    style={{ paddingLeft: `${rowIndex * 14}px` }}
                  >
                    {row.map((key) => {
                      const target = key === letter.lower;
                      return (
                        <span
                          key={key}
                          className={cn(
                            "flex h-9 w-7 items-center justify-center rounded-md border border-b-[3px] text-sm select-none sm:h-10 sm:w-8",
                            target
                              ? "bg-primary border-primary text-primary-foreground animate-bounce font-semibold"
                              : "bg-background text-muted-foreground border-border",
                          )}
                        >
                          {key === "ß" ? "ß" : key.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-3 text-xs" dir={arabic ? "rtl" : "ltr"}>
                {s.helpNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
