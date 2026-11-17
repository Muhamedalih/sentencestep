"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Volume2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useSpeech } from "@/hooks/use-speech";
import type { TrainingWord } from "@/lib/video-dictation/finish-summary";
import { videoStrings } from "@/lib/video-dictation/strings";

const RED = "#e5322d";
const GREEN = "#3dba5f";

/**
 * Training on the words of a video (the button of VideoFinishLook), in the way the Word Lists are
 * practised: the learner hears the word and has to type it, letter by letter. A wrong letter is not
 * accepted (the slots shake), so a word only moves on when it is typed right; the red bar fills with
 * every word. Nothing is stored or sent: it is a practice round on the words this page already has.
 */
export function VideoWordTraining({
  words,
  nextLessonId,
  onBack,
}: {
  words: readonly TrainingWord[];
  nextLessonId: string | null;
  onBack: () => void;
}) {
  const reduced = useReducedMotion();
  const { locale } = useLocale();
  const strings = videoStrings(locale);
  const { speakWord } = useSpeech();
  const inputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [shake, setShake] = useState(0);
  const [solved, setSolved] = useState(false);

  const word = words[index];
  const finished = index >= words.length;

  const say = useCallback(
    (text: string) => {
      speakWord(text);
    },
    [speakWord],
  );

  // Each new word is said once as it appears, and the field takes the keyboard.
  useEffect(() => {
    if (!word) return;
    say(word.word);
    inputRef.current?.focus();
    // `say` changes with the speech settings; the word is what decides when to speak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handleChange(value: string) {
    if (!word || solved) return;
    const target = word.word.toLowerCase();
    const next = value.toLowerCase();
    if (next.length < typed.length) {
      setTyped(word.word.slice(0, next.length));
      return;
    }
    if (!target.startsWith(next)) {
      setShake((n) => n + 1);
      return;
    }
    setTyped(word.word.slice(0, next.length));
    if (next === target) {
      setSolved(true);
      window.setTimeout(
        () => {
          setSolved(false);
          setTyped("");
          setIndex((i) => i + 1);
        },
        reduced ? 250 : 650,
      );
    }
  }

  const percent = Math.round((Math.min(index, words.length) / Math.max(1, words.length)) * 100);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black text-white">
      <div
        style={{ zoom: 0.9 }}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-8 sm:px-10"
      >
        <div className="flex flex-col gap-3" dir="ltr">
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-3.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "#1a1010" }}
          >
            <motion.div
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={reduced ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: RED }}
            />
          </div>
        </div>

        {finished ? (
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-8"
          >
            <h2 className="text-[clamp(2.4rem,6vw,4rem)] leading-tight font-extrabold" dir="auto">
              {strings.trainDone}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <TrainButton primary onClick={onBack}>
                {strings.trainBack}
              </TrainButton>
              {nextLessonId ? (
                <TrainLink href={`/learn/video/${nextLessonId}`}>{strings.nextVideo}</TrainLink>
              ) : (
                <TrainLink href="/learn/video">{strings.backToLibrary}</TrainLink>
              )}
            </div>
          </motion.div>
        ) : (
          word && (
            <div className="flex flex-col items-center gap-8 text-center">
              <p className="text-lg font-medium text-white/60" dir="auto">
                {strings.trainListen}
              </p>
              <motion.button
                type="button"
                onClick={() => say(word.word)}
                aria-label={strings.trainReplay}
                whileHover={reduced ? undefined : { scale: 1.08 }}
                whileTap={reduced ? undefined : { scale: 0.92 }}
                className="grid size-24 place-items-center rounded-full"
                style={{ background: "#ece9e0", color: "#14192b" }}
              >
                <Volume2 className="size-10" aria-hidden="true" />
              </motion.button>
              {word.meaning && (
                <p className="text-xl text-white/60" dir="rtl">
                  {word.meaning}
                </p>
              )}
              <motion.div
                key={shake}
                animate={shake > 0 && !reduced ? { x: [0, -12, 12, -8, 8, 0] } : undefined}
                transition={{ duration: 0.35 }}
                onClick={() => inputRef.current?.focus()}
                className="relative flex flex-wrap justify-center gap-2"
                dir="ltr"
              >
                {word.word.split("").map((letter, at) => {
                  const done = at < typed.length;
                  return (
                    <span
                      key={at}
                      className="grid h-20 w-14 place-items-center rounded-2xl border text-4xl font-bold sm:w-16"
                      style={{
                        background: done ? (solved ? GREEN : "#ece9e0") : "transparent",
                        borderColor: done ? "transparent" : "#2a2a30",
                        color: done ? (solved ? "#04210e" : "#14192b") : "transparent",
                      }}
                    >
                      {done ? typed[at] : letter}
                    </span>
                  );
                })}
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(event) => handleChange(event.target.value)}
                  autoFocus
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label={strings.trainListen}
                  className="absolute inset-0 h-full w-full opacity-0"
                />
              </motion.div>
            </div>
          )
        )}

        {!finished && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onBack}
              className="text-base font-medium text-white/50 hover:text-white"
            >
              {strings.trainBack}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TrainButton({
  primary,
  onClick,
  children,
}: {
  primary?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "h-20 rounded-2xl border text-xl font-semibold transition-transform hover:-translate-y-1 hover:scale-[1.03] active:scale-95 " +
        (primary
          ? "border-transparent bg-[#f1f2f6] text-[#12141c]"
          : "border-[#1e1e22] bg-black text-white")
      }
    >
      {children}
    </button>
  );
}

function TrainLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="flex h-20 items-center justify-center rounded-2xl border border-[#1e1e22] bg-black text-xl font-semibold text-white transition-transform hover:-translate-y-1 hover:scale-[1.03] active:scale-95"
    >
      {children}
    </Link>
  );
}
