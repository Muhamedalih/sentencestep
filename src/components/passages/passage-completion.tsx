"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Check, Loader2, Trophy, Volume2 } from "lucide-react";

import { PassageButton, PassageLinkButton } from "@/components/passages/passage-button";
import type { PassageAnswer } from "@/components/passages/passage-question-dock";
import { useLocale } from "@/components/providers/locale-provider";
import { scorePercent } from "@/lib/passages/progress";
import { splitAroundWord } from "@/lib/passages/text";
import type { Passage, PassageQuestion, PassageWord } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * The end of a passage, laid out to fit one screen: a small "finished" card with
 * the score and the way on at the left, and the passage's words at the right —
 * each with its Arabic meaning, the sentence it was met in (the word lit up)
 * and a button to hear it. They are also a lesson of their own, hidden from Word
 * Lists; an admin gets a button to the admin preview of that lesson (a learner only
 * gets one if an admin published the lesson on purpose).
 *
 * One audio element serves every word, so pressing a second word replaces the
 * first instead of talking over it. A word is only ever heard in a recorded
 * voice: one with no recorded clip has no speaker button at all, never the
 * browser's own voice.
 */

function useWordSpeaker() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const speak = useCallback((word: PassageWord) => {
    audioRef.current?.pause();
    if (!word.audioUrl) return;

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
  }, []);

  return { playingId, loadingId, speak };
}

export function PassageCompletion({
  passage,
  answers,
  allQuestions,
  meaningsAvailable,
  signedIn,
  saveFailed,
  rewardLines,
  nextPassage,
  todayNext,
  wordsLink,
  onReadAgain,
}: {
  passage: Passage;
  answers: Record<string, PassageAnswer>;
  allQuestions: PassageQuestion[];
  /** The word meanings are Arabic, so they only mean something to a learner whose support language is Arabic. */
  meaningsAvailable: boolean;
  signedIn: boolean;
  saveFailed: boolean;
  /** What finishing earned in the daily quests and badges ("Quest complete: …", "New badge: …"); empty when nothing. */
  rewardLines: string[];
  nextPassage: { id: string; title: string } | null;
  /** Today's session: the way on to the story, shown as the one big button instead of "Next passage". */
  todayNext: { href: string } | null;
  wordsLink: { href: string; adminPreview: boolean } | null;
  onReadAgain: () => void;
}) {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const speaker = useWordSpeaker();

  const total = allQuestions.length;
  const correct = allQuestions.filter((question) => answers[question.id]?.correct).length;
  const percent = scorePercent(correct, total);

  const listVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduced ? 0 : 0.06, delayChildren: reduced ? 0 : 0.1 },
    },
  };
  const itemVariants: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
      };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-12">
      <motion.section
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="border-border bg-card rounded-3xl border p-6 shadow-sm"
      >
        <div className="flex items-center gap-3.5">
          <motion.span
            initial={reduced ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.1 }}
            className="bg-success/15 text-success flex size-12 shrink-0 items-center justify-center rounded-full"
          >
            <Check className="size-6" aria-hidden="true" />
          </motion.span>
          <div className="min-w-0">
            <h2 className="text-xl leading-tight font-semibold tracking-tight">
              {t.passages.completeHeading}
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              <bdi>
                {t.passages.score
                  .replace("{correct}", String(correct))
                  .replace("{total}", String(total))}
              </bdi>
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {allQuestions.map((question) => (
            <span
              key={question.id}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                answers[question.id]?.correct ? "bg-success" : "bg-danger/70",
              )}
            />
          ))}
        </div>
        <span className="sr-only">{percent}%</span>

        {rewardLines.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1.5">
            {rewardLines.map((line) => (
              <motion.li
                key={line}
                initial={reduced ? false : { opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 24, delay: 0.25 }}
                className="bg-primary/10 text-primary flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
              >
                <Trophy className="size-4 shrink-0" aria-hidden="true" />
                <bdi>{line}</bdi>
              </motion.li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          {todayNext ? (
            <PassageLinkButton
              href={todayNext.href}
              size="lg"
              className="w-full justify-between"
              trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              {t.today.continueStory}
            </PassageLinkButton>
          ) : nextPassage ? (
            <PassageLinkButton
              href={`/learn/passages/${nextPassage.id}`}
              size="lg"
              className="w-full justify-between"
              trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              {t.passages.nextPassage}
            </PassageLinkButton>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
            <PassageButton variant="quiet" onClick={onReadAgain}>
              {t.passages.readAgain}
            </PassageButton>
            <PassageLinkButton href="/learn/passages" variant="quiet">
              {t.passages.backToAll}
            </PassageLinkButton>
          </div>
        </div>

        {!signedIn && (
          <p className="text-muted-foreground mt-4 text-sm">
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t.passages.signInToSave}
            </Link>
          </p>
        )}
        {saveFailed && <p className="text-danger mt-4 text-sm">{t.passages.savingFailed}</p>}
      </motion.section>

      {passage.words.length > 0 && (
        <section aria-labelledby="passage-words-heading">
          <h3 id="passage-words-heading" className="text-lg font-semibold">
            {t.passages.wordsHeading}
          </h3>
          <p className="text-muted-foreground mt-0.5 text-sm">{t.passages.wordsBody}</p>

          <motion.ul
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            {passage.words.map((word) => {
              const parts = word.contextEn ? splitAroundWord(word.contextEn, word.word) : null;
              return (
                <motion.li
                  key={word.id}
                  variants={itemVariants}
                  className="border-border bg-card flex flex-col gap-1 rounded-2xl border px-4 py-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xl leading-tight font-semibold" dir="ltr" lang="en">
                      {word.word}
                    </p>
                    {word.audioUrl && (
                      <button
                        type="button"
                        onClick={() => speaker.speak(word)}
                        aria-label={`${t.passages.listenToWord}: ${word.word}`}
                        className={cn(
                          "text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring -me-1.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 pointer-coarse:size-11",
                          speaker.playingId === word.id && "bg-brand-muted text-primary",
                        )}
                      >
                        {speaker.loadingId === word.id ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Volume2 className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </div>
                  {meaningsAvailable && (
                    <p className="text-primary text-[0.95rem]" dir="rtl" lang="ar">
                      {word.hintAr}
                    </p>
                  )}
                  {word.contextEn && (
                    <p
                      className="text-muted-foreground mt-0.5 line-clamp-2 text-[0.8rem] leading-snug"
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
                </motion.li>
              );
            })}
          </motion.ul>

          {wordsLink && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PassageLinkButton href={wordsLink.href} variant="soft">
                {t.passages.practiceWords}
              </PassageLinkButton>
              {wordsLink.adminPreview && (
                <p className="text-muted-foreground text-xs">
                  Admin preview: this word lesson is hidden from learners.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
