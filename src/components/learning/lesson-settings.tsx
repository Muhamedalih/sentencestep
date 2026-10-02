"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Keyboard,
  KeyboardOff,
  Loader2,
  Rabbit,
  Settings,
  Snail,
  Turtle,
  Volume2,
} from "lucide-react";

import {
  PronunciationButton,
  type PronunciationButtonHandle,
  type PronunciationButtonProps,
  type PronunciationStatus,
} from "@/components/learning/pronunciation-button";
import {
  PRONUNCIATION_SPEED_STEPS,
  usePronunciationSettings,
} from "@/components/providers/pronunciation-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useKeySoundMuted } from "@/hooks/use-key-sound-muted";
import { cn } from "@/lib/utils";

const SPEED_ICONS = [Rabbit, Turtle, Snail];

/**
 * The one control a lesson shows for everything about sound, in place of the
 * three separate buttons it used to (typing-sound mute, voice speed, replay):
 * a single settings button that opens a small panel, one row per option, each
 * with a title and a one-line explanation —
 *
 *  - Voice speed: Normal / Slow / Very slow (PronunciationSettingsProvider;
 *    a change replays the sentence at the new speed right away).
 *  - Replay the audio: plays the sentence again (and says the Shift shortcut
 *    does the same, wherever that shortcut is wired up).
 *  - Typing sounds: an on/off switch for the per-keystroke click
 *    (useKeySoundMuted), same as the old keyboard button.
 *
 * Rows whose feature isn't available are left out rather than shown dead:
 * speed outside a PronunciationSettingsProvider (the Admin content preview),
 * typing sounds when the admin has keystroke sounds off or at volume 0, replay
 * when the sentence has no audio source at all. With no row left the button
 * itself is not drawn.
 *
 * It also owns the lesson's PronunciationButton — mounted `headless`, so the
 * sentence still auto-plays, still registers for the Shift shortcut and for
 * the speed-change replay, but the visible speaker button is gone. Its
 * status feeds the settings button (a small pulse while audio plays) and the
 * replay row (spinner/pulse).
 *
 * Pressing anything here must not leave the learner having to click the
 * sentence again to keep typing, so mouse presses never take focus from the
 * typing input (the same approach every control beside the sentence already
 * used) — a learner can change a setting and carry on typing with the panel
 * still open. The panel closes on Escape, on a press outside it, or when the
 * button is pressed again. Opened from the keyboard, focus moves into the
 * panel instead, and Escape hands it back to the button.
 */
export const LessonSettings = forwardRef<
  PronunciationButtonHandle,
  Omit<PronunciationButtonProps, "className" | "label" | "variant" | "size" | "headless"> & {
    className?: string;
  }
