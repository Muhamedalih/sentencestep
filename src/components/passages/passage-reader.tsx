"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Languages, Loader2, Pause, Play, X } from "lucide-react";

import { PassageIcon } from "@/components/passages/passage-icons";
import { PassageWordsPanel } from "@/components/passages/passage-words-panel";
import { PASSAGE_TONE_STYLES } from "@/components/passages/passage-tone";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { usePassageAudio } from "@/hooks/use-passage-audio";
import { savePassageProgressAction } from "@/lib/passages/actions";
import { scorePercent } from "@/lib/passages/progress";
import type { Passage, PassageQuestion, PassageSection } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * The passage reader: one part at a time, each part a handful of lines the
 * learner can listen to (the line being spoken lights up, any line can be
 * tapped to hear it again), one quick question with an answer that is always in
 * the text, and at the end the passage's words. Nothing is typed here — this is
 * the comprehension counterpart to the typing lessons.
 *
 * The whole passage is loaded once by the page, so moving between parts costs
 * no request; the only traffic is a small progress save after each part.
 */

const TIPS_SEEN_KEY = "ss.passages.tipsSeen.v1";
const TRANSLATION_KEY = "ss.passages.translation.v1";

interface Answer {
  picked: number;
  correct: boolean;
}

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

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    if (value) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // Private windows and blocked storage: the preference just does not stick.
  }
}

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
  const tone = PASSAGE_TONE_STYLES[passage.tone];

  const sectionCount = passage.sections.length;
  const [sectionIndex, setSectionIndex] = useState(
    Math.min(Math.max(initialSectionIndex, 0), Math.max(sectionCount - 1, 0)),
  );
  const [complete, setComplete] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const section = passage.sections[sectionIndex] as PassageSection | undefined;

  // Preferences live in the browser only; read them after mount so the server
  // and first client render agree.
  useEffect(() => {
    if (translationAvailable) setShowTranslation(readFlag(TRANSLATION_KEY));
    // The "before you begin" card is shown once, on the very first passage, not on every one.
    if (!readFlag(TIPS_SEEN_KEY)) setShowTips(true);
  }, [translationAvailable]);

  const toggleTranslation = useCallback(() => {
    setShowTranslation((current) => {
      writeFlag(TRANSLATION_KEY, !current);
      return !current;
    });
  }, []);

  const dismissTips = useCallback(() => {
    writeFlag(TIPS_SEEN_KEY, true);
    setShowTips(false);
  }, []);

  const audio = usePassageAudio(section?.sentences ?? []);
  const { stop: stopAudio } = audio;

  // A new part is a new silence: the previous part's clips must not carry on.
  useEffect(() => {
    stopAudio();
  }, [sectionIndex, complete, stopAudio]);

  const allQuestions = useMemo(
    () => passage.sections.flatMap((candidate) => candidate.questions),
    [passage.sections],
  );
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;

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

  const handleAnswer = useCallback((question: PassageQuestion, picked: number) => {
    setAnswers((current) => {
      // One try per question: the first pick is the answer, so the score means something.
      if (current[question.id]) return current;
      return { ...current, [question.id]: { picked, correct: picked === question.answer } };
    });
  }, []);

  const handleNext = useCallback(() => {
    const isLast = sectionIndex >= sectionCount - 1;
    void saveProgress(sectionIndex + 1, isLast);
    if (isLast) setComplete(true);
    else setSectionIndex((current) => current + 1);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion, saveProgress, sectionCount, sectionIndex]);

  const handleReadAgain = useCallback(() => {
    setAnswers({});
    setComplete(false);
    setSectionIndex(0);
    setSaveFailed(false);
    window.scrollTo({ top: 0 });
  }, []);

  if (!section) return null;

  const partOf = t.passages.partOf
    .replace("{n}", String(sectionIndex + 1))
    .replace("{total}", String(sectionCount));

  return (
    <div className="bg-background text-foreground min-h-svh">
      <header className="border-border/60 bg-background/90 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <Button asChild variant="ghost" size="sm" className="-ms-2 gap-1.5">
            <Link href="/learn/passages">
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t.passages.backToAll}
            </Link>
          </Button>
          <div className="flex-1" />
          {translationAvailable && (
            <button
              type="button"
              onClick={toggleTranslation}
              aria-pressed={showTranslation}
              className={cn(
                "focus-visible:ring-ring flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 pointer-coarse:h-11",
                showTranslation
                  ? "border-primary/40 bg-brand-muted text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Languages className="size-4" aria-hidden="true" />
              {t.passages.translation}
            </button>
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

      <main className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:pt-10">
        <div className="mb-8 flex items-center gap-4">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl",
              tone.tile,
            )}
          >
            <PassageIcon name={passage.icon} className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg leading-tight font-semibold sm:text-xl" dir="ltr">
              {passage.title}
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              <span dir="ltr">{passage.level}</span>
              <span className="mx-1.5 opacity-50">·</span>
              <bdi>{t.passages.tones[passage.tone]}</bdi>
              {!complete && (
                <>
                  <span className="mx-1.5 opacity-50">·</span>
                  <bdi>{partOf}</bdi>
                </>
              )}
            </p>
          </div>
        </div>

        {complete ? (
          <motion.div
            key="complete"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <CompletionView
              passage={passage}
              answers={answers}
              allQuestions={allQuestions}
              showTranslation={showTranslation && translationAvailable}
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
            <SectionView
              section={section}
              speakerClass={tone.speaker}
              audio={audio}
              answers={answers}
              showTranslation={showTranslation && translationAvailable}
              isLast={sectionIndex >= sectionCount - 1}
              onAnswer={handleAnswer}
              onNext={handleNext}
            />
          </motion.div>
        )}
      </main>

      {showTips && <TipsOverlay onStart={dismissTips} />}
    </div>
  );
}

