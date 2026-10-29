"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { Check, Volume2 } from "lucide-react";

import { LessonSettings } from "@/components/learning/lesson-settings";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { Form, RulePageOne, RulePageTwo } from "@/components/today/rule-pages";
import { buttonVariants } from "@/components/ui/button";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { recordDailyRuleAction } from "@/lib/daily-rule/actions";
import type { RuleSpec } from "@/lib/daily-rule/ladder";
import { ladderForLevel, LEVEL_NUMBER, ruleById } from "@/lib/daily-rule/levels";
import { glueEndings } from "@/lib/daily-rule/marks";
import type { RuleOutcome } from "@/lib/daily-rule/schedule";
import { fill, ruleStrings, type RuleStrings } from "@/lib/daily-rule/strings";
import type { RuleTeach } from "@/lib/daily-rule/teach-types";
import { itemOutcome, ruleOutcome, type ItemResult } from "@/lib/daily-rule/outcome";
import { diagnoseAny, type Diagnosis } from "@/lib/daily-rule/tokens";
import { unitTitle } from "@/lib/daily-rule/units";
import type { ItemSpec, LearnTask, RecallTask, RuleVisit } from "@/lib/daily-rule/visit";
import type { SupportLocale } from "@/lib/i18n/locales";
import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { cn } from "@/lib/utils";

/**
 * The rule of the day, as a short sequence of cards on a bare screen: no frames, the card in the middle
 * of what is left under the progress bars. A question on an earlier rule (if one is due), the new rule
 * taught from the story just read in two pages (the idea in simple English and in the learner's own
 * language with the sentences of their story; then what to watch for: the exceptions and the details),
 * three sentences to type, and a last card that says where the rule now stands.
 *
 * Every sound is a stored recording of the sentence, never the browser's voice. A sentence to type is
 * read once as it appears; Shift (or the replay control, on a phone) reads it again; the "listen" link
 * under the field says only the missing word. A prepared sentence (one written for the rule, used when the
 * learner's story does not show it) has a recording only once one is stored: until then its card has no
 * sound, and none of the sound controls. The grammar letters of the rule (the -ing of reading, the
 * is of she is) are shown in colour wherever the rule's forms appear. Each card's outcome is recorded
 * once it is final; leaving early records only what was finished.
 *
 * The same runner carries the practice of one rule from the rule library (`practice`): the three typed
 * sentences and a last card with the score, and nothing recorded, since the learner chose to practise
 * and the schedule is the day's.
 */

export interface DailyRuleRunnerProps {
  visit: RuleVisit;
  todayISO: string;
  locale: SupportLocale | null;
  /** Where the card carries on to: the words step of Today, or the next step when the card came first. */
  continueHref: string;
  /** What the new rule teaches (teach.ts), read on the server: the browser is sent this rule only, not the whole course. */
  learnTeach?: RuleTeach;
  /** How many rules the learner's ladder has, and the level's name on the card. */
  ladderSize: number;
  levelLabel: string;
  /** The daily task from Home: the card carries on to Home, and the continue button says "next". */
  daily?: boolean;
  /** The repeat of the day's session (redo=1): the same kind of cards, and nothing is recorded. */
  redo?: boolean;
  /** A practice of one rule chosen in the rule library: the typed sentences only, nothing recorded, back to the library after. */
  practice?: boolean;
  /** The rule library, offered under the last card of a day's session (not of a practice, which goes back to it). */
  libraryHref?: string;
}

type Step =
  | { kind: "recall"; task: RecallTask }
  | { kind: "notice"; learn: LearnTask }
  | { kind: "notes"; learn: LearnTask }
  | { kind: "use"; learn: LearnTask; index: number }
  | { kind: "done" };

