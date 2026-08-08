"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";

import { fadeIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Sentence } from "@/types/content";

const NBSP = " ";

interface TypingSentenceProps {
  sentence: Sentence;
  onComplete: () => void;
  onCorrectLetter: () => void;
}

type LetterState = "correct" | "error" | "pending";

/** Splits into words and single-space tokens so word-wrapping happens only between words. */
function tokenize(target: string): string[] {
  return target.match(/\S+|\s/g) ?? [];
}

export function TypingSentence({ sentence, onComplete, onCorrectLetter }: TypingSentenceProps) {
  const [typed, setTyped] = useState("");
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const target = sentence.en;

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      clearTimeout(errorTimeoutRef.current);
      clearTimeout(completeTimeoutRef.current);
    };
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    if (value.length <= typed.length) {
      setTyped(value);
      setErrorIndex(null);
      return;
    }

    const nextChar = value.charAt(typed.length);
    const expected = target.charAt(typed.length);

    if (nextChar === expected) {
      const updated = typed + nextChar;
      setTyped(updated);
      setErrorIndex(null);
      onCorrectLetter();

      if (updated.length === target.length) {
        completeTimeoutRef.current = setTimeout(onComplete, 350);
      }
    } else {
      setErrorIndex(typed.length);
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setErrorIndex(null), 300);
    }
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="border-border bg-card relative overflow-hidden rounded-2xl border p-8 sm:p-12"
    >
      {sentence.speaker && (
        <p className="text-muted-foreground mb-3 text-sm font-semibold">
          Speaker {sentence.speaker}
        </p>
      )}

      <div
        onClick={() => inputRef.current?.focus()}
        className="relative cursor-text text-2xl leading-relaxed font-medium tracking-wide sm:text-3xl"
      >
        <div aria-hidden="true" dir="ltr">
          {(() => {
            let charIndex = 0;

            return tokenize(target).map((token, tokenIndex) => {
              const renderLetter = (char: string, index: number) => {
                const state: LetterState =
                  errorIndex === index ? "error" : index < typed.length ? "correct" : "pending";

                return (
                  <motion.span
                    key={index}
                    animate={state === "error" ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "inline-block rounded transition-colors duration-150",
                      state === "correct" && "text-success",
                      state === "error" && "text-danger bg-danger/10",
                      state === "pending" && "text-muted-foreground/40",
                    )}
                  >
                    {char === " " ? NBSP : char}
                  </motion.span>
                );
              };

              if (token === " ") {
                const index = charIndex;
                charIndex += 1;
                return renderLetter(token, index);
              }

              const startIndex = charIndex;
              charIndex += token.length;

              return (
                <span key={tokenIndex} className="inline-block whitespace-nowrap">
                  {token.split("").map((char, i) => renderLetter(char, startIndex + i))}
                </span>
              );
            });
          })()}
        </div>
        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onPaste={(event) => event.preventDefault()}
          className="absolute inset-0 cursor-text opacity-0"
          dir="ltr"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={`Type this sentence: ${target}`}
        />
      </div>

      <p className="text-muted-foreground mt-6 text-base" dir="rtl">
        {sentence.ar}
      </p>
    </motion.div>
  );
}
