"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Play, Trophy } from "lucide-react";

import { PassageBackdrop } from "@/components/passages/passage-backdrop";
import { PassageButton, PassageLinkButton } from "@/components/passages/passage-button";
import { PassageCompletion } from "@/components/passages/passage-completion";
import { PassageControls } from "@/components/passages/passage-controls";
import { PassageListenStage } from "@/components/passages/passage-listen-stage";
import { PassageQuestionDock } from "@/components/passages/passage-question-dock";
import type { PassageAnswer } from "@/components/passages/passage-question-dock";
import { PassageRatingPrompt } from "@/components/passages/passage-rating-prompt";
import { PassageText } from "@/components/passages/passage-text";
import { PassageTips } from "@/components/passages/passage-tips";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { usePassageAudio } from "@/hooks/use-passage-audio";
import { usePassageChime } from "@/hooks/use-passage-chime";
import {
  readTipsSeen,
  usePassagePreferences,
  writeTipsSeen,
} from "@/hooks/use-passage-preferences";
import { questTitle } from "@/lib/features/quest-labels";
import { savePassageProgressAction } from "@/lib/passages/actions";
import { posterArtFor } from "@/lib/passages/art";
import type { PassageRewards } from "@/lib/passages/engagement";
import type { PauseMark } from "@/lib/passages/narration-pauses";
import { todayLocalISODate } from "@/lib/progress/streak";
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
  /** Today's session ("Today's session (new Home)"): where the end screen's one big button goes — on to the story — instead of the next passage. */
  todayNext?: { href: string } | null;
  /** Where "Practice these words" goes, and whether it is the real Word Lists page or the admin-only preview of a lesson that is not published yet. Null when the passage has no word lesson. */
  wordsLink: { href: string; adminPreview: boolean } | null;
  /** Where the narrator will pause, by sentence id — passed only to an admin, who sees it as small dots in the text; a learner is never given it. */
  pauseMarks?: Record<string, PauseMark>;
}

type Phase = "read" | "check";