export function DailyRuleRunner({
  visit,
  todayISO,
  locale,
  continueHref,
  learnTeach,
  ladderSize,
  levelLabel,
  daily = false,
  redo = false,
  practice = false,
  libraryHref,
}: DailyRuleRunnerProps) {
  const copy = ruleStrings(locale);
  const steps = useMemo<Step[]>(() => {
    const out: Step[] = visit.recall.map((task) => ({ kind: "recall", task }));
    if (visit.learn) {
      // A practice comes from the library, where the learner has just read the rule: the sentences only.
      if (!practice) {
        out.push({ kind: "notice", learn: visit.learn });
        if ((learnTeach?.notes.length ?? 0) > 0) {
          out.push({ kind: "notes", learn: visit.learn });
        }
      }
      visit.learn.items.forEach((_, index) =>
        out.push({ kind: "use", learn: visit.learn!, index }),
      );
    }
    out.push({ kind: "done" });
    return out;
  }, [visit, practice, learnTeach]);
  const [at, setAt] = useState(0);
  const learnOutcomes = useRef<RuleOutcome[]>([]);
  const practised = useRef<string[]>([]);
  const rightInPractice = useRef(0);
  const soundRef = useRef<PronunciationButtonHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const step = steps[at] ?? { kind: "done" as const };
  const cards = steps.length - 1;
  // The sentence being typed on this card, whose sound the settings control and the Shift key play.
  const typed =
    step.kind === "recall"
      ? step.task.item
      : step.kind === "use"
        ? step.learn.items[step.index]
        : undefined;

  /** Above a rule's name: its place on its level and the unit it belongs to. */
  function kickerOf(ruleId: string): string {
    const rule = ruleById(ruleId);
    if (!rule) return "";
    const total = ladderForLevel(LEVEL_NUMBER[rule.level])?.length ?? ladderSize;
    return `${fill(copy.ruleNumber, { n: rule.order, total })} · ${unitTitle(rule.unit, locale)}`;
  }

  function record(ruleId: string, outcome: RuleOutcome): void {
    if (redo || practice) return;
    void recordDailyRuleAction({ ruleId, outcome, todayISO }).catch(() => undefined);
  }

  function next(): void {
    setAt((value) => value + 1);
  }

  function back(): void {
    setAt((value) => Math.max(0, value - 1));
  }

  function finishRecall(task: RecallTask, result: ItemResult): void {
    const outcome = itemOutcome(result);
    practised.current.push(task.ruleId);
    record(task.ruleId, outcome);
    next();
  }

  function finishUse(learn: LearnTask, result: ItemResult): void {
    if (result.correct) rightInPractice.current += 1;
    learnOutcomes.current.push(itemOutcome(result));
    if (learnOutcomes.current.length === learn.items.length) {
      practised.current.push(learn.ruleId);
      record(learn.ruleId, ruleOutcome(learnOutcomes.current));
      learnOutcomes.current = [];
    }
    next();
  }

  const progress = (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: cards }, (_, index) => (
        <span
          key={index}
          className={cn("h-1 flex-1 rounded-full", index <= at ? "bg-primary" : "bg-muted")}
        />
      ))}
    </div>
  );

  return (
    <section className="app-shell bg-background flex min-h-svh flex-col px-5 pt-5 pb-6 sm:px-8">
      {typed?.audioUrl && <ShiftReplayHint />}
      <div className="flex min-h-9 items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium" dir="auto">
          {practice ? copy.myRules : copy.title}
        </p>
        <div className="flex items-center gap-3">
          {visit.learn?.source === "review" && !practice && step.kind !== "done" && (
            <span className="text-muted-foreground text-xs" dir="auto">
              {copy.review}
            </span>
          )}
          {typed?.audioUrl && (
            <LessonSettings
              ref={soundRef}
              text={typed.text}
              audioUrl={typed.audioUrl}
              autoPlay
              resetKey={`${at}:${typed.sentenceId}`}
              inputRef={inputRef}
              noBrowserVoice
            />
          )}
          {step.kind !== "done" && (
            <Link
              href={continueHref}
              prefetch={false}
              className="text-muted-foreground text-xs underline-offset-4 hover:underline"
            >
              <span dir="auto">{copy.skip}</span>
            </Link>
          )}
        </div>
      </div>
      {cards > 0 && <div className="mt-3">{progress}</div>}

      <div className="flex flex-1 items-center justify-center py-2">
        <div className="flex w-full max-w-4xl flex-col">
          {step.kind === "recall" && (
            <RecallCard
              key={`recall-${at}`}
              rule={ruleById(step.task.ruleId)}
              item={step.task.item}
              label={step.task.kind === "interleave" ? copy.interleave : copy.yesterday}
              copy={copy}
              inputRef={inputRef}
              soundRef={soundRef}
              onDone={(result) => finishRecall(step.task, result)}
            />
          )}

          {step.kind === "notice" && (
            <RulePageOne
              key={`notice-${at}`}
              rule={ruleById(step.learn.ruleId)}
              teach={learnTeach}
              notice={step.learn.notice}
              noticeFrom={step.learn.noticeFrom}
              copy={copy}
              locale={locale}
              kicker={kickerOf(step.learn.ruleId)}
            >
              <button
                type="button"
                onClick={next}
                className={cn(buttonVariants({ size: "lg" }), "mt-1 w-full max-w-md")}
              >
                <span dir="auto">
                  {steps[at + 1]?.kind === "notes" ? copy.next : copy.startPractice}
                </span>
              </button>
            </RulePageOne>
          )}

          {step.kind === "notes" && (
            <RulePageTwo
              key={`notes-${at}`}
              rule={ruleById(step.learn.ruleId)}
              teach={learnTeach}
              copy={copy}
              locale={locale}
            >
              <div className="flex w-full max-w-md flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={next}
                  className={cn(buttonVariants({ size: "lg" }), "w-full")}
                >
                  <span dir="auto">{copy.startPractice}</span>
                </button>
                <button
                  type="button"
                  onClick={back}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  <span dir="auto">{copy.back}</span>
                </button>
              </div>
            </RulePageTwo>
          )}

          {step.kind === "use" && (
            <UseCard
              key={`use-${at}`}
              rule={ruleById(step.learn.ruleId)}
              item={step.learn.items[step.index]!}
              index={step.index}
              total={step.learn.items.length}
              copy={copy}
              inputRef={inputRef}
              soundRef={soundRef}
              onDone={(result) => finishUse(step.learn, result)}
            />
          )}

          {step.kind === "done" && (
            <DoneCard
              copy={copy}
              held={visit.held}
              practised={practised.current}
              continueHref={continueHref}
              continueLabel={
                practice ? copy.backToRules : visit.learn && !daily ? copy.continueWords : copy.next
              }
              ladderSize={ladderSize}
              levelLabel={levelLabel}
              practice={practice}
              right={rightInPractice.current}
              total={visit.learn?.items.length ?? 0}
              libraryHref={practice ? undefined : libraryHref}
            />
          )}
        </div>
      </div>
    </section>
  );
}

