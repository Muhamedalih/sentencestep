"use client";

import { motion } from "framer-motion";
import type { ChangeEvent, ClipboardEvent, RefObject } from "react";

import { tokenize } from "@/lib/typing";
import type { LetterState } from "@/lib/typing";
import { cn } from "@/lib/utils";

const NBSP = " ";

interface TypingTextProps {
  target: string;
  typed: string;
  letterStates: LetterState[];
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  reducedMotion?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Renders the target sentence as per-character spans (correct / current /
 * error / pending) over an invisible native input that actually captures
 * keystrokes — real text input under the hood means mobile keyboards, IME,
 * and native backspace all just work. Shared by every lesson mode; only the
 * chrome around it (card vs. chat bubble, etc.) differs per mode.
 */
export function TypingText({
  target,
  typed,
  letterStates,
  inputRef,
  onChange,
  onPaste,
  reducedMotion = false,
  className,
  textClassName,
}: TypingTextProps) {
  let charIndex = 0;

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "focus-within:ring-ring focus-within:ring-offset-background relative cursor-text rounded-md outline-none focus-within:ring-2 focus-within:ring-offset-2",
        className,
      )}
    >
      <div
        aria-hidden="true"
        dir="ltr"
        className={cn("leading-relaxed font-medium tracking-wide", textClassName)}
      >
        {tokenize(target).map((token, tokenIndex) => {
          if (token === " ") {
            const index = charIndex;
            charIndex += 1;
            return (
              <Letter
                key={index}
                state={letterStates[index] ?? "pending"}
                display={NBSP}
                reducedMotion={reducedMotion}
              />
            );
          }

          const startIndex = charIndex;
          charIndex += token.length;

          return (
            <span key={tokenIndex} className="inline-block whitespace-nowrap">
              {token.split("").map((char, i) => {
                const index = startIndex + i;
                return (
                  <Letter
                    key={index}
                    state={letterStates[index] ?? "pending"}
                    display={char}
                    reducedMotion={reducedMotion}
                  />
                );
              })}
            </span>
          );
        })}
      </div>
      <input
        ref={inputRef}
        value={typed}
        onChange={onChange}
        onPaste={onPaste}
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
  );
}

function Letter({
  state,
  display,
  reducedMotion,
}: {
  state: LetterState;
  display: string;
  reducedMotion: boolean;
}) {
  return (
    <motion.span
      animate={!reducedMotion && state === "error" ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative inline-block rounded transition-colors duration-150",
        state === "correct" && "text-success",
        state === "error" && "text-danger bg-danger/10",
        state === "current" && "bg-brand-muted/70 text-foreground",
        state === "pending" && "text-muted-foreground/40",
      )}
    >
      {state === "current" && (
        <motion.span
          aria-hidden="true"
          className="bg-primary absolute top-0.5 bottom-0.5 -left-px w-0.5 rounded-full"
          animate={reducedMotion ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
          transition={
            reducedMotion ? undefined : { duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }
          }
        />
      )}
      {display}
    </motion.span>
  );
}
