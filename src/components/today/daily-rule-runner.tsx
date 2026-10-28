"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Volume2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { recordDailyRuleAction } from "@/lib/daily-rule/actions";
import type { RuleSpec } from "@/lib/daily-rule/ladder";
import { ruleById } from "@/lib/daily-rule/levels";
import type { RuleOutcome } from "@/lib/daily-rule/schedule";
import { fill, ruleStrings, type RuleStrings } from "@/lib/daily-rule/strings";
import { itemOutcome, ruleOutcome, type ItemResult } from "@/lib/daily-rule/outcome";
import { diagnose, type Diagnosis } from "@/lib/daily-rule/tokens";
import type { ItemSpec, LearnTask, RecallTask, RuleVisit } from "@/lib/daily-rule/visit";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * The rule of the day, as a short sequence of cards: a question on an earlier rule (if one is due), the
 * new rule taught from the story just read (the form in two of its sentences, the rule in plain English,
 * the contrast and the exception), three sentences to type, and a last card that says where the rule
 * now stands. Every sound is a stored recording of the sentence, never the browser's voice. Each card's
 * outcome is recorded once it is final; leaving early records only what was finished.
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
}

type Step =
  | { kind: "recall"; task: RecallTask }
  | { kind: "notice"; learn: LearnTask }
  | { kind: "use"; learn: LearnTask; index: number }
  | { kind: "done" };

function play(url: string): void {
  const audio = new Audio(url);
  void audio.play().catch(() => undefined);
}

