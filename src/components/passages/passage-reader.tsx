"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Pause, Play } from "lucide-react";

import { PassageCompletion } from "@/components/passages/passage-completion";
import { PassageControls } from "@/components/passages/passage-controls";
import { PassageListenStage } from "@/components/passages/passage-listen-stage";
import { PassageQuestionDock } from "@/components/passages/passage-question-dock";
import type { PassageAnswer } from "@/components/passages/passage-question-dock";
import { PassageText } from "@/components/passages/passage-text";
import { PassageTips } from "@/components/passages/passage-tips";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { usePassageAudio } from "@/hooks/use-passage-audio";
import {
  readTipsSeen,
  usePassagePreferences,
  writeTipsSeen,
} from "@/hooks/use-passage-preferences";
import { savePassageProgressAction } from "@/lib/passages/actions";
import { posterArtFor } from "@/lib/passages/art";
import type { Passage, PassageQuestion, PassageSection } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * The passage reader. A part has two moments: first the TEXT — set as a page, so
 * the whole part fits one screen, read aloud with the speaking sentence lit — and
 * only when the learner has read it and presses "Check yourself" the QUESTION,
 * which rises over the text as a card. After the last part come the score and the
 * passage's words, on one screen. Nothing is typed here: this is the
 * comprehension counterpart to the typing lessons.
 *
 * Listen-only hides the text during the first moment (the learner has to
 * understand by ear) and reveals it once the question is answered. The whole
 * passage is loaded once by the page, so moving between parts costs no request;
 * the only traffic is a small progress save after each part.
 */

export interface PassageReaderProps {
  passage: Passage;
  /** The part to open on — the first unfinished one for a passage in progress, else 0. */
  initialSectionIndex: number;
  /** Arabic translations exist, and this learner's support language is Arabic. */
  translationAvailable: boolean;
  /** The next passage in the list, for the end screen; null on the last one. */
  nextPassage: { id: string; title: string } | null;
  /** Where "Practice these words" goes, and whether it is the real Word Lists page or the admin-only preview of a lesson that is not published yet. Null when the passage has no word lesson. */
  wordsLink: { href: string; adminPreview: boolean } | null;
}

type Phase = "read" | "check";