/** What a typed question needs from the screen around it: the field, and the control that plays the sentence. */
interface QuestionControls {
  inputRef: RefObject<HTMLInputElement | null>;
  soundRef: RefObject<PronunciationButtonHandle | null>;
}

/** One earlier-rule question: the sentence with its blank, typed, then the answer and its sound. */
function RecallCard({
  rule,
  item,
  label,
  copy,
  inputRef,
  soundRef,
  onDone,
}: {
  rule: RuleSpec | undefined;
  item: ItemSpec;
  label: string;
  copy: RuleStrings;
  onDone: (result: ItemResult) => void;
} & QuestionControls) {
  return (
    <Question
      rule={rule}
      item={item}
      label={label}
      heading={copy.writeMissing}
      copy={copy}
      inputRef={inputRef}
      soundRef={soundRef}
      onDone={onDone}
    />
  );
}

/** One of the three typed sentences of the new rule. */
function UseCard({
  rule,
  item,
  index,
  total,
  copy,
  inputRef,
  soundRef,
  onDone,
}: {
  rule: RuleSpec | undefined;
  item: ItemSpec;
  index: number;
  total: number;
  copy: RuleStrings;
  onDone: (result: ItemResult) => void;
} & QuestionControls) {
  return (
    <Question
      rule={rule}
      item={item}
      label={`${copy.useTitle} · ${index + 1} / ${total}`}
      heading={copy.writeMissing}
      copy={copy}
      inputRef={inputRef}
      soundRef={soundRef}
      onDone={onDone}
    />
  );
}

