"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, Volume2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { GERMAN_ALPHABET } from "@/lib/german-alphabet";
import { playGermanLetter } from "@/lib/german-letter-audio";
import { GERMAN_LETTERS_PATH, germanLettersStrings } from "@/lib/german-letters";
import { useGermanLettersDone } from "@/lib/german-letters-state";

/**
 * «German letters», the first lesson of the German Words page (permission germanZero): all 30 letters,
 * A to Z, ä ö ü and ß, each with its recorded name and example word. Tap a letter to hear it. The
 * practice (typing the six hard ones) starts from the button on top and can be repeated any time.
 */
export function GermanAlphabetPage() {
  const { locale } = useLocale();
  const s = germanLettersStrings(locale);
  const arabic = locale === "ar";
  const done = useGermanLettersDone();
  const Back = arabic ? ChevronRight : ChevronLeft;
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14" dir={arabic ? "rtl" : "ltr"}>
      <Link
        href="/learn/word-lists"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <Back className="size-4" aria-hidden="true" />
        {s.alphabetBack}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{s.cardTitle}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{s.alphabetBody}</p>
        </div>
        <Link
          href={`${GERMAN_LETTERS_PATH}?from=words`}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#f3efe3] px-5 text-sm font-bold text-[#17261e] shadow-[0_2px_0_rgba(0,0,0,0.18)] hover:bg-[#ebe7d8]"
        >
          {done && <Check className="size-4" aria-hidden="true" />}
          {done ? s.repeat : s.cardStart}
        </Link>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GERMAN_ALPHABET.map((entry) => (
          <li key={entry.key}>
            <button
              type="button"
              onClick={() => void playGermanLetter(entry.letter)}
              className="border-border bg-card hover:bg-accent flex w-full flex-col items-center gap-1 rounded-2xl border px-3 py-4 text-center transition-colors outline-none focus-visible:ring-2"
              aria-label={`${s.listen}: ${entry.letter}`}
            >
              <span className="text-5xl leading-none font-semibold" lang="de" dir="ltr">
                {entry.letter}
                <span className="text-muted-foreground ms-1 text-3xl font-normal">
                  {entry.letter === "ß" ? "" : entry.letter.toLowerCase()}
                </span>
              </span>
              <span className="text-muted-foreground mt-1 text-sm">{entry.nameAr}</span>
              <span className="text-xs" lang="de" dir="ltr">
                {entry.word} <span aria-hidden="true">·</span>{" "}
                {arabic ? entry.wordAr : entry.wordEn}
              </span>
              <Volume2 className="text-muted-foreground mt-1 size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