export function DailyRuleRunner({
  visit,
  todayISO,
  locale,
  continueHref,
  ladderSize,
  levelLabel,
  daily = false,
}: DailyRuleRunnerProps) {
  const copy = ruleStrings(locale);
  const steps = useMemo<Step[]>(() => {
    const out: Step[] = visit.recall.map((task) => ({ kind: "recall", task }));
    if (visit.learn) {
      out.push({ kind: "notice", learn: visit.learn });
      visit.learn.items.forEach((_, index) => out.push({ kind: "use", learn: visit.learn!, index }));
    }
    out.push({ kind: "done" });
    return out;
  }, [visit]);
  const [at, setAt] = useState(0);
  const learnOutcomes = useRef<RuleOutcome[]>([]);
  const practised = useRef<string[]>([]);
  const step = steps[at] ?? { kind: "done" as const };
  const cards = steps.length - 1;

  function record(ruleId: string, outcome: RuleOutcome): void {
    void recordDailyRuleAction({ ruleId, outcome, todayISO }).catch(() => undefined);
  }

  function next(): void {
    setAt((value) => value + 1);
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
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-4">
      <div className="border-border/60 bg-card flex w-full max-w-xl flex-col gap-3 rounded-3xl border px-5 py-5 shadow-sm sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs font-medium" dir="auto">
            {copy.title}
          </p>
          <div className="flex items-center gap-2">
            {visit.learn?.source === "review" && step.kind !== "done" && (
              <span className="border-border text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs" dir="auto">
                {copy.review}
              </span>
            )}
            {step.kind !== "done" && (
              <Link href={continueHref} prefetch={false} className="text-muted-foreground text-xs underline-offset-4 hover:underline">
                <span dir="auto">{copy.skip}</span>
              </Link>
            )}
          </div>
        </div>
        {cards > 0 && progress}

        {step.kind === "recall" && (
          <RecallCard
            key={`recall-${at}`}
            rule={ruleById(step.task.ruleId)}
            item={step.task.item}
            label={step.task.kind === "interleave" ? copy.interleave : copy.yesterday}
            copy={copy}
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
            onNext={next}
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
    </section>
  );
}

/** One earlier-rule question: the sentence with its blank, typed, then the answer and its sound. */
function RecallCard({
  rule,
  item,
  label,
  copy,
  onDone,
}: {
  rule: RuleSpec | undefined;
  item: ItemSpec;
  label: string;
  copy: RuleStrings;
  onDone: (result: ItemResult) => void;
}) {
  return (
    <Question
      rule={rule}
      item={item}
      label={label}
      heading={copy.writeMissing}
      copy={copy}
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
  onDone,
}: {
  rule: RuleSpec | undefined;
  item: ItemSpec;
  index: number;
  total: number;
  copy: RuleStrings;
  onDone: (result: ItemResult) => void;
}) {
  return (
    <Question
      rule={rule}
      item={item}
      label={`${copy.useTitle} · ${index + 1} / ${total}`}
      heading={copy.writeMissing}
      copy={copy}
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
  onDone,
}: {
  rule: RuleSpec | undefined;
  item: ItemSpec;
  label: string;
  heading: string;
  copy: RuleStrings;
  onDone: (result: ItemResult) => void;
}) {
  const [value, setValue] = useState("");
  const [wrongTries, setWrongTries] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [phase, setPhase] = useState<"typing" | "wrong" | "right" | "missed">("typing");
  const [hint, setHint] = useState<Diagnosis>("other");
  const final = phase === "right" || phase === "missed";

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
    if (final) onDone({ correct: phase === "right", wrongTries, hinted });
    else check();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-muted-foreground text-sm" dir="auto">
          {label}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight" dir="ltr">
          {rule?.title ?? ""}
        </h2>
      </div>

      <div className="bg-muted/60 rounded-2xl p-3">
        <p className="text-left text-lg leading-relaxed" dir="ltr">
          {final ? (
            <>
              {item.before}
              <mark className="text-primary bg-transparent font-semibold underline underline-offset-4">{item.answer}</mark>
              {item.after}
            </>
          ) : (
            <>
              {item.before}
              <span className="border-primary text-primary mx-1 inline-block min-w-16 border-b-2 text-center font-semibold">
                {hinted ? `${item.answer.charAt(0)}…` : " "}
              </span>
              {item.after}
            </>
          )}
        </p>
      </div>

      {!final && (
        <input
          dir="ltr"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label={heading}
          placeholder={heading}
          className="border-border bg-background focus:border-primary w-full rounded-xl border px-4 py-3 text-lg outline-none"
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

      <div className="mt-1 flex flex-col gap-2">
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
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => play(item.audioUrl)} className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
                <Volume2 aria-hidden="true" className="size-4" /> <span dir="auto">{copy.listen}</span>
              </button>
              {!hinted && (
                <button type="button" onClick={() => setHinted(true)} className="text-muted-foreground text-sm">
                  <span dir="auto">{copy.hint}</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onDone({ correct: phase === "right", wrongTries, hinted })}
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              <span dir="auto">{copy.next}</span>
            </button>
            <button type="button" onClick={() => play(item.audioUrl)} className="text-muted-foreground inline-flex items-center justify-center gap-1.5 text-sm">
              <Volume2 aria-hidden="true" className="size-4" /> <span dir="auto">{copy.listen}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** The new rule: the form in the story, the rule in plain English, the contrast and the exception. */
function NoticeCard({
  rule,
  learn,
  copy,
  locale,
  onNext,
}: {
  rule: RuleSpec | undefined;
  learn: LearnTask;
  copy: RuleStrings;
  locale: SupportLocale | null;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-muted-foreground text-sm" dir="auto">
          {copy.noticeTitle}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight" dir="ltr">
          {rule?.title ?? ""}
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {learn.notice.map((item) => (
          <div key={item.sentenceId} className="bg-muted/60 flex items-center gap-3 rounded-2xl p-3">
            <p className="flex-1 text-left text-base leading-relaxed" dir="ltr">
              {item.before}
              <mark className="text-primary bg-transparent font-semibold underline underline-offset-4">{item.answer}</mark>
              {item.after}
            </p>
            <button type="button" onClick={() => play(item.audioUrl)} aria-label={copy.listen} className="text-muted-foreground shrink-0">
              <Volume2 aria-hidden="true" className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {rule && (
        <div className="flex flex-col gap-2">
          <p className="text-base" dir="ltr">
            {rule.rule}
          </p>
          {locale === "ar" && (
            <p className="text-muted-foreground text-sm" dir="auto">
              {rule.gloss}
            </p>
          )}
          <div className="bg-muted/60 mt-1 flex flex-col gap-1 rounded-2xl p-3 text-lg" dir="ltr">
            <p className="text-success">✓ {rule.right}</p>
            <p className="text-muted-foreground">✗ {rule.wrong}</p>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-xs leading-relaxed">
            <p className="text-foreground font-medium" dir="auto">
              {copy.exception}
            </p>
            <p dir="ltr">{rule.exception}</p>
            {locale === "ar" && <p dir="auto">{rule.exceptionGloss}</p>}
          </div>
        </div>
      )}

      <button type="button" onClick={onNext} className={cn(buttonVariants({ size: "lg" }), "mt-1 w-full")}>
        <span dir="auto">{copy.next}</span>
      </button>
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
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="border-success/40 bg-success/[0.14] text-success grid size-11 place-items-center rounded-full border">
        <Check aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </span>
      <h2 className="text-2xl font-semibold tracking-tight" dir="auto">
        {copy.doneTitle}
      </h2>
      <p className="text-muted-foreground text-sm" dir="auto">
        {copy.doneSub}
      </p>
      <p className="text-sm font-medium" dir="auto">
        {fill(copy.heldLine, { n: held, total: ladderSize, level: levelLabel })}
      </p>
      {titles.length > 0 && (
        <ul className="flex w-full flex-col gap-1 text-start" dir="ltr">
          {titles.map((title) => (
            <li key={title} className="border-border/60 border-b py-2 text-sm">
              {title}
            </li>
          ))}
        </ul>
      )}
      <Link href={continueHref} prefetch={false} className={cn(buttonVariants({ size: "lg" }), "mt-2 w-full")}>
        <span dir="auto">{continueLabel}</span>
      </Link>
    </div>
  );
}
