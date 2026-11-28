"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import styles from "@/components/passages/series-stage.module.css";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import type { GuessOption, SeriesGuess } from "@/data/passages/series-guesses";
import { countdown, readGuess, writeGuess } from "@/lib/passages/series-guess";
import { todayLocalISODate } from "@/lib/progress/streak";
import { setSeriesReminderAction } from "@/lib/passages/series-guess-actions";
import { guessStrings } from "@/lib/passages/series-guess-strings";
import { REMINDER_HOURS, reminderTimeFor } from "@/lib/session-end/reminder";
import { cn } from "@/lib/utils";

/**
 * «What happens next?» (permission seriesGuess): the night stage at the end of a series episode.
 * The question over the red book; the chosen guess goes straight into an envelope and is sealed;
 * then the wait: the countdown to midnight, a line of the next episode with its answer hidden, and
 * the shop's bell for a reminder. SeriesReveal is the other end: the next episode opening the guess.
 */

export interface SeasonPlace {
  title: string;
  /** Episodes finished or being read. */
  number: number;
  total: number;
}

// --- Sounds, made in the browser -------------------------------------------

function useStageSounds() {
  const enabled = useTypingSoundSettings().enabled;
  const context = useRef<AudioContext | null>(null);
  const tone = useCallback(
    (frequency: number, seconds: number, volume: number, type: OscillatorType, when: number) => {
      if (!enabled) return;
      try {
        const audio = (context.current ??= new AudioContext());
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + when;
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + seconds);
      } catch {
        // No sound in this browser: the stage plays on.
      }
    },
    [enabled],
  );
  useEffect(() => () => void context.current?.close().catch(() => {}), []);
  return {
    thump: useCallback(
      (when = 0) => {
        tone(90, 0.35, 0.3, "sine", when);
        tone(55, 0.5, 0.25, "sine", when);
      },
      [tone],
    ),
    bell: useCallback(() => {
      for (const when of [0, 0.16]) {
        [1568, 2093, 3136].forEach((f, i) => tone(f, 1.3 - i * 0.3, 0.09 / (i + 1), "sine", when));
      }
    }, [tone]),
  };
}

// --- Shared pieces ----------------------------------------------------------