/** The typed question shared by earlier-rule questions and the three sentences of a new rule. */
function Question({
  rule,
  item,
  label,
  heading,
  copy,
  inputRef,
  soundRef,
  onDone,
}: {
  rule: RuleSpec | undefined;
  item: ItemSpec;
  label: string;
  heading: string;
  copy: RuleStrings;
  onDone: (result: ItemResult) => void;
} & QuestionControls) {
  const [value, setValue] = useState("");
  const [wrongTries, setWrongTries] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [phase, setPhase] = useState<"typing" | "wrong" | "right" | "missed">("typing");
  const [hint, setHint] = useState<Diagnosis>("other");
  const final = phase === "right" || phase === "missed";
  const { resolveSentenceWord } = usePronunciationSettings();
  const wordClip = useAudioClip(undefined, { shared: true });
  // Only the latest press plays: a slow lookup must not start after a later one.
  const wordRequest = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  function finish(): void {
    onDone({ correct: phase === "right", wrongTries, hinted });
  }

  // Enter carries on from the answer, wherever the focus is (the field is gone by then).
  useEnterToContinue(final, finish);

  // The answers that are right: a prepared sentence may accept more than one ("isn't" and "is not").
  const answers = item.answers ?? [item.answer];

  function check(): void {
    if (final || value.trim() === "") return;
    const result = diagnoseAny(value, answers);
    if (result === "correct") {
      setPhase("right");
      return;
    }
    const tries = wrongTries + 1;
    setWrongTries(tries);
    if (tries >= 2) {
      setPhase("missed");
      return;
    }
    setHint(result);
    setPhase("wrong");
  }

  function onKey(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") return;
    event.preventDefault();
    check();
  }

  /**
   * The missing word on its own, in the recording kept for that word of this sentence. A word with no
   * recording plays the sentence again rather than nothing: the learner pressed the button to hear.
   */
  async function listenWord(): Promise<void> {
    const request = ++wordRequest.current;
    soundRef.current?.stop();
    const url = item.voiceId
      ? await resolveSentenceWord({
          sentenceId: item.sentenceId,
          text: item.text,
          voiceId: item.voiceId,
          key: normalizeMistakeWord(item.answer),
        }).catch(() => null)
      : null;
    if (request !== wordRequest.current) return;
    if (url) wordClip.play(url);
    else soundRef.current?.replay();
  }

  // A prepared sentence with no stored recording has no sound at all, so there is nothing to listen to.
  const listen = item.audioUrl ? (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => void listenWord()}
      className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 text-sm"
    >
      <Volume2 aria-hidden="true" className="size-4" /> <span dir="auto">{copy.listen}</span>
    </button>
  ) : null;

  return (
    <div className="flex flex-col items-center gap-9 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-sm" dir="auto">
          {label}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl" dir="ltr">
          {glueEndings(rule?.title ?? "")}
        </h2>
      </div>

      <p
        className="max-w-full text-[clamp(1.9rem,1.15rem+2.7vw,3.4rem)] leading-snug text-balance"
        dir="ltr"
      >
        {final ? (
          <>
            {item.before}
            <span className="font-semibold">
              <Form rule={rule} word={item.answer} />
            </span>
            {item.after}
          </>
        ) : (
          <>
            {item.before}
            <span
              className="border-primary text-primary mx-1 inline-block min-w-[2.5em] border-b-2 text-center font-semibold"
              style={
                item.answer.includes(" ")
                  ? { minWidth: `${Math.min(9, item.answer.length * 0.5)}em` }
                  : undefined
              }
            >
              {hinted ? `${item.answer.charAt(0)}…` : " "}
            </span>
            {item.hint && (
              <span className="text-muted-foreground ms-0.5 align-middle text-[0.5em] font-medium">
                ({item.hint})
              </span>
            )}
            {item.after}
          </>
        )}
      </p>

      <div className="flex w-full max-w-md flex-col items-center gap-5">
        {!final && (
          <input
            ref={inputRef}
            dir="ltr"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label={heading}
            className="border-border focus:border-primary w-full border-b-2 bg-transparent px-2 py-2 text-center text-2xl outline-none sm:text-3xl"
          />
        )}

        {phase === "wrong" && (
          <p className="text-muted-foreground text-sm" dir="auto">
            {copy.diagnosis[hint === "correct" ? "other" : hint]} — {copy.tryAgain}
          </p>
        )}
        {phase === "right" && (
          <p className="text-success flex items-center gap-1.5 text-sm font-medium" dir="auto">
            <Check aria-hidden="true" className="size-4" /> {copy.correct}
          </p>
        )}
        {phase === "missed" && (
          <p className="text-muted-foreground text-sm" dir="auto">
            {copy.answerWas}{" "}
            <span className="text-foreground font-semibold" dir="ltr">
              {answers.slice(0, 2).join(" / ")}
            </span>
          </p>
        )}

        {!final ? (
          <>
            <button
              type="button"
              onClick={() => check()}
              disabled={value.trim() === ""}
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              <span dir="auto">{copy.check}</span>
            </button>
            <div className="flex items-center justify-center gap-6">
              {listen}
              {!hinted && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setHinted(true)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  <span dir="auto">{copy.hint}</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={finish}
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              <span dir="auto">{copy.next}</span>
            </button>
            {listen}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The last card: where the rule now stands, and that it comes back tomorrow first thing. After a practice
 * from the library it says how many of the sentences were right and that the schedule did not change, and
 * goes back to the library; after a day's session the library is offered under the main button.
 */
function DoneCard({
  copy,
  held,
  practised,
  continueHref,
  continueLabel,
  ladderSize,
  levelLabel,
  practice,
  right,
  total,
  libraryHref,
}: {
  copy: RuleStrings;
  held: number;
  practised: readonly string[];
  continueHref: string;
  continueLabel: string;
  ladderSize: number;
  levelLabel: string;
  practice: boolean;
  right: number;
  total: number;
  libraryHref: string | undefined;
}) {
  const titles = [...new Set(practised)]
    .map((id) => ruleById(id)?.title)
    .filter((title): title is string => title !== undefined);
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="border-success/40 bg-success/[0.14] text-success grid size-11 place-items-center rounded-full border">
        <Check aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </span>
      <h2 className="text-3xl font-semibold tracking-tight" dir="auto">
        {practice ? copy.practiceDone : copy.doneTitle}
      </h2>
      <p className="text-muted-foreground text-sm" dir="auto">
        {practice ? copy.practiceNote : copy.doneSub}
      </p>
      <p className="text-sm font-medium" dir="auto">
        {practice
          ? fill(copy.practiceScore, { n: right, total })
          : fill(copy.heldLine, { n: held, total: ladderSize, level: levelLabel })}
      </p>
      {titles.length > 0 && (
        <ul className="flex flex-col items-center gap-1.5 text-base" dir="ltr">
          {titles.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex w-full max-w-md flex-col gap-3">
        <Link
          href={continueHref}
          prefetch={false}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          <span dir="auto">{continueLabel}</span>
        </Link>
        {libraryHref && (
          <Link
            href={libraryHref}
            prefetch={false}
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}
          >
            <span dir="auto">{copy.openMyRules}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