>(function LessonSettings({ inputRef, className, ...pronunciation }, ref) {
  const { t, dir } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;
  const { isActive, speedIndex, setSpeed } = usePronunciationSettings();
  const soundSettings = useTypingSoundSettings();
  const { muted, toggle: toggleMuted } = useKeySoundMuted();

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PronunciationStatus>({
    supported: true,
    loading: false,
    playing: false,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pronunciationRef = useRef<PronunciationButtonHandle>(null);
  // The same handle the visible PronunciationButton used to expose (see
  // Dictation's stop-on-type and replay-on-retry), passed straight through.
  useImperativeHandle(
    ref,
    () => ({
      stop: () => pronunciationRef.current?.stop(),
      replay: () => pronunciationRef.current?.replay(),
    }),
    [],
  );

  const showSpeed = isActive;
  const showReplay = status.supported;
  const showKeySounds = soundSettings.enabled && soundSettings.volume > 0;
  const hasAnyRow = showSpeed || showReplay || showKeySounds;
  const audioBusy = status.loading || status.playing;

  // Closes on a press anywhere outside, and on Escape. Escape is only
  // consumed while the panel is open, so it never interferes with anything
  // else when it isn't.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      if (panelRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
      else inputRef?.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, inputRef]);

  // Keeps DOM focus where it is on a mouse press (the typing input), see the
  // doc comment above. Keyboard focus (Tab) is unaffected.
  function keepInputFocus(event: MouseEvent) {
    event.preventDefault();
  }

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    const opening = !isOpen;
    setIsOpen(opening);
    // detail is 0 for a click made from the keyboard (Enter/Space): that
    // learner is heading into the panel, not back to typing.
    const fromKeyboard = event.detail === 0;
    if (opening && fromKeyboard) {
      window.requestAnimationFrame(() => panelRef.current?.querySelector("button")?.focus());
    } else {
      inputRef?.current?.focus();
    }
  }

  function handleReplay() {
    pronunciationRef.current?.replay();
    inputRef?.current?.focus();
  }

  function handleSpeed(index: number) {
    setSpeed(index);
    inputRef?.current?.focus();
  }

  function handleKeySounds() {
    toggleMuted();
    inputRef?.current?.focus();
  }

  const SpeedIcon = SPEED_ICONS[speedIndex] ?? Rabbit;
  const speedLabels = [t.pronunciation.normalSpeed, t.pronunciation.slow, t.pronunciation.verySlow];

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <PronunciationButton
        {...pronunciation}
        ref={pronunciationRef}
        inputRef={inputRef}
        headless
        onStatusChange={setStatus}
      />

      {hasAnyRow && (
        <button
          ref={triggerRef}
          type="button"
          onMouseDown={keepInputFocus}
          onClick={handleToggle}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={t.lessonSettings.buttonLabel}
          title={t.lessonSettings.buttonLabel}
          className={cn(
            "border-border/60 bg-background/85 text-muted-foreground relative flex size-9 shrink-0 items-center justify-center rounded-lg border shadow-sm backdrop-blur-md",
            "transition-[transform,box-shadow,border-color,color] duration-200 ease-out",
            "hover:border-border hover:text-foreground hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]",
            "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isOpen && "border-[var(--lesson-primary)]/60 text-[var(--lesson-icon)]",
          )}
        >
          <Settings
            className={cn(
              "size-[18px] transition-transform duration-300 ease-out",
              isOpen && "rotate-45",
            )}
            aria-hidden="true"
          />
          {/* The old speaker button's "something is playing" cue, kept as a
              small corner dot now that the speaker itself lives in the panel. */}
          {audioBusy && (
            <span aria-hidden="true" className="absolute -end-1 -top-1 flex size-2.5">
              <span
                className={cn(
                  "absolute inline-flex size-full rounded-full bg-[var(--lesson-primary)] opacity-60",
                  !reducedMotion && "animate-ping",
                )}
              />
              <span className="relative inline-flex size-2.5 rounded-full bg-[var(--lesson-primary)]" />
            </span>
          )}
        </button>
      )}

      <AnimatePresence>
        {isOpen && hasAnyRow && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label={t.lessonSettings.title}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onMouseDown={keepInputFocus}
            // A fixed width capped to the viewport; anchored to the button's
            // right edge and growing leftward, where there is always room
            // (the controls sit at the right end of the sentence column).
            className="border-border bg-card text-card-foreground absolute top-full right-0 z-50 mt-2 w-[21rem] max-w-[calc(100vw-1.5rem)] origin-top-right rounded-2xl border p-1.5 shadow-2xl"
          >
            <div dir={dir}>
              <p className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-semibold tracking-wide uppercase">
                {t.lessonSettings.title}
              </p>

              <div className="divide-border/60 flex flex-col divide-y">
                {showSpeed && (
                  <SettingRow
                    icon={<SpeedIcon className="size-[18px]" aria-hidden="true" />}
                    title={t.lessonSettings.speedTitle}
                    description={t.lessonSettings.speedDescription}
                  >
                    <div
                      role="radiogroup"
                      aria-label={t.lessonSettings.speedTitle}
                      className="bg-muted/60 mt-3 grid grid-cols-3 gap-1 rounded-xl p-1"
                    >
                      {PRONUNCIATION_SPEED_STEPS.map((step, index) => {
                        const Icon = SPEED_ICONS[index] ?? Rabbit;
                        const selected = index === speedIndex;
                        return (
                          <button
                            key={step.key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => handleSpeed(index)}
                            className={cn(
                              "focus-visible:ring-ring flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
                              selected
                                ? "bg-card text-foreground shadow-sm ring-1 ring-[var(--lesson-primary)]/40"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-4",
                                selected ? "text-[var(--lesson-icon)]" : undefined,
                              )}
                              aria-hidden="true"
                            />
                            <span className="max-w-full truncate" dir={dir}>
                              {speedLabels[index]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </SettingRow>
                )}

                {showReplay && (
                  <SettingRow
                    icon={<Volume2 className="size-[18px]" aria-hidden="true" />}
                    title={t.lessonSettings.replayTitle}
                    description={
                      isActive
                        ? t.lessonSettings.replayDescriptionShift
                        : t.lessonSettings.replayDescription
                    }
                    action={
                      <button
                        type="button"
                        onClick={handleReplay}
                        disabled={status.loading}
                        className="focus-visible:ring-ring flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--lesson-secondary)] px-3 text-sm font-semibold text-[var(--lesson-icon)] transition-[transform,opacity] outline-none hover:opacity-90 focus-visible:ring-2 active:scale-[0.96] disabled:opacity-60"
                      >
                        {status.loading ? (
                          <Loader2
                            className={cn("size-4", !reducedMotion && "animate-spin")}
                            aria-hidden="true"
                          />
                        ) : (
                          <Volume2
                            className={cn(
                              "size-4",
                              status.playing && !reducedMotion && "animate-pulse",
                            )}
                            aria-hidden="true"
                          />
                        )}
                        {t.lessonSettings.replayAction}
                      </button>
                    }
                  />
                )}

                {showKeySounds && (
                  <SettingRow
                    icon={
                      muted ? (
                        <KeyboardOff className="size-[18px]" aria-hidden="true" />
                      ) : (
                        <Keyboard className="size-[18px]" aria-hidden="true" />
                      )
                    }
                    title={t.lessonSettings.keySoundsTitle}
                    description={t.lessonSettings.keySoundsDescription}
                    action={
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!muted}
                        aria-label={t.lessonSettings.keySoundsTitle}
                        onClick={handleKeySounds}
                        className={cn(
                          "focus-visible:ring-ring relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2",
                          muted ? "bg-foreground/25" : "bg-[var(--lesson-primary)]",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-200",
                            muted ? "left-0.5" : "left-[22px]",
                          )}
                        />
                      </button>
                    }
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/** One row of the panel: a round icon, a title with its one-line explanation, and (optionally) a control at the end — or, for a row that needs more room, `children` beneath the text. */
function SettingRow({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--lesson-secondary)] text-[var(--lesson-icon)]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm leading-tight font-semibold">{title}</p>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
