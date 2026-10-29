"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Check, Volume2 } from "lucide-react";

import { LessonSettings } from "@/components/learning/lesson-settings";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { buttonVariants } from "@/components/ui/button";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { recordDailyRuleAction } from "@/lib/daily-rule/actions";
import type { RuleSpec } from "@/lib/daily-rule/ladder";
import { ruleById } from "@/lib/daily-rule/levels";
import { glueEndings, parseMarked, splitMark } from "@/lib/daily-rule/marks";
import type { RuleOutcome } from "@/lib/daily-rule/schedule";
import { fill, ruleStrings, type RuleStrings } from "@/lib/daily-rule/strings";
import { inLocale, teachFor, type RuleTeach } from "@/lib/daily-rule/teach";
import { itemOutcome, ruleOutcome, type ItemResult } from "@/lib/daily-rule/outcome";
import { diagnose, type Diagnosis } from "@/lib/daily-rule/tokens";
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
 * under the field says only the missing word. The grammar letters of the rule (the -ing of reading, the
 * is of she is) are shown in colour wherever the rule's forms appear. Each card's outcome is recorded
 * once it is final; leaving early records only what was finished.
 */

export interface DailyRuleRunnerProps {
  visit: RuleVisit;
  todayISO: string;
  locale: SupportLocale | null;
  /** Where the card carries on to: the words step of Today, or the next step when the card came first. */
  continueHref: string;
  /** How many rules the learner's ladder has, and the level's name on the card. */
  ladderSize: number;
  levelLabel: string;
  /** The daily task from Home: the card carries on to Home, and the continue button says "next". */
  daily?: boolean;
  /** The repeat of the day's session (redo=1): the same kind of cards, and nothing is recorded. */
  redo?: boolean;
}

type Step =
  | { kind: "recall"; task: RecallTask }
  | { kind: "notice"; learn: LearnTask }
  | { kind: "notes"; learn: LearnTask }
  | { kind: "use"; learn: LearnTask; index: number }
  | { kind: "done" };

function play(url: string): void {
  const audio = new Audio(url);
  void audio.play().catch(() => undefined);
}

/** The colours of a form the rule is about: its letters tinted in the page's colour. */
const MARK_CLASS = "text-primary bg-primary/15 rounded-sm px-[0.12em] font-semibold";
/** The part of a wrong sentence that is wrong: struck through and quiet. */
const WRONG_CLASS = "text-muted-foreground bg-transparent line-through decoration-2";

