"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { isRightAnswer } from "@/lib/public-pages/answer";
import { cn } from "@/lib/utils";

export interface TryItExample {
  before: string;
  answers: readonly string[];
  after: string;
  hint: string | null;
}

type Status = "idle" | "wrong" | "right" | "shown";

/**
 * The one interactive piece of a rule page: the rule's prepared sentences, one at a time, with the blank
 * for the learner to type. It runs entirely in the browser (no request, nothing saved), so a visitor who
 * has not signed up yet has typed an answer before the first lesson. The sentences come from the rule
 * itself (teach.ts), the same ones its practice is made from.
 */
export function TryIt({ examples }: { examples: readonly TryItExample[] }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [done, setDone] = useState<readonly boolean[]>(() => examples.map(() => false));
  const inputRef = useRef<HTMLInputElement>(null);

  const example = examples[index];
  if (!example) return null;
  const finished = done.every(Boolean);
  const answered = status === "right" || status === "shown";

  function check() {
    if (!example || answered) return;
    if (isRightAnswer(value, example.answers)) {
      setStatus("right");
      setDone((current) => current.map((flag, i) => (i === index ? true : flag)));
    } else if (value.trim() !== "") {
      setStatus("wrong");
    }
  }

  function showAnswer() {
    if (!example) return;
    setValue(example.answers[0] ?? "");
    setStatus("shown");
    setDone((current) => current.map((flag, i) => (i === index ? true : flag)));
  }

  function next() {
    const upcoming = examples.findIndex((_, i) => i > index && !done[i]);
    const target = upcoming >= 0 ? upcoming : examples.findIndex((_, i) => !done[i]);
    if (target < 0) return;
    setIndex(target);
    setValue("");
    setStatus("idle");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const width = `${Math.max((example.answers[0] ?? "").length, 4) + 2}ch`;

  return (
    <div className="border-border bg-card rounded-2xl border p-5 sm:p-6">
      <div className="text-muted-foreground mb-4 flex items-center justify-between text-sm" dir="ltr">
        <span dir="rtl">{`جملة ${index + 1} من ${examples.length}`}</span>
        <span className="flex gap-1.5" aria-hidden="true">
          {done.map((flag, i) => (
            <i
              key={i}
              className={cn(
                "block size-2 rounded-full",
                flag ? "bg-primary" : i === index ? "bg-primary/50" : "bg-border",
              )}
            />
          ))}
        </span>
      </div>

      <p dir="ltr" lang="en" className="text-left text-lg leading-[2.4] font-medium sm:text-xl">
        {example.before}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (status === "wrong") setStatus("idle");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (answered) next();
              else check();
            }
          }}
          disabled={answered}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="الكلمة الناقصة"
          style={{ width }}
          className={cn(
            "mx-1 rounded-t-md border-0 border-b-2 px-2 text-center font-bold outline-none",
            status === "right" || status === "shown"
              ? "border-success bg-success/10 text-success"
              : status === "wrong"
                ? "border-danger bg-danger/10 text-danger"
                : "border-primary bg-brand-muted text-primary",
          )}
        />
        {example.after}
        {example.hint ? (
          <span className="text-muted-foreground ms-2 text-sm font-normal">({example.hint})</span>
        ) : null}
      </p>

      <p className="text-muted-foreground mt-2 min-h-6 text-sm" dir="rtl" aria-live="polite">
        {status === "right" && (finished ? "صحيح. أنهيت التمرين." : "صحيح.")}
        {status === "wrong" && "ليس بعد. اقرأ القاعدة في أعلى الصفحة وحاول مرة أخرى."}
        {status === "shown" && (finished ? "هذا هو الجواب. أنهيت التمرين." : "هذا هو الجواب. جرّب الجملة التالية.")}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2" dir="ltr">
        {!answered && (
          <Button type="button" size="sm" onClick={check} dir="rtl">
            تحقّق
          </Button>
        )}
        {!answered && status === "wrong" && (
          <Button type="button" size="sm" variant="ghost" onClick={showAnswer} dir="rtl">
            أظهر الجواب
          </Button>
        )}
        {answered && !finished && (
          <Button type="button" size="sm" onClick={next} dir="rtl">
            التالي
          </Button>
        )}
      </div>
    </div>
  );
}
