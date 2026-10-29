"use client";

import { Fragment, type ReactNode } from "react";
import { Volume2 } from "lucide-react";

import { Say } from "@/components/today/rule-text";
import type { RuleSpec } from "@/lib/daily-rule/ladder";
import { glueEndings, parseMarked, splitMark } from "@/lib/daily-rule/marks";
import { ruleTextDir, type RuleStrings } from "@/lib/daily-rule/strings";
import { inLocale, teachFor } from "@/lib/daily-rule/teach";
import type { ItemSpec } from "@/lib/daily-rule/visit";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * The two pages that teach a rule, drawn the same wherever a rule is taught: in the rule of the day (the
 * runner) and in the rule library. Page one is the rule's name, its idea in the learner's language and in
 * simple English, the right and the wrong sentence, and the sentences of the learner's own story when there
 * are some; page two is what to watch for (the exceptions and the details). Each page leaves its bottom
 * to the caller (`children`: the buttons), because a day's card and a library page go different ways from
 * here. The grammar letters of the rule are shown in colour on both.
 */

/** The colours of a form the rule is about: its letters tinted in the page's colour. */
export const MARK_CLASS = "text-primary bg-primary/15 rounded-sm px-[0.12em] font-semibold";
/** The part of a wrong sentence that is wrong: struck through and quiet. */
export const WRONG_CLASS = "text-muted-foreground bg-transparent line-through decoration-2";

function play(url: string): void {
  const audio = new Audio(url);
  void audio.play().catch(() => undefined);
}

/**
 * A word with the letters its rule is about in colour: the -ing of reading, the s of works, or the whole
 * word when the rule is about the word itself (is, an, can). The rest of the word stays as it is.
 */
export function Form({ rule, word }: { rule: RuleSpec | undefined; word: string }) {
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
export function Marked({ text, tone }: { text: string; tone: "right" | "wrong" }) {
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

/** The rule's title and its accent line, the head of both pages of the card. */
export function RuleHead({
  kicker,
  title,
  dir,
}: {
  kicker: string;
  title: string;
  dir: "ltr" | "auto";
}) {
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
 * Page one of a rule: the rule's name, large; the idea in the learner's own language and in simple English
 * (with the verbs it names, when it names some); the right and the wrong sentence with the grammar letters
 * in colour; and the sentences from the learner's story with the same letters, when there are some. What to
 * watch for (the exceptions) is the next page, so this one stays clear. `children` is the button row.
 */
export function RulePageOne({
  rule,
  notice,
  copy,
  locale,
  kicker,
  children,
}: {
  rule: RuleSpec | undefined;
  /** The sentences of the learner's story that show the rule; none hides that block. */
  notice: readonly ItemSpec[];
  copy: RuleStrings;
  locale: SupportLocale | null;
  kicker: string;
  children: ReactNode;
}) {
  const teach = rule ? teachFor(rule.id) : undefined;
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <RuleHead kicker={kicker} title={rule?.title ?? ""} dir="ltr" />

      {rule && teach && (
        <div className="flex max-w-2xl flex-col items-center gap-3">
          <p
            className="text-foreground text-xl leading-relaxed font-medium text-balance sm:text-2xl"
            dir={ruleTextDir(locale)}
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

        {notice.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm" dir="auto">
              {copy.fromYourStory}
            </p>
            <ul className="flex flex-col items-center gap-2">
              {notice.map((item) => (
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
        )}
      </div>

      {children}
    </div>
  );
}

/**
 * Page two of a rule: what to watch for. Each note says in its own chip whether it is an exception or more
 * detail, then the line in the learner's language and in simple English, then the sentences that show it
 * with the letters in colour. Two notes sit side by side on a wide screen, so the page still fits one
 * screen. `children` is the button row.
 */
export function RulePageTwo({
  rule,
  copy,
  locale,
  children,
}: {
  rule: RuleSpec | undefined;
  copy: RuleStrings;
  locale: SupportLocale | null;
  children: ReactNode;
}) {
  const teach = rule ? teachFor(rule.id) : undefined;
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <RuleHead kicker={rule?.title ?? ""} title={copy.watchOut} dir="auto" />

      <ul
        className={cn(
          "grid w-full gap-x-10 gap-y-7",
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
              dir={ruleTextDir(locale)}
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

      {children}
    </div>
  );
}