export function DailyRuleRunner({
  visit,
  todayISO,
  locale,
  continueHref,
  ladderSize,
  levelLabel,
  daily = false,
  redo = false,
}: DailyRuleRunnerProps) {
  const copy = ruleStrings(locale);
  const steps = useMemo<Step[]>(() => {
    const out: Step[] = visit.recall.map((task) => ({ kind: "recall", task }));
    if (visit.learn) {
      out.push({ kind: "notice", learn: visit.learn });
      if ((teachFor(visit.learn.ruleId)?.notes.length ?? 0) > 0) {
        out.push({ kind: "notes", learn: visit.learn });
      }
      visit.learn.items.forEach((_, index) =>
        out.push({ kind: "use", learn: visit.learn!, index }),
      );
    }
    out.push({ kind: "done" });
    return out;
  }, [visit]);
  const [at, setAt] = useState(0);
  const learnOutcomes = useRef<RuleOutcome[]>([]);
  const practised = useRef<string[]>([]);
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

  function record(ruleId: string, outcome: RuleOutcome): void {
    if (redo) return;
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
    <section className="flex min-h-svh flex-col px-5 pt-5 pb-6 sm:px-8">
      {typed && <ShiftReplayHint />}
      <div className="flex min-h-9 items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium" dir="auto">
          {copy.title}
        </p>
        <div className="flex items-center gap-3">
          {visit.learn?.source === "review" && step.kind !== "done" && (
            <span className="text-muted-foreground text-xs" dir="auto">
              {copy.review}
            </span>
          )}
          {typed && (
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
            <NoticeCard
              key={`notice-${at}`}
              rule={ruleById(step.learn.ruleId)}
              learn={step.learn}
              copy={copy}
              locale={locale}
              nextLabel={steps[at + 1]?.kind === "notes" ? copy.next : copy.startPractice}
              onNext={next}
            />
          )}

          {step.kind === "notes" && (
            <NotesCard
              key={`notes-${at}`}
              rule={ruleById(step.learn.ruleId)}
              copy={copy}
              locale={locale}
              onNext={next}
              onBack={back}
            />
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
              continueLabel={visit.learn && !daily ? copy.continueWords : copy.next}
              ladderSize={ladderSize}
              levelLabel={levelLabel}
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

/**
 * A word with the letters its rule is about in colour: the -ing of reading, the s of works, or the whole
 * word when the rule is about the word itself (is, an, can). The rest of the word stays as it is.
 */
function Form({ rule, word }: { rule: RuleSpec | undefined; word: string }) {
  if (!rule) return <>{word}</>;
  const { stem, mark } = splitMark(rule.match, word);
  return (
    <>
      {stem}
      <mark className={MARK_CLASS}>{mark}</mark>
    </>
  );
}

/** A sentence of the card written with its marked part in [brackets]: tinted when right, struck through when wrong. */
function Marked({ text, tone }: { text: string; tone: "right" | "wrong" }) {
  return (
    <>
      {parseMarked(text).map((part, index) =>
        part.marked ? (
          <mark key={index} className={tone === "right" ? MARK_CLASS : WRONG_CLASS}>
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
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

  function check(): void {
    if (final || value.trim() === "") return;
    if (diagnose(value, item.answer) === "correct") {
      setPhase("right");
      return;
    }
    const tries = wrongTries + 1;
    setWrongTries(tries);
    if (tries >= 2) {
      setPhase("missed");
      return;
    }
    setHint(diagnose(value, item.answer));
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

  const listen = (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => void listenWord()}
      className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 text-sm"
    >
      <Volume2 aria-hidden="true" className="size-4" /> <span dir="auto">{copy.listen}</span>
    </button>
  );

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
            <span className="border-primary text-primary mx-1 inline-block min-w-[2.5em] border-b-2 text-center font-semibold">
              {hinted ? `${item.answer.charAt(0)}…` : " "}
            </span>
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
              {item.answer}
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
 * An Arabic line that names English words (the lines of a rule do): each run of English keeps its own
 * direction inside the Arabic sentence, so "-ing", "go → goes" and "to:" read in order instead of swapping
 * places. The punctuation and brackets at either end of a run stay outside it, with the Arabic, so a
 * full stop lands where the Arabic sentence ends and not between the English and the Arabic.
 */
function MixedLine({ text }: { text: string }) {
  return (
    <>
      {text.split(/([\x21-\x7E→]+(?: [\x21-\x7E→]+)*)/).map((part, index) => {
        if (index % 2 === 0) return part;
        const found = /^([\s.,:;!?()]*)(.*?)([\s.,:;!?()]*)$/.exec(part)!;
        return (
          <Fragment key={index}>
            {found[1]}
            <bdi>{glueEndings(found[2]!)}</bdi>
            {found[3]}
          </Fragment>
        );
      })}
    </>
  );
}

/** One line of a rule in the learner's language: Arabic keeps its English words in order, Spanish and Turkish read as they are. */
function Say({ text, locale }: { text: string; locale: SupportLocale | null }) {
  return (locale ?? "ar") === "ar" ? <MixedLine text={text} /> : <>{glueEndings(text)}</>;
}

const textDir = (locale: SupportLocale | null): "rtl" | "ltr" =>
  (locale ?? "ar") === "ar" ? "rtl" : "ltr";

/** The rule's title and its accent line, the head of both pages of the card. */
function RuleHead({ kicker, title, dir }: { kicker: string; title: string; dir: "ltr" | "auto" }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-muted-foreground text-sm" dir="auto">
        {kicker}
      </p>
      <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl" dir={dir}>
        {glueEndings(title)}
      </h2>
      <span aria-hidden="true" className="bg-primary h-1 w-12 rounded-full" />
    </div>
  );
}

/**
 * Page one of the new rule: the rule's name, large; the idea in the learner's own language and in simple
 * English (with the verbs it names, when it names some); the right and the wrong sentence with the grammar
 * letters in colour; and the two sentences from the learner's story with the same letters. What to watch
 * for (the exceptions) is the next page, so this one stays clear.
 */
function NoticeCard({
  rule,
  learn,
  copy,
  locale,
  nextLabel,
  onNext,
}: {
  rule: RuleSpec | undefined;
  learn: LearnTask;
  copy: RuleStrings;
  locale: SupportLocale | null;
  nextLabel: string;
  onNext: () => void;
}) {
  const teach: RuleTeach | undefined = rule ? teachFor(rule.id) : undefined;
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <RuleHead kicker={copy.noticeTitle} title={rule?.title ?? ""} dir="ltr" />

      {rule && teach && (
        <div className="flex max-w-2xl flex-col items-center gap-3">
          <p
            className="text-foreground text-xl leading-relaxed font-medium text-balance sm:text-2xl"
            dir={textDir(locale)}
          >
            <Say text={inLocale(teach.idea, locale)} locale={locale} />
          </p>
          <p
            className="text-muted-foreground text-base leading-relaxed text-balance sm:text-lg"
            dir="ltr"
          >
            {glueEndings(teach.idea.en)}
          </p>
          {rule.words && (
            <p
              className="text-primary pt-1 text-lg font-semibold text-balance sm:text-xl"
              dir="ltr"
            >
              {rule.words.join(" · ")}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {teach && (
          <div className="flex flex-col items-center gap-1.5 text-xl sm:text-2xl" dir="ltr">
            <p className="text-foreground">
              <span className="text-success" role="img" aria-label={copy.rightSentence}>
                ✓
              </span>{" "}
              <Marked text={teach.right} tone="right" />
            </p>
            <p className="text-muted-foreground">
              <span role="img" aria-label={copy.wrongSentence}>
                ✗
              </span>{" "}
              <Marked text={teach.wrong} tone="wrong" />
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground text-sm" dir="auto">
            {copy.fromYourStory}
          </p>
          <ul className="flex flex-col items-center gap-2">
            {learn.notice.map((item) => (
              <li key={item.sentenceId} className="flex items-center gap-3">
                <p className="text-lg leading-relaxed text-balance sm:text-xl" dir="ltr">
                  {item.before}
                  <span className="font-semibold">
                    <Form rule={rule} word={item.answer} />
                  </span>
                  {item.after}
                </p>
                <button
                  type="button"
                  onClick={() => play(item.audioUrl)}
                  aria-label={copy.listen}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Volume2 aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className={cn(buttonVariants({ size: "lg" }), "mt-1 w-full max-w-md")}
      >
        <span dir="auto">{nextLabel}</span>
      </button>
    </div>
  );
}

/**
 * Page two of the new rule: what to watch for. Each note says in its own chip whether it is an exception
 * or more detail, then the line in the learner's language and in simple English, then the sentences that
 * show it with the letters in colour. Back goes to page one; the button starts the typed sentences.
 */
function NotesCard({
  rule,
  copy,
  locale,
  onNext,
  onBack,
}: {
  rule: RuleSpec | undefined;
  copy: RuleStrings;
  locale: SupportLocale | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const teach = rule ? teachFor(rule.id) : undefined;
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <RuleHead kicker={rule?.title ?? ""} title={copy.watchOut} dir="auto" />

      <ul
        className={cn(
          "grid w-full gap-x-10 gap-y-7",
          // Two notes sit side by side on a wide screen, so the page still fits one screen.
          (teach?.notes.length ?? 0) > 1 ? "max-w-4xl md:grid-cols-2" : "max-w-xl",
        )}
      >
        {teach?.notes.map((note, index) => (
          <li key={index} className="flex flex-col items-center gap-2.5">
            <span
              className="border-border text-muted-foreground rounded-full border px-3 py-0.5 text-xs font-medium"
              dir="auto"
            >
              {note.kind === "exception" ? copy.exception : copy.detail}
            </span>
            <p
              className="text-foreground text-xl leading-relaxed font-medium text-balance sm:text-2xl"
              dir={textDir(locale)}
            >
              <Say text={inLocale(note.say, locale)} locale={locale} />
            </p>
            <p
              className="text-muted-foreground text-base leading-relaxed text-balance sm:text-lg"
              dir="ltr"
            >
              {glueEndings(note.say.en)}
            </p>
            <div className="flex flex-col items-center gap-1 pt-1 text-xl sm:text-2xl" dir="ltr">
              {note.examples.map((example) => (
                <p key={example}>
                  <Marked text={example} tone="right" />
                </p>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <button
          type="button"
          onClick={onNext}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          <span dir="auto">{copy.startPractice}</span>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          <span dir="auto">{copy.back}</span>
        </button>
      </div>
    </div>
  );
}

/** The last card: where the rule now stands, and that it comes back tomorrow first thing. */
function DoneCard({
  copy,
  held,
  practised,
  continueHref,
  continueLabel,
  ladderSize,
  levelLabel,
}: {
  copy: RuleStrings;
  held: number;
  practised: readonly string[];
  continueHref: string;
  continueLabel: string;
  ladderSize: number;
  levelLabel: string;
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
        {copy.doneTitle}
      </h2>
      <p className="text-muted-foreground text-sm" dir="auto">
        {copy.doneSub}
      </p>
      <p className="text-sm font-medium" dir="auto">
        {fill(copy.heldLine, { n: held, total: ladderSize, level: levelLabel })}
      </p>
      {titles.length > 0 && (
        <ul className="flex flex-col items-center gap-1.5 text-base" dir="ltr">
          {titles.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      )}
      <Link
        href={continueHref}
        prefetch={false}
        className={cn(buttonVariants({ size: "lg" }), "mt-2 w-full max-w-md")}
      >
        <span dir="auto">{continueLabel}</span>
      </Link>
    </div>
  );
}
