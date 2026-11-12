"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { RatingFace, type FaceLevel } from "@/components/words/ladder/ladder-faces";
import { facesStrings, type FacesStrings } from "@/lib/feedback/faces-strings";
import { cn } from "@/lib/utils";

/** From the loved face (5 stars) to the hated one (1), the order they are drawn in. */
const LEVELS: readonly FaceLevel[] = [5, 4, 3, 2, 1];
const MAX_COMMENT_LENGTH = 2000;

/** The words of the card that are the same in every section (see lib/feedback/faces-strings.ts). */
export interface FacesCardCopy {
  /** The five faces' names, from 5 stars (loved) down to 1 (hated). */
  labels: readonly [string, string, string, string, string];
  placeholderPositive: string;
  placeholderNeutral: string;
  placeholderNegative: string;
  send: string;
  notNow: string;
  thanks: string;
}

/**
 * The faces' words in the language the page itself reads in: the learner's own, or while none is
 * chosen yet the browser's (the same one the dictionary resolves to), so the card never mixes two.
 */
export function useFacesStrings(): FacesStrings {
  const { locale, displayLocale } = useLocale();
  return facesStrings(locale ?? displayLocale);
}

/** A whole number from 1 to 5 as a face level, or 0 when it is none of them. */
export function toFaceLevel(value: number): FaceLevel | 0 {
  const level = Math.round(value);
  return level >= 1 && level <= 5 ? (level as FaceLevel) : 0;
}

/**
 * The rating card with five faces, the one look every rating of the app shares (the word rounds', the
 * app's, Passages', Video's, a story's, the Settings one): the face under the pointer lights up and the
 * others lose their colour, and once a face is chosen an optional comment box (and, for a guest who may
 * be answered, an address) and the send button open under it. It is purely controlled: it owns neither
 * the decision to ask nor where the rating goes, only the form. "Not now" (and Escape, and a tap
 * outside) call `onSkip` without sending anything; a send calls `onSend` once, shows the thanks for
 * `thanksMs`, then calls `onDone`. The form starts afresh every time it opens. The card is portalled
 * to the body: a finish page animates its children, and a transformed ancestor would pin the card's
 * `fixed` box to itself instead of the screen.
 */
export function FacesRatingCard({
  open,
  ...rest
}: {
  open: boolean;
  /** The small tag over the card ("New: word rounds"); the card has none when it is absent. */
  tag?: string;
  title: string;
  subtitle: string;
  copy: FacesCardCopy;
  /** The face already chosen when the card opens, for a caller that took the first tap itself (a story's row of faces). */
  initialLevel?: FaceLevel | 0;
  /** A guest is asked for an address to be answered at, under the comment box; a member is not, so a caller passes this only for a guest. */
  emailPlaceholder?: string;
  /** How long the thanks stays before `onDone`. */
  thanksMs?: number;
  /** The rating (1 to 5) was sent, with what the learner wrote; the address is empty unless one was asked for. */
  onSend: (level: FaceLevel, comment: string, email: string) => void;
  /** "Not now": closed without a rating. */
  onSkip: () => void;
  /** The thanks has been shown: close the card. */
  onDone: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;
  return createPortal(<FacesRatingBody {...rest} />, document.body);
}

function FacesRatingBody({
  tag,
  title,
  subtitle,
  copy,
  initialLevel = 0,
  emailPlaceholder,
  thanksMs = 1300,
  onSend,
  onSkip,
  onDone,
}: Omit<Parameters<typeof FacesRatingCard>[0], "open">) {
  const reducedMotion = useReducedMotion() ?? false;
  const [hover, setHover] = useState<FaceLevel | 0>(0);
  const [chosen, setChosen] = useState<FaceLevel | 0>(initialLevel);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const lit = hover || chosen;

  const send = useCallback(() => {
    if (!chosen || sent) return;
    setSent(true);
    onSend(chosen, comment.trim(), email.trim());
    window.setTimeout(onDone, thanksMs);
  }, [chosen, comment, email, onDone, onSend, sent, thanksMs]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !sent) onSkip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip, sent]);

  const placeholder =
    chosen >= 4
      ? copy.placeholderPositive
      : chosen === 3
        ? copy.placeholderNeutral
        : copy.placeholderNegative;

  const fieldClass =
    "border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 block w-full rounded-xl border p-4 text-base outline-none";

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !sent) onSkip();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="border-border bg-card max-h-[calc(100dvh-2rem)] w-full max-w-[600px] overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:p-8"
      >
        {sent ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
            <RatingFace level={(chosen || 4) as FaceLevel} className="size-20" />
            <p className="text-foreground text-2xl font-semibold" dir="auto">
              {copy.thanks}
            </p>
          </div>
        ) : (
          <>
            {tag && (
              <div className="flex justify-end">
                <span
                  className="bg-foreground text-background rounded-md px-3 py-1 text-[13px] font-bold"
                  dir="auto"
                >
                  {tag}
                </span>
              </div>
            )}
            <h2
              className={cn(
                "text-foreground text-[clamp(1.6rem,1.3rem+1.2vw,2rem)] leading-tight font-bold",
                tag && "mt-5",
              )}
              dir="auto"
            >
              {title}
            </h2>
            <p className="text-muted-foreground mt-2 text-base" dir="auto">
              {subtitle}
            </p>

            <div
              className="mt-8 flex items-start justify-between gap-1 sm:gap-3"
              dir="rtl"
              onMouseLeave={() => setHover(0)}
            >
              {LEVELS.map((level, index) => {
                const isLit = lit === level;
                const dimmed = lit !== 0 && !isLit;
                return (
                  <button
                    key={level}
                    type="button"
                    onMouseEnter={() => setHover(level)}
                    onFocus={() => setHover(level)}
                    onBlur={() => setHover(0)}
                    onClick={() => setChosen(level)}
                    aria-pressed={chosen === level}
                    className="group focus-visible:ring-ring flex flex-1 flex-col items-center gap-3 rounded-xl py-1 outline-none focus-visible:ring-2"
                  >
                    <RatingFace
                      level={level}
                      className={cn(
                        "size-[58px] transition-all duration-200 ease-out motion-reduce:transition-none sm:size-[72px]",
                        isLit && "scale-110 drop-shadow-[0_6px_14px_rgba(255,160,60,0.35)]",
                        dimmed && "opacity-45 grayscale",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm transition-colors duration-200",
                        isLit ? "text-foreground font-bold" : "text-muted-foreground",
                      )}
                      dir="auto"
                    >
                      {copy.labels[index]}
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence initial={false}>
              {chosen !== 0 && (
                <motion.div
                  key="comment"
                  initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={comment}
                    onChange={(event) =>
                      setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))
                    }
                    placeholder={placeholder}
                    rows={4}
                    dir="auto"
                    className={cn(fieldClass, "mt-7 min-h-[120px] resize-none")}
                  />
                  {emailPlaceholder && (
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      dir="ltr"
                      maxLength={254}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={emailPlaceholder}
                      className={cn(fieldClass, "mt-3")}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className={cn("mt-6 flex items-center gap-4", chosen !== 0 && "flex-row-reverse")}>
              {chosen !== 0 && (
                <button
                  type="button"
                  onClick={send}
                  className="bg-foreground text-background hover:bg-foreground/90 h-14 flex-1 rounded-xl text-lg font-semibold transition-colors"
                >
                  <span dir="auto">{copy.send}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground px-2 py-2 text-base transition-colors"
              >
                <span dir="auto">{copy.notNow}</span>
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