export function PassageReader({
  passage,
  initialSectionIndex,
  translationAvailable,
  nextPassage,
  wordsLink,
}: PassageReaderProps) {
  const { t } = useLocale();
  const userId = useAuthUserId();
  const reducedMotion = useReducedMotion();
  const prefs = usePassagePreferences();

  const sectionCount = passage.sections.length;
  const [sectionIndex, setSectionIndex] = useState(() =>
    Math.min(Math.max(initialSectionIndex, 0), Math.max(sectionCount - 1, 0)),
  );
  const [phase, setPhase] = useState<Phase>("read");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [answers, setAnswers] = useState<Record<string, PassageAnswer>>({});
  const [evidenceIndex, setEvidenceIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  /** How much of the screen's bottom the question card takes (its height and margin) — the page leaves that much room under the text. */
  const [dockSpace, setDockSpace] = useState(0);

  const section = passage.sections[sectionIndex] as PassageSection | undefined;
  const showTranslation = prefs.translation && translationAvailable;

  const audio = usePassageAudio(section?.sentences ?? [], prefs.rate);
  const { stop: stopAudio } = audio;

  // Listen-only needs a whole part's audio; until the question is answered the text stays hidden.
  const listenOnlyActive = prefs.listenOnly && audio.hasAudio && !revealed;

  // The "before you begin" card is shown once, on the very first passage, not on every one.
  useEffect(() => {
    if (!readTipsSeen()) setShowTips(true);
  }, []);

  const dismissTips = useCallback(() => {
    writeTipsSeen();
    setShowTips(false);
  }, []);

  const speakers = useMemo(
    () => [
      ...new Set(
        passage.sections.flatMap((candidate) =>
          candidate.sentences
            .map((sentence) => sentence.speaker)
            .filter((name): name is string => Boolean(name)),
        ),
      ),
    ],
    [passage.sections],
  );

  const allQuestions = useMemo(
    () => passage.sections.flatMap((candidate) => candidate.questions),
    [passage.sections],
  );
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;

  const art = useMemo(
    () => posterArtFor(passage.tone, passage.order),
    [passage.tone, passage.order],
  );

  const saveProgress = useCallback(
    async (sectionsDone: number, completed: boolean) => {
      if (!userId) return;
      const payload = {
        passageId: passage.id,
        sectionsDone,
        correct: correctCount,
        total: answeredCount,
        completed,
      };
      // One quiet retry: a dropped request must not leave a finished part unsaved.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await savePassageProgressAction(payload);
          if (result.ok || result.reason === "signed-out" || result.reason === "unavailable") {
            if (completed) setSaveFailed(false);
            return;
          }
        } catch {
          // fall through to the retry
        }
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      if (completed) setSaveFailed(true);
    },
    [answeredCount, correctCount, passage.id, userId],
  );

  const resetPart = useCallback(() => {
    stopAudio();
    setPhase("read");
    setQuestionIndex(0);
    setEvidenceIndex(null);
    setRevealed(false);
  }, [stopAudio]);

  /** The part is done: save it, and move to the next part or the end screen. */
  const finishPart = useCallback(() => {
    const isLast = sectionIndex >= sectionCount - 1;
    void saveProgress(sectionIndex + 1, isLast);
    resetPart();
    if (isLast) setComplete(true);
    else setSectionIndex((current) => current + 1);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion, resetPart, saveProgress, sectionCount, sectionIndex]);

  /** "Check yourself": the text is read, the question rises. A part with no question simply moves on. */
  const handleCheck = useCallback(() => {
    if (!section || section.questions.length === 0) {
      finishPart();
      return;
    }
    stopAudio();
    setQuestionIndex(0);
    setPhase("check");
  }, [finishPart, section, stopAudio]);

  const handleAnswer = useCallback(
    (question: PassageQuestion, picked: number) => {
      setAnswers((current) => {
        // One try per question: the first pick is the answer, so the score means something.
        if (current[question.id]) return current;
        return { ...current, [question.id]: { picked, correct: picked === question.answer } };
      });
      // A listen-only learner has heard it; now they may read it.
      setRevealed(true);
      if (picked !== question.answer && question.evidence >= 0) {
        setEvidenceIndex(question.evidence);
        // After the text has had a moment to appear (listen-only), bring the sentence to the top of
        // the screen — the question card covers the lower part, so the top is the place it stays seen.
        window.setTimeout(() => {
          document
            .getElementById(`sentence-${question.evidence}`)
            ?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
        }, 160);
      }
    },
    [reducedMotion],
  );

  const handleDockNext = useCallback(() => {
    if (!section) return;
    if (questionIndex < section.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      setEvidenceIndex(null);
      return;
    }
    finishPart();
  }, [finishPart, questionIndex, section, setQuestionIndex]);

  const handleReadAgain = useCallback(() => {
    resetPart();
    setAnswers({});
    setComplete(false);
    setSectionIndex(0);
    setSaveFailed(false);
    window.scrollTo({ top: 0 });
  }, [resetPart]);

  // When the question card has settled, make sure it is not sitting on the text: if the text runs
  // under it, the page scrolls just far enough to lift the text clear (the page keeps room for it).
  const checkingNow = phase === "check" && !complete;

  // Keep the page's bottom room as tall as the card is (it grows with a fourth choice or the
  // translation), so the text can always be scrolled fully clear of it. The observer reports the
  // size as soon as it starts watching and again whenever the card changes.
  useEffect(() => {
    if (!checkingNow) return;
    const dock = document.getElementById("passage-dock");
    if (!dock) return;
    const observer = new ResizeObserver(() => {
      setDockSpace(dock.offsetHeight + (parseFloat(getComputedStyle(dock).marginBottom) || 0));
    });
    observer.observe(dock);
    return () => observer.disconnect();
  }, [checkingNow, questionIndex, sectionIndex]);

  useEffect(() => {
    if (!checkingNow) return;
    const timer = window.setTimeout(() => {
      const text = document.getElementById("passage-text");
      const dock = document.getElementById("passage-dock");
      if (!text || !dock) return;
      // Where the card comes to rest — worked out from its size, not read from its position,
      // because while it is still rising its position is lower than its final one.
      const restingTop =
        window.innerHeight -
        dock.offsetHeight -
        (parseFloat(getComputedStyle(dock).marginBottom) || 0);
      const overlap = text.getBoundingClientRect().bottom - (restingTop - 24);
      if (overlap > 0) {
        window.scrollBy({ top: overlap, behavior: reducedMotion ? "auto" : "smooth" });
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [checkingNow, revealed, sectionIndex, questionIndex, showTranslation, reducedMotion]);

  if (!section) return null;

  const activeQuestion = section.questions[questionIndex];
  const isLastQuestionOfPart = questionIndex >= section.questions.length - 1;
  const isLastPart = sectionIndex >= sectionCount - 1;
  const dockNextLabel = !isLastQuestionOfPart
    ? t.passages.nextQuestion
    : isLastPart
      ? t.passages.finish
      : t.passages.nextPart;

  const partOf = t.passages.partOf
    .replace("{n}", String(sectionIndex + 1))
    .replace("{total}", String(sectionCount));

  const readingThrough = audio.readingThrough && audio.activeIndex !== null;
  const readingActive = readingThrough && !audio.paused;
  const checking = phase === "check" && !complete;

  return (
    <div className="bg-background text-foreground min-h-svh">
      <header className="border-border/60 bg-background/90 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="-ms-2 gap-1.5">
            <Link href="/learn/passages">
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t.passages.backToAll}
            </Link>
          </Button>
          <div className="flex-1" />
          {!complete && (
            <PassageControls
              audioAvailable={audio.hasAudio}
              listenOnly={prefs.listenOnly}
              onToggleListenOnly={prefs.toggleListenOnly}
              rate={prefs.rate}
              onCycleRate={prefs.cycleRate}
              translationAvailable={translationAvailable}
              translation={prefs.translation}
              onToggleTranslation={prefs.toggleTranslation}
            />
          )}
        </div>
        <ProgressSegments
          total={sectionCount}
          current={complete ? sectionCount : sectionIndex}
          currentAnswered={
            !complete && section.questions.every((question) => Boolean(answers[question.id]))
          }
        />
      </header>

      <main
        className={cn(
          "mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10",
          // Room under the text for the question card, so nothing is ever stuck behind it (the
          // measured room takes over from this first guess as soon as the card is on screen).
          checking ? "pb-[26rem]" : "pb-16",
        )}
        style={checking && dockSpace > 0 ? { paddingBottom: dockSpace + 56 } : undefined}
      >
        {complete ? (
          <motion.div
            key="complete"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <PassageCompletion
              passage={passage}
              answers={answers}
              allQuestions={allQuestions}
              meaningsAvailable={translationAvailable}
              signedIn={Boolean(userId)}
              saveFailed={saveFailed}
              nextPassage={nextPassage}
              wordsLink={wordsLink}
              onReadAgain={handleReadAgain}
            />
          </motion.div>
        ) : (
          <motion.div
            key={section.id}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <div className="min-w-0">
                <p
                  className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-[0.14em] uppercase"
                  dir="ltr"
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full"
                    style={{ backgroundImage: `linear-gradient(135deg, ${art.from}, ${art.to})` }}
                  />
                  <span>{passage.title}</span>
                  <span className="opacity-40">·</span>
                  <bdi className="tracking-normal normal-case">{partOf}</bdi>
                </p>
                <h1
                  className="mt-2.5 text-3xl font-semibold tracking-tight sm:text-[2.4rem]"
                  dir="ltr"
                >
                  {section.title}
                </h1>
                {showTranslation && (
                  <p className="text-muted-foreground mt-1 text-lg" dir="rtl" lang="ar">
                    {section.titleAr}
                  </p>
                )}
              </div>

              {audio.hasAudio && !listenOnlyActive && (
                <Button
                  type="button"
                  variant={readingActive ? "secondary" : "default"}
                  size="lg"
                  className="gap-2 rounded-full px-6"
                  onClick={() => {
                    if (readingActive) audio.pause();
                    else if (readingThrough) audio.resume();
                    else audio.playAll();
                  }}
                >
                  {audio.loading && readingActive ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : readingActive ? (
                    <Pause className="size-4" fill="currentColor" aria-hidden="true" />
                  ) : (
                    <Play className="size-4" fill="currentColor" aria-hidden="true" />
                  )}
                  {readingActive ? t.passages.pause : t.passages.listen}
                </Button>
              )}
            </div>

            {!audio.hasAudio && (
              <p className="text-muted-foreground bg-muted/60 mb-6 rounded-xl px-4 py-2.5 text-sm">
                {t.passages.audioMissing}
              </p>
            )}

            {listenOnlyActive ? (
              <PassageListenStage
                sentences={section.sentences}
                audio={audio}
                onShowText={() => setRevealed(true)}
              />
            ) : (
              <motion.div
                key={revealed && prefs.listenOnly ? "revealed" : "text"}
                initial={reducedMotion || !(revealed && prefs.listenOnly) ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <PassageText
                  sentences={section.sentences}
                  speakers={speakers}
                  activeIndex={audio.activeIndex}
                  readingAloud={audio.readingThrough && audio.activeIndex !== null}
                  canPlay={audio.hasAudio}
                  onPlay={audio.playLine}
                  showTranslation={showTranslation}
                  evidenceIndex={evidenceIndex}
                  dimmed={checking}
                />
              </motion.div>
            )}

            {phase === "read" && (
              <div className="mt-10 flex justify-end">
                <Button size="lg" className="gap-2 rounded-full px-7" onClick={handleCheck}>
                  {section.questions.length > 0 ? t.passages.checkYourself : t.passages.nextPart}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {checking && activeQuestion && (
        <PassageQuestionDock
          key={activeQuestion.id}
          question={activeQuestion}
          questionNumber={questionIndex + 1}
          questionTotal={section.questions.length}
          answer={answers[activeQuestion.id]}
          showTranslation={showTranslation}
          nextLabel={dockNextLabel}
          onAnswer={(picked) => handleAnswer(activeQuestion, picked)}
          onNext={handleDockNext}
        />
      )}

      {showTips && <PassageTips onStart={dismissTips} />}
    </div>
  );
}

function ProgressSegments({
  total,
  current,
  currentAnswered,
}: {
  total: number;
  current: number;
  currentAnswered: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-6xl gap-1.5 px-4 pb-2.5 sm:px-6" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-500",
            index < current || (index === current && currentAnswered)
              ? "bg-primary"
              : index === current
                ? "bg-primary/35"
                : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