function Overlay({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [dust] = useState(() =>
    Array.from({ length: 26 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${20 + Math.random() * 80}%`,
      animationDuration: `${6 + Math.random() * 9}s`,
      animationDelay: `-${Math.random() * 9}s`,
    })),
  );
  useEffect(() => {
    setMounted(true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;
  // On the body: the reader's own moving panels would otherwise hold a "fixed" layer inside them.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={label} className={styles.overlay} dir="ltr">
      <div className={styles.dust} aria-hidden="true">
        {dust.map((style, index) => (
          <i key={index} style={style} />
        ))}
      </div>
      <div className={styles.stage}>{children}</div>
    </div>,
    document.body,
  );
}

function Season({ place }: { place: SeasonPlace }) {
  return (
    <div className={styles.season}>
      {Array.from({ length: place.total }, (_, index) => (
        <b
          key={index}
          aria-hidden="true"
          className={cn(
            index < place.number && styles.done,
            index === place.number && styles.coming,
          )}
        />
      ))}
      <span>
        {place.title} · {place.number} / {place.total}
      </span>
    </div>
  );
}

function Support({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn(styles.support, className)} dir="auto">
      {children}
    </span>
  );
}

function Book({ open }: { open?: boolean }) {
  return (
    <div className={cn(styles.book, open && styles.open)} aria-hidden="true">
      <div className={styles.halo} />
      <div className={styles.pages} />
      <div className={styles.cover}>
        <em>?</em>
      </div>
    </div>
  );
}

function BellArt() {
  return (
    <svg viewBox="0 0 54 56" aria-hidden="true">
      <path
        d="M27 3c3 0 4 2 4 4 10 3 13 12 13 22 0 9 4 12 7 15H3c3-3 7-6 7-15 0-10 3-19 13-22 0-2 1-4 4-4z"
        fill="#c9cbe0"
      />
      <path
        d="M17 14c-3 5-4 10-4 18"
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity=".7"
      />
      <circle cx="27" cy="50" r="5" fill="#9d2f42" />
    </svg>
  );
}

// --- The guess --------------------------------------------------------------

type Scene = "ask" | "sealed" | "wait";

export function SeriesGuessStage({
  userId,
  guess,
  place,
  question,
  questionSupport,
  tomorrow,
  canRemind,
  reminderSubject,
  closeLabel,
  onClose,
  onOpenNext,
  waitOnly,
}: {
  userId: string;
  guess: SeriesGuess;
  place: SeasonPlace;
  question: string;
  /** The question in the learner's language; null for an English interface. */
  questionSupport: string | null;
  /** The next episode opens at midnight (it is open at once when this one was finished earlier). */
  tomorrow: boolean;
  canRemind: boolean;
  /** What the reminder email's subject will say. */
  reminderSubject: string;
  closeLabel: string;
  onClose: () => void;
  onOpenNext: () => void;
  /** The closed episode's own screen: only the wait, with nothing to guess. */
  waitOnly?: boolean;
}) {
  const { locale } = useLocale();
  const strings = guessStrings(locale);
  const sounds = useStageSounds();
  const [scene, setScene] = useState<Scene>(() =>
    waitOnly || readGuess(userId, guess.after) ? "wait" : "ask",
  );
  const [picked, setPicked] = useState<GuessOption | null>(null);
  const timers = useRef<number[]>([]);
  const later = useCallback((run: () => void, ms: number) => {
    timers.current.push(window.setTimeout(run, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  /** Choosing is the whole move: the answer is kept at once and goes into the envelope. */
  const pick = (option: GuessOption) => {
    if (picked) return;
    setPicked(option);
    writeGuess(userId, guess.after, {
      word: option.word,
      lead: option.lead,
      sealedAt: new Date().toISOString(),
      revealed: false,
    });
    sounds.thump();
    later(() => {
      setScene("sealed");
      // The seal lands when the flap has closed.
      sounds.thump(2.2);
    }, 900);
    later(() => setScene("wait"), 4900);
  };

  return (
    <Overlay label={question} onClose={onClose}>
      <Season place={place} />

      {scene === "ask" && (
        <>
          <h1 className={styles.title}>
            {question}
            {questionSupport && <Support>{questionSupport}</Support>}
          </h1>
          <Book open={picked !== null} />
          <div className={styles.guesses}>
            {guess.options.map((option, index) => (
              <button
                key={option.word}
                type="button"
                className={styles.guess}
                style={{ animationDelay: `${0.5 + index * 0.18}s` }}
                onClick={() => pick(option)}
              >
                {option.label}
                {locale && <Support>{option.support[locale]}</Support>}
              </button>
            ))}
          </div>
        </>
      )}

      {scene === "sealed" && picked && (
        <>
          <div className={styles.envelope} aria-hidden="true">
            <div className={styles.sheet}>
              <b>{picked.label}</b>
            </div>
            <div className={styles.pocket} />
            <div className={styles.flap} />
            <div className={styles.wax}>?</div>
          </div>
          <h1 className={cn(styles.title, styles.late)}>
            Sealed.
            <Support>{tomorrow ? strings.sealedTomorrow : strings.sealedNext}</Support>
          </h1>
        </>
      )}

      {scene === "wait" && (
        <Wait
          guess={guess}
          tomorrow={tomorrow}
          canRemind={canRemind}
          reminderSubject={reminderSubject}
          closeLabel={closeLabel}
          onClose={onClose}
          onOpenNext={onOpenNext}
          ring={sounds.bell}
        />
      )}
    </Overlay>
  );
}

function Wait({
  guess,
  tomorrow,
  canRemind,
  reminderSubject,
  closeLabel,
  onClose,
  onOpenNext,
  ring,
}: {
  guess: SeriesGuess;
  tomorrow: boolean;
  canRemind: boolean;
  reminderSubject: string;
  closeLabel: string;
  onClose: () => void;
  onOpenNext: () => void;
  ring: () => void;
}) {
  const { locale } = useLocale();
  const strings = guessStrings(locale);
  // Tonight's midnight, fixed once: past it the book is open, not a day away again.
  const [midnight] = useState(() => new Date().setHours(24, 0, 0, 0));
  const [now, setNow] = useState(() => Date.now());
  const [rings, setRings] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const closed = tomorrow && now < midnight;

  useEffect(() => {
    if (!tomorrow) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [tomorrow]);

  const remind = async (chosen: number) => {
    setProblem(null);
    const result = await setSeriesReminderAction(
      guess.next,
      reminderTimeFor(chosen).toISOString(),
    ).catch(() => ({ ok: false as const, reason: "error" as const }));
    if (result.ok) {
      setHour(chosen - 12);
      ring();
    } else {
      setProblem(result.reason === "unverified" ? strings.unverified : strings.failed);
    }
  };

  return (
    <>
      {closed && canRemind && (
        <button
          // Pulled again: the same element swings again.
          key={rings}
          type="button"
          className={cn(styles.bell, rings > 0 && styles.ring)}
          onClick={() => {
            setRings((count) => count + 1);
            setHour(null);
            setProblem(null);
            ring();
          }}
        >
          <i />
          <BellArt />
          <small dir="auto">{hour ? strings.remindShort(hour) : strings.pull}</small>
        </button>
      )}
      <Book />
      {closed ? (
        <>
          <div className={styles.count} role="timer">
            {countdown(midnight, now)}
          </div>
          <Support>{strings.opensIn}</Support>
        </>
      ) : (
        <button type="button" className={styles.link} onClick={onOpenNext}>
          <span dir="auto">{strings.openNow}</span>
        </button>
      )}
      <p className={styles.teaser}>
        “{guess.teaser.before}
        <mark aria-label="hidden word" />
        {guess.teaser.after}”
      </p>
      <Support>{closed ? strings.teaserTomorrow : strings.teaserNext}</Support>
      {closed && rings > 0 && (
        <div className={styles.hours} aria-live="polite">
          {hour ? (
            <p className={styles.said} dir="auto">
              {strings.reminded(hour, reminderSubject)}
            </p>
          ) : (
            <>
              {REMINDER_HOURS.map((chosen) => (
                <button key={chosen} type="button" onClick={() => void remind(chosen)}>
                  {chosen - 12} PM
                </button>
              ))}
              {problem && <Support>{problem}</Support>}
            </>
          )}
        </div>
      )}
      <button type="button" className={styles.link} onClick={onClose}>
        <span dir="auto">{closeLabel}</span>
      </button>
    </>
  );
}

// --- The reveal -------------------------------------------------------------

/** The line with its telling words lit. */
function lit(line: string, words: readonly string[]): ReactNode[] {
  const pattern = new RegExp(`\\b(${words.join("|")})\\b`, "g");
  return line.split(pattern).map((part, index) => (index % 2 ? <b key={index}>{part}</b> : part));
}

export function SeriesReveal({
  guess,
  place,
  written,
  sealedAt,
  line,
  lineSupport,
  onClose,
}: {
  guess: SeriesGuess;
  place: SeasonPlace;
  /** The word the learner wrote after the last episode. */
  written: string;
  /** When it was sealed (ISO). */
  sealedAt: string;
  line: string;
  lineSupport: string | null;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const strings = guessStrings(locale);
  const sounds = useStageSounds();
  const right = written === guess.answer;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const heading =
    sealedAt && todayLocalISODate(new Date(sealedAt)) === todayLocalISODate(yesterday)
      ? strings.youWroteYesterday
      : strings.youWrote;
  const { thump, bell } = sounds;

  useEffect(() => {
    thump();
    if (!right) return;
    const timer = window.setTimeout(bell, 3000);
    return () => window.clearTimeout(timer);
  }, [bell, right, thump]);

  return (
    <Overlay label={heading} onClose={onClose}>
      <Season place={place} />
      <Support>{heading}</Support>
      <div className={styles.yours}>“{written}”</div>
      <p className={styles.truth}>
        {line.split(/(?<=\.)\s+/).map((sentence) => (
          <span key={sentence} className={styles.sentence}>
            {lit(sentence, guess.reveal.light)}
          </span>
        ))}
        {lineSupport && <Support>{lineSupport}</Support>}
      </p>
      <div className={styles.verdict}>
        {right ? "✓ You knew it." : "The story fooled you."}
        {locale && <Support>{right ? strings.knew : strings.fooled}</Support>}
      </div>
      <button type="button" autoFocus className={styles.link} onClick={onClose}>
        {locale ? (
          <>
            Continue · <span dir="auto">{strings.continueEpisode}</span>
          </>
        ) : (
          strings.continueEpisode
        )}
      </button>
    </Overlay>
  );
}
