"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, PartyPopper } from "lucide-react";

import { LessonSettings } from "@/components/learning/lesson-settings";
import { VocabularyBlockSummary } from "@/components/learning/vocabulary-block-summary";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import type { WordSentenceControls } from "@/components/learning/vocabulary-sentence";
import { VocabularyWordDrill } from "@/components/learning/vocabulary-word-drill";
import { WordGroupCaughtUp } from "@/components/learning/word-group-caught-up";
import { WordHelpBar } from "@/components/learning/word-help-bar";
import { CountUp } from "@/components/words/count-up";
import { MasteryRing } from "@/components/words/mastery-ring";
import { WordPosBadge } from "@/components/words/word-pos-badge";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { useWordAttempts } from "@/hooks/use-word-attempts";
import type { WordAttemptStatus } from "@/hooks/use-word-typing-engine";
import { useWordProgress } from "@/hooks/use-word-progress";
import { masterMistakeWordAction, recordWordListMistakeAction } from "@/lib/mistakes/actions";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { popIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { bandsFromCompleted } from "@/lib/word-mastery/dashboard";
import { splitWordHint } from "@/lib/word-lists-hint";
import { recordWordOutcomeAction } from "@/lib/word-mastery/actions";
import { canTakeHint, outcomeFor, resumePoint } from "@/lib/word-mastery/schedule";
import type { ResumePoint, WordOutcome } from "@/lib/word-mastery/schedule";
import type { SmartPracticeConfig } from "@/lib/word-mastery/smart";
import type { ReportedOutcome } from "@/lib/word-mastery/types";
import { createTypeAheadBuffer } from "@/lib/word-typing";
import type { VocabularyWord, WordGroup } from "@/types/word-lists";

/** Words per practice block — see the queue/block state in VocabularyPractice. Groups no longer all share one fixed word count (20-30, see the word-lists content expansion); this just chunks whatever length a group actually has, with a shorter final block when it doesn't divide evenly. */
const BLOCK_SIZE = 5;

/**
 * The Word Lists practice session — deliberately not a re-skin of
 * LessonSession. The unit of progress here is one word, not one sentence
 * in a longer narrative: audio plays the target word alone (never the
 * full sentence — see PronunciationButton's `text` prop below), the
 * Arabic hint explains the word's meaning rather than translating the
 * sentence, and there's no illustration panel competing for attention —
 * the sentence, the blank, and the hint are the whole screen.
 *
 * With `smart` (the admin-controlled "Smart word practice", see
 * src/lib/word-mastery) the same session also: keeps the letters typed while a
 * word settles, offers hints (the next right letter, mending anything wrong
 * before it) and "I don't know" that cost stars, accepts a word's alternates,
 * shows each word's stars in the block summary, and reports every word's outcome
 * to the learner's spaced schedule instead of wiping a word from the weak list
 * the moment it is typed right. The word is spoken when it appears and its
 * meaning is shown, exactly as without it.
 *
 * With `redesign` (the admin-controlled "Word Lists redesign") the same session
 * is drawn differently and graded identically: the learner types inside the blank
 * of the sentence, a segmented bar shows the batch of five they are on, a badge
 * says what kind of word the blank wants, and finishing shows a progress ring and
 * a counted number instead of a celebration icon.
 *
 * A visit is decided once, when it opens, and then left alone: the words it
 * asks, whether it is the upgraded practice, and whether there is anything to
 * ask at all. It has to be, because the page that renders this is sent again
 * after every answer — each answer is reported with a Server Action that
 * revalidates, and Next answers a revalidating Server Action with a fresh render
 * of the page it was called from. For a Continue visit that render recomputes the
 * word list from the schedule the answer has just changed, so the list shrinks
 * under a running visit. Read live, it moved the screen to another word while
 * the learner was typing (and spoke that word), and never asked the words it
 * jumped over. So the props that describe the visit are copied once here and
 * later ones are ignored; the page starts a different visit (another group, or
 * Practice all) by giving this element a new `key`, never by changing the props
 * of a running one.
 */
export function VocabularyPractice({
  group,
  previewMode = false,
  defaultVoiceId,
  smart,
  caughtUp,
  groupWordIds,
  redesign = false,
  resume = false,
}: {
  group: WordGroup;
  previewMode?: boolean;
  /** Word Lists always uses the global default voice — there's no per-word-group override (word groups have no admin editor to set one from yet; see resolveVoiceId's callers for the lesson-level equivalent). */
  defaultVoiceId?: string | null;
  /** Smart word practice for this visitor, or null/absent for the practice exactly as it always was. */
  smart?: SmartPracticeConfig | null;
  /** Set (with `group.words` empty) when Continue found nothing due: the visit is the short "all caught up" screen, and when the next word falls due. Decided here and not by the page, so a later render of the page cannot swap a running practice for it. */
  caughtUp?: { nextDueISO: string | null } | null;
  /** Every word of the group, when the visit asks only some of them (Continue skips the words scheduled for later): the finish screen reports the whole group's progress, not just the visit's. Defaults to the visit's own words. */
  groupWordIds?: readonly string[];
  /** The redesigned screen (see the component comment). Decided once with the rest of the visit. */
  redesign?: boolean;
  /** Pick up where the learner left off: open at the first block that still has a word they have not finished, instead of the first block. Decided once with the rest of the visit. */
  resume?: boolean;
}) {
  const [visit] = useState(() => ({
    group,
    smart: smart ?? null,
    caughtUp: caughtUp ?? null,
    groupWordIds: groupWordIds ?? group.words.map((word) => word.id),
    redesign,
    resume,
  }));

  if (visit.group.words.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <WordGroupCaughtUp
          groupId={visit.group.id}
          title={visit.group.title}
          nextDueISO={visit.caughtUp?.nextDueISO ?? null}
        />
      </div>
    );
  }

  if (visit.resume) {
    return (
      <ResumedPractice
        group={visit.group}
        previewMode={previewMode}
        defaultVoiceId={defaultVoiceId}
        smart={visit.smart}
        groupWordIds={visit.groupWordIds}
        redesign={visit.redesign}
      />
    );
  }

  return (
    <VocabularyPracticeSession
      group={visit.group}
      previewMode={previewMode}
      defaultVoiceId={defaultVoiceId}
      smart={visit.smart}
      groupWordIds={visit.groupWordIds}
      redesign={visit.redesign}
      resume={null}
    />
  );
}

