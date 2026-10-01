"use client";

import type { MouseEvent, RefObject } from "react";
import { Keyboard, KeyboardOff } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useKeySoundMuted } from "@/hooks/use-key-sound-muted";
import { cn } from "@/lib/utils";

/**
 * A small switch that mutes the keystroke sound (the click played for every
 * letter, and the thud for a wrong one) — the per-learner counterpart to the
 * admin's global typing-sound setting, drawn beside the pronunciation controls
 * so a learner can keep the voice and silence the keys, e.g. in Dictation.
 * Only the per-key sound is muted: the sentence/lesson completion cues are not
 * keystrokes and keep playing (see useTypingSound). The choice is remembered
 * across lessons (see useKeySoundMuted).
 *
 * Renders nothing when the admin has keystroke sounds off (or at volume 0):
 * there is nothing to mute, and a dead control would only be confusing.
 */
export function KeySoundToggle({
  inputRef,
  className,
}: {
  /** The active typing input — same reason as PronunciationSpeedControl: pressing this must not leave the learner having to click the sentence again to keep typing. */
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  const { t } = useLocale();
  const settings = useTypingSoundSettings();
  const { muted, toggle } = useKeySoundMuted();

  if (!settings.enabled || settings.volume <= 0) return null;

  const label = muted ? t.typing.unmuteKeySounds : t.typing.muteKeySounds;
  const Icon = muted ? KeyboardOff : Keyboard;

  // Stops the browser's native "move focus to the clicked button" default
  // (it runs on mousedown, ahead of click), so focus never leaves the typing
  // input in the first place — the same approach as PronunciationSpeedControl.
  function handleMouseDown(event: MouseEvent) {
    event.preventDefault();
  }

  function handleClick() {
    toggle();
    inputRef?.current?.focus();
  }

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      aria-pressed={muted}
      aria-label={label}
      title={label}
      className={cn(
        "border-border/60 bg-background/85 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-sm backdrop-blur-md",
        "transition-[transform,box-shadow,border-color,color] duration-200 ease-out",
        "hover:border-border hover:text-foreground hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]",
        "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