// --- Progress ---------------------------------------------------------------

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
    <div className="mx-auto flex max-w-3xl gap-1.5 px-4 pb-2.5" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-300",
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

// --- One part ---------------------------------------------------------------

function SectionView({
  section,
  speakerClass,
  audio,
  answers,
  showTranslation,
  isLast,
  onAnswer,
  onNext,
}: {
  section: PassageSection;
  /** The colour a character's name takes — the passage's own mood colour. */
  speakerClass: string;
  audio: ReturnType<typeof usePassageAudio>;
  answers: Record<string, Answer>;
  showTranslation: boolean;
  isLast: boolean;
  onAnswer: (question: PassageQuestion, picked: number) => void;
  onNext: () => void;
}) {
  const { t } = useLocale();
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState<number | null>(null);

  // While a part is being read through, keep the speaking line in view.
  useEffect(() => {
    if (audio.activeIndex === null || !audio.readingThrough) return;
    lineRefs.current[audio.activeIndex]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [audio.activeIndex, audio.readingThrough]);

  const allAnswered = section.questions.every((question) => Boolean(answers[question.id]));
  // "Reading through" stays true across the short gap between two lines; only a press on pause ends it.
  const readingThrough = audio.readingThrough && audio.activeIndex !== null;
  const readingActive = readingThrough && !audio.paused;

  const handleAnswer = (question: PassageQuestion, picked: number) => {
    onAnswer(question, picked);
    if (picked !== question.answer && question.evidence >= 0) {
      setEvidenceIndex(question.evidence);
      lineRefs.current[question.evidence]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase"
            dir="ltr"
          >
            {section.title}
          </h2>
          {showTranslation && (
            <p className="text-muted-foreground/80 mt-0.5 text-sm" dir="rtl">
              {section.titleAr}
            </p>
          )}
        </div>
        {audio.hasAudio && (
          <Button
            type="button"
            variant={readingActive ? "secondary" : "default"}
            size="sm"
            className="gap-2 rounded-full pointer-coarse:h-11"
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
        <p className="text-muted-foreground bg-muted/60 mb-4 rounded-lg px-3 py-2 text-sm">
          {t.passages.audioMissing}
        </p>
      )}

      <ul className="flex flex-col gap-1.5">
        {section.sentences.map((sentence, index) => {
          const isActive = audio.activeIndex === index;
          const isEvidence = evidenceIndex === index;
          const canPlay = audio.hasAudio && Boolean(sentence.audioUrl);
          return (
            <li key={sentence.id}>
              <button
                ref={(node) => {
                  lineRefs.current[index] = node;
                }}
                type="button"
                disabled={!canPlay}
                onClick={() => audio.playLine(index)}
                aria-label={canPlay ? `${t.passages.replayLine}: ${sentence.en}` : undefined}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group w-full rounded-xl border-s-[3px] px-4 py-3 text-start transition-colors duration-200 outline-none",
                  "focus-visible:ring-ring focus-visible:ring-2",
                  canPlay ? "cursor-pointer" : "cursor-default",
                  isActive
                    ? "border-primary bg-brand-muted/70"
                    : isEvidence
                      ? "border-success bg-success/10"
                      : "enabled:hover:bg-muted/60 border-transparent",
                )}
              >
                {sentence.speaker && (
                  <span
                    className={cn("mb-0.5 block text-xs font-semibold tracking-wide", speakerClass)}
                    dir="ltr"
                  >
                    {sentence.speaker}
                  </span>
                )}
                <span
                  className="block text-xl leading-relaxed font-medium sm:text-[1.65rem] sm:leading-[1.55]"
                  dir="ltr"
                  lang="en"
                >
                  {sentence.en}
                </span>
                {showTranslation && (
                  <span
                    className="text-muted-foreground mt-1 block text-base leading-relaxed sm:text-lg"
                    dir="rtl"
                    lang="ar"
                  >
                    {sentence.ar}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {section.questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          answer={answers[question.id]}
          showTranslation={showTranslation}
          onAnswer={(picked) => handleAnswer(question, picked)}
        />
      ))}

      <div className="mt-8 flex justify-end">
        <Button
          type="button"
          size="lg"
          disabled={!allAnswered}
          onClick={onNext}
          className="gap-2 rounded-full"
        >
          {isLast ? t.passages.finish : t.passages.nextPart}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// --- The quick check --------------------------------------------------------

function QuestionCard({
  question,
  answer,
  showTranslation,
  onAnswer,
}: {
  question: PassageQuestion;
  answer: Answer | undefined;
  showTranslation: boolean;
  onAnswer: (picked: number) => void;
}) {
  const { t } = useLocale();
  const answered = Boolean(answer);

  return (
    <section
      className="border-border bg-card mt-8 rounded-2xl border p-5 shadow-sm sm:p-6"
      aria-label={t.passages.quickCheck}
    >
      <span className="bg-foreground text-background inline-block rounded-md px-2 py-1 text-[0.68rem] font-bold tracking-[0.12em] uppercase">
        {t.passages.quickCheck}
      </span>
      <h3 className="mt-3 text-lg leading-snug font-semibold sm:text-xl" dir="ltr" lang="en">
        {question.prompt}
      </h3>
      {showTranslation && (
        <p className="text-muted-foreground mt-1 text-base" dir="rtl" lang="ar">
          {question.promptAr}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2.5" role="group">
        {question.options.map((option, index) => {
          const isPicked = answer?.picked === index;
          const isRight = index === question.answer;
          const showRight = answered && isRight;
          const showWrong = answered && isPicked && !isRight;
          return (
            <button
              key={index}
              type="button"
              disabled={answered}
              onClick={() => onAnswer(index)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start text-base transition-colors outline-none sm:text-lg",
                "focus-visible:ring-ring focus-visible:ring-2",
                !answered && "border-border hover:bg-muted hover:border-primary/40",
                showRight && "border-success bg-success/10 text-foreground",
                showWrong && "border-danger bg-danger/10 text-foreground",
                answered &&
                  !showRight &&
                  !showWrong &&
                  "border-border text-muted-foreground opacity-70",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block" dir="ltr" lang="en">
                  {option.en}
                </span>
                {showTranslation && (
                  <span className="text-muted-foreground mt-0.5 block text-sm" dir="rtl" lang="ar">
                    {option.ar}
                  </span>
                )}
              </span>
              {showRight && <Check className="text-success size-5 shrink-0" aria-hidden="true" />}
              {showWrong && <X className="text-danger size-5 shrink-0" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <p
          className={cn(
            "mt-4 text-sm font-medium",
            answer?.correct ? "text-success" : "text-muted-foreground",
          )}
          role="status"
        >
          {answer?.correct ? t.passages.correct : t.passages.notQuite}
        </p>
      )}
    </section>
  );
}

// --- The end ----------------------------------------------------------------

function CompletionView({
  passage,
  answers,
  allQuestions,
  showTranslation,
  meaningsAvailable,
  signedIn,
  saveFailed,
  nextPassage,
  wordsLink,
  onReadAgain,
}: {
  passage: Passage;
  answers: Record<string, Answer>;
  allQuestions: PassageQuestion[];
  showTranslation: boolean;
  meaningsAvailable: boolean;
  signedIn: boolean;
  saveFailed: boolean;
  nextPassage: { id: string; title: string } | null;
  wordsLink: { href: string; adminPreview: boolean } | null;
  onReadAgain: () => void;
}) {
  const { t } = useLocale();
  const total = allQuestions.length;
  const correct = allQuestions.filter((question) => answers[question.id]?.correct).length;
  const percent = scorePercent(correct, total);

  return (
    <div>
      <div className="border-border bg-card rounded-2xl border p-6 text-center shadow-sm sm:p-8">
        <div className="bg-success/15 text-success mx-auto flex size-14 items-center justify-center rounded-full">
          <Check className="size-7" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">{t.passages.completeHeading}</h2>
        <p className="text-muted-foreground mt-1.5">
          {t.passages.score.replace("{correct}", String(correct)).replace("{total}", String(total))}
        </p>
        <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
          {allQuestions.map((question) => (
            <span
              key={question.id}
              className={cn(
                "size-2.5 rounded-full",
                answers[question.id]?.correct ? "bg-success" : "bg-danger/70",
              )}
            />
          ))}
        </div>
        <span className="sr-only">{percent}%</span>

        {!signedIn && (
          <p className="text-muted-foreground mt-5 text-sm">
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t.passages.signInToSave}
            </Link>
          </p>
        )}
        {saveFailed && <p className="text-danger mt-5 text-sm">{t.passages.savingFailed}</p>}
      </div>

      {passage.words.length > 0 && (
        <PassageWordsPanel
          words={passage.words}
          showTranslation={showTranslation}
          meaningsAvailable={meaningsAvailable}
          wordsLink={wordsLink}
        />
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {nextPassage && (
          <Button asChild size="lg" className="gap-2 rounded-full">
            <Link href={`/learn/passages/${nextPassage.id}`}>
              {t.passages.nextPassage}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-full"
          onClick={onReadAgain}
        >
          {t.passages.readAgain}
        </Button>
        <Button asChild variant="ghost" size="lg" className="rounded-full">
          <Link href="/learn/passages">{t.passages.backToAll}</Link>
        </Button>
      </div>
    </div>
  );
}

// --- Before you begin -------------------------------------------------------

function TipsOverlay({ onStart }: { onStart: () => void }) {
  const { t } = useLocale();
  const tips = [
    { title: t.passages.tipListenTitle, body: t.passages.tipListenBody },
    { title: t.passages.tipTapTitle, body: t.passages.tipTapBody },
    { title: t.passages.tipLookBackTitle, body: t.passages.tipLookBackBody },
  ];

  return (
    <div
      className="bg-background/85 fixed inset-0 z-40 flex items-center justify-center px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t.passages.tipsHeading}
    >
      <div className="border-border bg-card w-full max-w-md rounded-2xl border p-6 shadow-lg sm:p-7">
        <h2 className="text-xl font-semibold tracking-tight">{t.passages.tipsHeading}</h2>
        <ol className="mt-5 flex flex-col gap-4">
          {tips.map((tip, index) => (
            <li key={tip.title} className="flex gap-3.5">
              <span className="bg-brand-muted text-primary flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
                {index + 1}
              </span>
              <div>
                <p className="font-medium">{tip.title}</p>
                <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{tip.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full rounded-full"
          onClick={onStart}
          autoFocus
        >
          {t.passages.tipsStart}
        </Button>
      </div>
    </div>
  );
}