/**
 * A Continue visit: waits for the learner's saved progress (a guest's lives in
 * the browser, so only the client knows it), then opens at the first unfinished
 * word. The progress is read once, from this one load — a second
 * useWordProgress() would start empty and see nothing finished — and handed to
 * the session as it was when the visit opened, so later answers change the
 * progress without moving a running visit.
 */
function ResumedPractice(props: Omit<ComponentProps<typeof VocabularyPracticeSession>, "resume">) {
  const { isLoaded, completedWordIds } = useWordProgress();
  if (!isLoaded) return <div className="flex-1" aria-busy="true" />;
  return <ResumedSession {...props} completedWordIds={completedWordIds} />;
}

function ResumedSession({
  completedWordIds,
  ...props
}: Omit<ComponentProps<typeof VocabularyPracticeSession>, "resume"> & {
  completedWordIds: readonly string[];
}) {
  const [resume] = useState(() =>
    resumePoint(
      props.group.words.map((word) => word.id),
      new Set(completedWordIds),
      BLOCK_SIZE,
    ),
  );
  return <VocabularyPracticeSession {...props} resume={resume} />;
}

/** The running visit: everything it is made of arrives as props that never change (see VocabularyPractice). */
function VocabularyPracticeSession({
  group,
  previewMode,
  defaultVoiceId,
  smart,
  groupWordIds,
  redesign,
  resume,
}: {
  group: WordGroup;
  previewMode: boolean;
  defaultVoiceId?: string | null;
  smart: SmartPracticeConfig | null;
  groupWordIds: readonly string[];
  redesign: boolean;
  /** Where the visit opens when it picks up where the learner left off, or null for a fresh start. "Practice again" always goes back to the first block. */
  resume: ResumePoint | null;
}) {
  const { t, dir } = useLocale();
  const isSmart = smart != null;
  // Words are practiced in fixed-size blocks (see BLOCK_SIZE), not straight
  // through the whole group: a wrong word doesn't get corrected on the spot
  // (that would just be per-keystroke rejection wearing a different hat) —
  // it's requeued to the back of its own block's queue and re-asked after
  // the rest of the block, repeating for as long as it keeps coming back
  // wrong. `queue` holds indices into the CURRENT block (`blocks[blockIndex]`),
  // never raw word ids, since the same word can legitimately reappear in it
  // more than once.
  const words = group.words;
  const blocks = useMemo(() => {
    const chunks: VocabularyWord[][] = [];
    for (let i = 0; i < words.length; i += BLOCK_SIZE) {
      chunks.push(words.slice(i, i + BLOCK_SIZE));
    }
    return chunks;
  }, [words]);
  const [blockIndex, setBlockIndex] = useState(() => resume?.blockIndex ?? 0);
  const [queue, setQueue] = useState<number[]>(
    () => resume?.open ?? blocks[0]?.map((_, i) => i) ?? [],
  );
  // Distinct slots resolved correctly in the CURRENT block — grows only on a
  // right answer (a retry that finally lands doesn't double-count), purely
  // to drive the "n / blockSize" counter below.
  const [doneInBlock, setDoneInBlock] = useState<Set<number>>(() => new Set(resume?.done));
  // True from the moment the current block's last word is answered correctly
  // until the learner presses Next (or Finish, on the last block) on the
  // summary of the five words they just did — see VocabularyBlockSummary.
  const [showSummary, setShowSummary] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  // A word of the summary being practiced on its own (see VocabularyWordDrill): a
  // side trip that changes nothing about the visit, and ends back on the summary.
  const [drillWord, setDrillWord] = useState<VocabularyWord | null>(null);
  const { isWordCompleted, completedCountIn, markWordComplete } = useWordProgress();
  // A word already awarded progress this session (via markWordComplete)
  // never needs to be awarded it again if a later block somehow reintroduces
  // it — resets alongside everything else on "Practice again".
  const markedWordIdsRef = useRef<Set<string>>(new Set());

  // Smart practice only: what the learner has done with each word this visit
  // (missed, hints taken), how each word of the block ended (for the summary's
  // stars), the state of the word on screen, whether a hint is being drawn, and
  // the keys typed ahead.
  const attempts = useWordAttempts();
  const [blockResults, setBlockResults] = useState<ReadonlyMap<string, WordOutcome>>(
    () => new Map(),
  );
  const [wordStatus, setWordStatus] = useState<WordAttemptStatus>("pending");
  const [hintBusy, setHintBusy] = useState(false);
  const [typeAhead] = useState(() => createTypeAheadBuffer());
  const controlsRef = useRef<WordSentenceControls>(null);

  const currentBlock = blocks[blockIndex] ?? [];
  const currentSlot: number | undefined = queue[0];
  const blockSize = currentBlock.length;

  // Once every slot in the current block has been resolved correctly (the
  // queue drains to empty), show the summary of the block's words. Runs as an
  // effect (not inline in handleWordResult) because a slot can resolve
  // correctly via either branch below and either one needs the same "is the
  // block now done" check afterward. Moving on from the summary is
  // continueFromSummary's job.
  useEffect(() => {
    if (queue.length > 0 || currentBlock.length === 0) return;
    // Letters typed ahead after the block's last word belong to no word.
    typeAhead.clear();
    setShowSummary(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the queue/block actually change
  }, [queue, blockIndex]);

  // Next on the summary: open the next block's words, or — after the last
  // block — hand over to the group-complete screen.
  function continueFromSummary() {
    setShowSummary(false);
    typeAhead.clear();
    setBlockResults(new Map());
    if (blockIndex + 1 < blocks.length) {
      const nextIndex = blockIndex + 1;
      setBlockIndex(nextIndex);
      setQueue(blocks[nextIndex]!.map((_, i) => i));
      setDoneInBlock(new Set());
    } else {
      setIsComplete(true);
    }
  }
  // Owned here, not inside VocabularySentence (which remounts every word) —
  // this is what lets PronunciationButton's own built-in refocus-after-click
  // (see its inputRef prop) find the currently-mounted input no matter which
  // word is showing. Same fix TypingSentence gets for free by owning both
  // the engine and the button itself; here they're one level apart, so the
  // ref is what's shared instead.
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "wordLists");
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });

  // The finish screen speaks for the whole group, not just the words this visit asked.
  const total = groupWordIds.length;
  const word = currentSlot !== undefined ? currentBlock[currentSlot] : undefined;
  const completedCount = completedCountIn(groupWordIds);
  // The word whose pronunciation the header's audio settings play: the one in the drill, else the one being asked.
  const audioWord = drillWord ?? word;
  const hint = word?.supportHint
    ? splitWordHint(word.supportHint)
    : { term: undefined, definition: undefined };
  const attempt = word ? attempts.get(word.id) : { missed: false, hints: 0 };

  // Same fix as LessonSession's identical effect: while the learner types
  // the current word, resolve the NEXT word's pronunciation in the
  // background so its PronunciationButton finds it already cached (see
  // PronunciationSettingsProvider) instead of paying the resolve round
  // trip when it becomes active. "Next" here follows the queue, not a flat
  // index — usually the next slot in this block, but the first word of the
  // next block once the current one is down to its last slot.
  const nextWord = queue.length > 1 ? currentBlock[queue[1]!] : blocks[blockIndex + 1]?.[0];
  const { prefetchPronunciation } = usePronunciationSettings();
  useEffect(() => {
    if (!defaultVoiceId || !nextWord) return;
    prefetchPronunciation({
      contentType: "word",
      contentId: nextWord.id,
      voiceId: defaultVoiceId,
    });
  }, [nextWord, defaultVoiceId, prefetchPronunciation]);

  /** One call per word outcome, to the learner's schedule and weak-word ledger (see recordWordOutcomeAction). Never blocks the learner; a failure is only logged. */
  function reportOutcome(target: VocabularyWord, outcome: ReportedOutcome) {
    recordWordOutcomeAction({ wordId: target.id, word: target.targetWord, outcome }).catch(
      (error: unknown) => {
        console.error("[word-lists] recordWordOutcomeAction failed", error);
      },
    );
  }

  // Grades one attempt at the current word (see VocabularySentence.onResult):
  // right answers retire their slot and count toward this block's progress;
  // wrong ones go back to the end of the SAME block's queue, so the learner
  // finishes the rest of the block first and only then sees this word again
  // — repeating for as long as it keeps coming back wrong (see the
  // block-advance effect above for what happens once the queue drains).
  function handleWordResult(correct: boolean) {
    if (!word || currentSlot === undefined) return;
    if (smart) {
      handleSmartResult(smart, word, correct);
      return;
    }
    if (correct) {
      playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "wordLists"));
      if (!previewMode && !markedWordIdsRef.current.has(word.id)) {
        markedWordIdsRef.current.add(word.id);
        markWordComplete(group.id, word.id);
      }
      if (!previewMode) {
        // Typing a word correctly here should clear it out of "Review All
        // Words" too, not just award word-list progress — this is the same
        // account-wide mistake ledger WordReviewSession corrects into, and a
        // learner who already nailed the word during ordinary practice
        // shouldn't still be asked to review it separately, regardless of
        // whether it was a fresh mistake or a scheduled-but-not-yet-due
        // review (see masterMistakeWord's doc comment for why this needs its
        // own action rather than the queues' own one-step-at-a-time ones).
        masterMistakeWordAction(word.targetWord).catch((error: unknown) => {
          console.error("[word-lists] masterMistakeWordAction failed", error);
        });
      }
      setDoneInBlock((prev) => new Set(prev).add(currentSlot));
      setQueue((prev) => prev.slice(1));
    } else {
      play("error");
      if (!previewMode) {
        // The missing half of the pair above: a wrong attempt here used to
        // only requeue locally and never reach the account-wide mistake
        // ledger at all, so it could never show up in "Review All Words"
        // (see recordWordListMistakeAction's doc comment for why this is
        // its own action rather than reusing recordSentenceMistakesAction).
        recordWordListMistakeAction(word.targetWord).catch((error: unknown) => {
          console.error("[word-lists] recordWordListMistakeAction failed", error);
        });
      }
      setQueue((prev) => [...prev.slice(1), prev[0]!]);
    }
  }

  // The smart counterpart. The difference that matters: a word missed during
  // this visit is NOT wiped from the weak list when it is finally typed right —
  // the miss goes to the schedule the moment it happens (see
  // handleStatusChange), and the final right answer only moves the weak-word
  // ledger on ("recovered"), so the word is re-checked tomorrow instead of being
  // declared learned a minute after it was forgotten. Guests (no account to store
  // a schedule in) skip every server call.
  function handleSmartResult(
    config: SmartPracticeConfig,
    target: VocabularyWord,
    correct: boolean,
  ) {
    const slot = currentSlot!;
    if (correct) {
      const tried = attempts.get(target.id);
      playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "wordLists"));
      const outcome = outcomeFor(tried);
      if (!previewMode) {
        if (!markedWordIdsRef.current.has(target.id)) {
          markedWordIdsRef.current.add(target.id);
          markWordComplete(group.id, target.id);
        }
        if (config.spaced) reportOutcome(target, tried.missed ? "recovered" : outcome);
      }
      setBlockResults((prev) => new Map(prev).set(target.id, outcome));
      setDoneInBlock((prev) => new Set(prev).add(slot));
      setQueue((prev) => prev.slice(1));
    } else {
      // Already recorded as a miss when the wrong answer landed: only the requeue is left.
      setQueue((prev) => [...prev.slice(1), prev[0]!]);
    }
  }

  /**
   * Smart practice hears about every change of the word on screen. A WRONG
   * answer (or "I don't know") is a miss from the moment it lands, not from the
   * end of the answer screen: the stars and the help bar change at once, the
   * error sound plays at once, and the schedule hears about it even if the
   * learner leaves while the right spelling is still up. Only the first miss of
   * a word in a visit is reported (it is one lapse, however many wrong tries).
   */
  function handleStatusChange(status: WordAttemptStatus) {
    setWordStatus(status);
    if (status !== "incorrect" || !smart || !word) return;
    play("error");
    if (attempts.get(word.id).missed) return;
    attempts.update(word.id, { missed: true });
    if (!previewMode && smart.spaced) reportOutcome(word, "missed");
  }

  /**
   * A hint has taken effect (the right letter is going in): it costs a star, and
   * the second one counts as a miss, which the schedule hears about at once, like
   * a wrong answer. The final right answer then only corrects the word.
   */
  function handleHint() {
    if (!word) return;
    const lapsed = attempts.addHint(word.id);
    if (lapsed && !previewMode && smart?.spaced) reportOutcome(word, "missed");
  }

  function handleDrillSolved() {
    playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "wordLists"));
    setDrillWord(null);
  }

  return (
    <div className="h-app flex w-full flex-col">
      {!isComplete && (!showSummary || drillWord) && <ShiftReplayHint />}
      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/learn/word-lists"
            className="text-muted-foreground hover:text-foreground inline-flex min-w-0 items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            <span dir="ltr" className="truncate">
              {group.title}
            </span>
          </Link>
          {!isComplete && audioWord && (
            <div className="flex shrink-0 items-center gap-3">
              {!drillWord && blockSize > 0 && (
                <span className="text-muted-foreground text-sm font-medium" dir="ltr">
                  {doneInBlock.size} / {blockSize}
                </span>
              )}
              <LessonSettings
                // Only the target word is pronounced — never the full
                // sentence. This is the one rule this whole screen is
                // built around; see the component doc comment above.
                text={audioWord.targetWord}
                audioUrl={audioWord.audioUrl}
                autoPlay
                resetKey={drillWord ? `drill:${audioWord.id}` : audioWord.id}
                inputRef={inputRef}
                kokoroVoiceId={defaultVoiceId}
                contentType="word"
                contentId={audioWord.id}
              />
            </div>
          )}
        </div>
        {previewMode && (
          <div className="border-accent/40 bg-accent/10 text-accent-foreground mt-4 rounded-lg border px-4 py-2.5 text-sm font-medium">
            {t.wordLists.previewModeNotice}
          </div>
        )}
        {redesign && !isComplete && !showSummary && !drillWord && blockSize > 0 && (
          <BatchProgress
            batchIndex={blockIndex}
            batchCount={blocks.length}
            done={doneInBlock.size}
            size={blockSize}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            className="flex flex-1 items-center justify-center px-6 py-8 lg:px-16"
          >
            <motion.div
              variants={popIn}
              initial="hidden"
              animate="visible"
              className="border-border bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-12 text-center"
            >
              {redesign ? (
                // A progress ring and a counted number say how far the learner got; no icon of celebration.
                <MasteryRing
                  bands={bandsFromCompleted(total, completedCount)}
                  size={112}
                  stroke={10}
                  label={t.wordLists.redesign.ringAriaNoSchedule
                    .replace("{done}", String(completedCount))
                    .replace("{total}", String(total))}
                >
                  <span className="text-3xl font-bold tabular-nums" dir="ltr">
                    <CountUp value={completedCount} />
                    <span className="text-muted-foreground text-base font-semibold">
                      {" "}
                      / {total}
                    </span>
                  </span>
                </MasteryRing>
              ) : (
                <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
                  <PartyPopper className="size-7" aria-hidden="true" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {redesign ? t.wordLists.redesign.completeHeading : t.wordLists.complete}
                </h2>
                <p className="text-muted-foreground mt-1" dir="ltr">
                  {group.title}
                </p>
              </div>
              <div className={cn("w-full max-w-xs text-left", redesign && "hidden")}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {t.wordLists.progressLabel}
                  </span>
                  <span className="text-muted-foreground" dir="ltr">
                    {completedCount} / {total} {t.wordLists.wordsUnit}
                  </span>
                </div>
                <Progress value={(completedCount / total) * 100} />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" asChild>
                  <Link href="/learn/word-lists">{t.wordLists.backToWordLists}</Link>
                </Button>
                {redesign && (
                  // The topic's wall is where the new strengths, the mastery ring and the rank are.
                  <Button variant="outline" asChild>
                    <Link href={`/learn/word-lists/${group.id}/words`}>
                      {t.wordLists.redesign.viewWall}
                    </Link>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setBlockIndex(0);
                    setQueue(blocks[0]?.map((_, i) => i) ?? []);
                    setDoneInBlock(new Set());
                    markedWordIdsRef.current = new Set();
                    attempts.reset();
                    setBlockResults(new Map());
                    typeAhead.clear();
                    setShowSummary(false);
                    setIsComplete(false);
                  }}
                >
                  {t.wordLists.practiceAgain}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : drillWord ? (
          <motion.div key={`drill-${drillWord.id}`} initial={false} className="flex flex-1">
            <VocabularyWordDrill
              word={drillWord}
              inputRef={inputRef}
              fontFamily={sectionFontFamily}
              onSolved={handleDrillSolved}
              onWrong={() => play("error")}
              onBack={() => setDrillWord(null)}
            />
          </motion.div>
        ) : showSummary ? (
          <VocabularyBlockSummary
            key={`summary-${blockIndex}`}
            words={currentBlock}
            blockNumber={blockIndex + 1}
            blockCount={blocks.length}
            firstWordNumber={blockIndex * BLOCK_SIZE + 1}
            totalWords={total}
            onContinue={continueFromSummary}
            defaultVoiceId={defaultVoiceId}
            results={isSmart ? blockResults : undefined}
            onPracticeWord={setDrillWord}
          />
        ) : (
          word && (
            <motion.div
              key={word.id}
              initial={false}
              className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 lg:px-16 [html[data-keyboard]_&]:gap-3 [html[data-keyboard]_&]:py-3"
            >
              {/* The support-language TERM leads, large and clear — it's the
                  answer to "what does this word mean," the first thing a
                  learner needs before they can recall it. The definition
                  (when splitWordHint finds one) sits underneath at roughly
                  half that size: real supporting context, not competing for
                  the same attention. Never falls back to word.hintAr for
                  Spanish (same rule as typing-sentence.tsx's supportText) —
                  and unlike sentence translations, there's no neutral
                  English hint field to fall back to either (see
                  types/word-lists.ts's hintAr doc comment), so a genuinely
                  missing translation renders nothing here rather than a
                  semantically wrong stand-in. */}
              {hint.term && (
                <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
                  {redesign && <WordPosBadge pos={word.pos} />}
                  <p
                    className="text-foreground/85 text-[1.8rem] font-bold text-balance sm:text-[2.16rem]"
                    dir={dir}
                  >
                    {hint.term}
                  </p>
                  {hint.definition && (
                    <p className="text-muted-foreground text-[1.2rem] font-medium" dir={dir}>
                      {hint.definition}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-border compact-hide h-10 w-px" aria-hidden="true" />

              <div className="flex w-full max-w-2xl flex-col items-center gap-3">
                <VocabularySentence
                  sentence={word.sentence}
                  targetWord={word.targetWord}
                  onResult={handleWordResult}
                  inputRef={inputRef}
                  fontFamily={sectionFontFamily}
                  enlarged
                  inline={redesign}
                  smart={
                    isSmart
                      ? {
                          alternates: word.alternates,
                          typeAhead,
                          controlsRef,
                          onStatusChange: handleStatusChange,
                          onHint: handleHint,
                          onHintBusyChange: setHintBusy,
                        }
                      : undefined
                  }
                />
                {isSmart && (
                  <WordHelpBar
                    attempt={attempt}
                    settled={wordStatus !== "pending"}
                    busy={hintBusy}
                    onHint={() =>
                      // Closed once the last star has gone on a hint.
                      word && canTakeHint(attempts.get(word.id))
                        ? (controlsRef.current?.hint() ?? false)
                        : false
                    }
                    onGiveUp={() => controlsRef.current?.giveUp()}
                  />
                )}
              </div>

              {isWordCompleted(word.id) && (
                <span className="text-success text-xs font-medium">
                  {t.wordLists.completedBefore}
                </span>
              )}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * The redesigned practice's batch progress: one segment per batch of five words
 * (finished batches full, the current one filling as its words are answered,
 * later ones empty), with "Batch 2 of 5" and the word count of the current batch.
 */
function BatchProgress({
  batchIndex,
  batchCount,
  done,
  size,
}: {
  batchIndex: number;
  batchCount: number;
  done: number;
  size: number;
}) {
  const { t, dir } = useLocale();
  const copy = t.wordLists.redesign;
  return (
    <div className="mt-3" dir={dir}>
      <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-semibold">
        <span>
          {copy.batchProgress
            .replace("{current}", String(batchIndex + 1))
            .replace("{total}", String(batchCount))}
        </span>
        <span className="tabular-nums" dir="ltr">
          {done} / {size}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={size}
        aria-valuenow={done}
        aria-label={copy.batchProgressAria
          .replace("{current}", String(batchIndex + 1))
          .replace("{total}", String(batchCount))
          .replace("{done}", String(done))
          .replace("{size}", String(size))}
        className="flex gap-1"
        dir="ltr"
      >
        {Array.from({ length: batchCount }, (_, index) => {
          const fill = index < batchIndex ? 100 : index === batchIndex ? (done / size) * 100 : 0;
          return (
            <span
              key={index}
              className="bg-muted-foreground/20 h-1.5 flex-1 overflow-hidden rounded-full"
            >
              <span
                className="bg-primary block h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${fill}%` }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
