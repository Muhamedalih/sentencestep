"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Volume2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { splitAroundWord } from "@/lib/passages/text";
import type { PassageWord } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * "Words from this passage" — the end of a passage hands over its own key
 * words, each with its Arabic meaning, the line it was met in (the word lit up
 * inside it) and a button to hear it. They are also a ready-made lesson in
 * Word Lists; the button below goes there (or, for an admin looking at a
 * passage that is not published yet, to the admin preview of that lesson).
 *
 * One audio element serves every card, so pressing a second word replaces the
 * first instead of talking over it; a word with no recorded clip falls back to
 * the browser's own voice, the same fallback pronunciation buttons use.
 */
export function PassageWordsPanel({
  words,
  showTranslation,
  meaningsAvailable,
  wordsLink,
}: {
  words: PassageWord[];
  /** Show the Arabic of each word's context line (the translation switch). */
  showTranslation: boolean;
  /** The word meanings are Arabic, so they only mean something to a learner whose support language is Arabic. */
  meaningsAvailable: boolean;
  wordsLink: { href: string; adminPreview: boolean } | null;
}) {
  const { t } = useLocale();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((word: PassageWord) => {
    audioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (word.audioUrl) {
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        setPlayingId(null);
        setLoadingId(null);
      };
      audio.src = word.audioUrl;
      audio.currentTime = 0;
      setLoadingId(word.id);
      setPlayingId(word.id);
      audio
        .play()
        .then(() => setLoadingId((current) => (current === word.id ? null : current)))
        .catch(() => {
          setPlayingId(null);
          setLoadingId(null);
        });
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      setPlayingId(word.id);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return (
    <section className="mt-8" aria-labelledby="passage-words-heading">
      <h3 id="passage-words-heading" className="text-lg font-semibold">
        {t.passages.wordsHeading}
      </h3>
      <p className="text-muted-foreground mt-1 text-sm">{t.passages.wordsBody}</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {words.map((word) => {
          const parts = word.contextEn ? splitAroundWord(word.contextEn, word.word) : null;
          return (
            <li key={word.id} className="border-border bg-card rounded-2xl border p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xl leading-tight font-semibold" dir="ltr" lang="en">
                    {word.word}
                  </p>
                  {meaningsAvailable && (
                    <p className="text-primary mt-1 text-base" dir="rtl" lang="ar">
                      {word.hintAr}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => speak(word)}
                  aria-label={`${t.passages.listenToWord}: ${word.word}`}
                  className={cn(
                    "text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 pointer-coarse:size-11",
                    playingId === word.id && "bg-brand-muted text-primary",
                  )}
                >
                  {loadingId === word.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Volume2 className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {word.contextEn && (
                <p
                  className="text-muted-foreground mt-3 text-sm leading-relaxed"
                  dir="ltr"
                  lang="en"
                >
                  {parts ? (
                    <>
                      {parts[0]}
                      <span className="bg-primary/15 text-foreground rounded px-0.5 font-semibold">
                        {parts[1]}
                      </span>
                      {parts[2]}
                    </>
                  ) : (
                    word.contextEn
                  )}
                </p>
              )}
              {showTranslation && word.contextAr && (
                <p
                  className="text-muted-foreground/80 mt-1 text-sm leading-relaxed"
                  dir="rtl"
                  lang="ar"
                >
                  {word.contextAr}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {wordsLink && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" variant="secondary" className="rounded-full">
            <Link href={wordsLink.href}>{t.passages.practiceWords}</Link>
          </Button>
          {wordsLink.adminPreview && (
            <p className="text-muted-foreground text-xs">
              Admin preview: this word lesson is hidden from learners until Passages is published.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