export function PassageReader({
  passage,
  initialSectionIndex,
  translationAvailable,
  nextPassage,
  todayNext,
  wordsLink,
  pauseMarks,
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
  /** The questions already answered this visit (read at once, unlike `answers`, which a second key could beat) — so a right answer chimes once. */
  const answeredRef = useRef<Set<string>>(new Set());
  const { playCorrect } = usePassageChime();
  const [evidenceIndex, setEvidenceIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  /** What finished parts have earned in the quests and badges so far this visit — shown on the end screen, and as a short notice the moment it happens. */
  const [rewards, setRewards] = useState<PassageRewards>({ quests: [], badges: [] });
  const [notice, setNotice] = useState<string | null>(null);
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

  const lineForReward = useCallback(
    (reward: PassageRewards): string[] => [
      ...reward.quests.map((quest) =>
        t.quests.rewardCompleted
          .replace("{quest}", questTitle(t, quest.type))
          .replace("{xp}", String(quest.xp)),
      ),
      ...reward.badges.map((id) =>
        t.badges.rewardEarned.replace("{badge}", t.badges.items[id].name),
      ),
    ],
    [t],
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
        // The learner's own date: the streak and the daily quest are keyed on it.
        todayISO: todayLocalISODate(),
      };
      // One quiet retry: a dropped request must not leave a finished part unsaved.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await savePassageProgressAction(payload);
          if (result.ok || result.reason === "signed-out" || result.reason === "unavailable") {
            if (completed) setSaveFailed(false);
            if (result.rewards) {
              const earned = result.rewards;
              setRewards((current) => ({
                quests: [...current.quests, ...earned.quests],
                badges: [...current.badges, ...earned.badges],
              }));
              setNotice(lineForReward(earned).join("  ·  "));
            }
            return;
          }
        } catch {
          // fall through to the retry
        }
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      if (completed) setSaveFailed(true);
    },
    [answeredCount, correctCount, lineForReward, passage.id, userId],
  );

  // A reward notice is a moment, not a fixture: it goes away by itself.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

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
      // The first pick of a question is its answer; a right one is rewarded with the chime — once, even if a second key lands before the card has settled.
      const firstPick = !answeredRef.current.has(question.id);
      answeredRef.current.add(question.id);
      if (firstPick && picked === question.answer) playCorrect();

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
    [playCorrect, reducedMotion],
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
    answeredRef.current.clear();
    setAnswers({});
    setComplete(false);
    setSectionIndex(0);
    setSaveFailed(false);
    setRewards({ quests: [], badges: [] });
    setNotice(null);
    window.scrollTo({ top: 0 });
  }, [resetPart]);

  // Switching between "with the text" and "listen only" while a part is being read: the new mode
  // shows at once, and a reading that was under way starts again from the top in it (stopped and
  // back to zero, then going on). From the text the stage appears; from the stage the text does.
  const { setListenOnly: setListenOnlyPreference } = prefs;
  const { playAll } = audio;
  const handleSetListenOnly = useCallback(
    (next: boolean) => {
      const wasReading = audio.readingThrough && audio.activeIndex !== null && !audio.paused;
      stopAudio();
      // A part whose text was shown ("Show the text") goes back behind the stage when listen-only is asked for.
      if (next && phase === "read") setRevealed(false);
      setListenOnlyPreference(next);
      if (wasReading) playAll();
    },
    [
      audio.activeIndex,
      audio.paused,
      audio.readingThrough,
      phase,
      playAll,
      setListenOnlyPreference,
      stopAudio,
    ],
  );

  // Shift replays the audio — the same shortcut as in Word Lists and the typing lessons (the
  // provider answers a lone Shift press with whatever is registered): here the part is read again
  // from its first sentence. Only while the text or the stage is on screen, not under a question.
  const { registerReplay } = usePronunciationSettings();
  const shiftReplayEnabled = phase === "read" && !complete && audio.hasAudio;
  useEffect(() => {
    if (!shiftReplayEnabled) return;
    return registerReplay(playAll);
  }, [playAll, registerReplay, shiftReplayEnabled]);

  // Enter does what the Check button does — the same shortcut the other check-then-continue screens
  // have (a focused button or sentence keeps its own Enter, and the tips card is not in the way).
  useEnterToContinue(phase === "read" && !complete && !showTips, handleCheck);

  // When the question card appears, make sure it is not sitting on the text: if the text runs
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
    // The card is in the page from this commit on. One frame later it has been laid out, so the text
    // is lifted at once and the two move together (instead of the text jumping after the card).
    const frame = requestAnimationFrame(() => {
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
    });
    return () => cancelAnimationFrame(frame);
    // dockSpace is a dependency on purpose: the card's size arrives a frame after it appears (and
    // changes with the translation), and the page only has room to scroll once that is known.
  }, [
    checkingNow,
    dockSpace,
    revealed,
    sectionIndex,
    questionIndex,
    showTranslation,
    reducedMotion,
  ]);

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
  // The question is open and not yet answered: the text is blurred, so the answer comes from memory.
  // (Listen-only already has no text on screen, so there is nothing to blur there.)
  const recalling = checking && Boolean(activeQuestion) && !answers[activeQuestion?.id ?? ""];

  return (
    <div className="bg-background text-foreground relative isolate min-h-svh">
      <PassageBackdrop src={passage.backgroundUrl} />
      <header className="border-border/60 bg-background/90 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:px-6">
          <PassageLinkButton href="/learn/passages" variant="quiet" size="sm" className="-ms-1">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t.passages.backToAll}
          </PassageLinkButton>
          <div className="flex-1" />
          {!complete && (
            <PassageControls
              audioAvailable={audio.hasAudio}
              // What the part looks like, not what is stored: after "Show the text" the switch reads off.
              listenOnly={listenOnlyActive}
              listenOnlyLocked={checking}
              onToggleListenOnly={() => handleSetListenOnly(!listenOnlyActive)}
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
              rewardLines={lineForReward(rewards)}
              nextPassage={nextPassage}
              todayNext={todayNext ?? null}
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
                <PassageButton
                  variant={readingActive ? "quiet" : "primary"}
                  size="lg"
                  className="min-w-40"
                  onClick={() => {
                    if (readingActive) audio.pause();
                    else if (readingThrough) audio.resume();
                    else audio.playAll();
                  }}
                >
                  {audio.loading && readingActive ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : readingActive ? (
                    // Three bars that dance while the voice is speaking.
                    <span className="flex h-4 items-center gap-[0.18rem]" aria-hidden="true">
                      <i className="passage-eq-bar" />
                      <i className="passage-eq-bar" />
                      <i className="passage-eq-bar" />
                    </span>
                  ) : (
                    <Play className="size-4" fill="currentColor" aria-hidden="true" />
                  )}
                  {readingActive ? t.passages.pause : t.passages.listen}
                </PassageButton>
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
                  speaking={audio.playing && !audio.loading}
                  getProgress={audio.getProgress}
                  canPlay={audio.hasAudio}
                  onPlay={audio.playLine}
                  showTranslation={showTranslation}
                  evidenceIndex={evidenceIndex}
                  blurred={recalling}
                  pauseMarks={pauseMarks}
                />
              </motion.div>
            )}

            {phase === "read" && (
              <div className="mt-12 flex justify-center">
                <PassageButton
                  size="lg"
                  keyHint="↵"
                  trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                  className="min-w-56"
                  onClick={handleCheck}
                >
                  {section.questions.length > 0 ? t.passages.checkYourself : t.passages.nextPart}
                </PassageButton>
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

      {/* A quest or badge the part just earned. On the end screen the same lines are in the result card. */}
      {notice && !complete && (
        <motion.div
          role="status"
          initial={reducedMotion ? false : { opacity: 0, y: -14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4"
        >
          <p className="border-border bg-card flex max-w-xl items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-lg">
            <Trophy className="text-primary size-4 shrink-0" aria-hidden="true" />
            <bdi>{notice}</bdi>
          </p>
        </motion.div>
      )}

      {/* "Shift — to replay the audio", on a laptop or a tablet (a phone has no Shift key). */}
      {shiftReplayEnabled && <ShiftReplayHint showOnTablet />}

      {showTips && <PassageTips onStart={dismissTips} />}

      {/* The first time a learner finishes a passage: a one-time "what do you think of Passages?" card. */}
      <PassageRatingPrompt show={complete} passageId={passage.id} />
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
