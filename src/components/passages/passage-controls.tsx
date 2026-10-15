"use client";

import type { ReactNode } from "react";
import { Gauge, Headphones, Languages } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { formatPlaybackRate } from "@/lib/passages/prefs";
import { cn } from "@/lib/utils";

/**
 * The reader's three switches, in the header: listen-only (hides the text so the
 * part has to be understood by ear), the narration speed, and the Arabic
 * translation. Each one is a per-device preference; on a phone only the icons
 * stay, so the row never crowds the back link.
 */

function ControlButton({
  active = false,
  disabled = false,
  label,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      title={title ?? label}
      className={cn(
        "focus-visible:ring-ring flex h-9 items-center gap-2 rounded-lg border px-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 pointer-coarse:h-11",
        active
          ? "border-primary/40 bg-brand-muted text-primary"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

export function PassageControls({
  audioAvailable,
  listenOnly,
  onToggleListenOnly,
  rate,
  onCycleRate,
  translationAvailable,
  translation,
  onToggleTranslation,
}: {
  /** The current part has a clip for every sentence. */
  audioAvailable: boolean;
  listenOnly: boolean;
  onToggleListenOnly: () => void;
  rate: number;
  onCycleRate: () => void;
  translationAvailable: boolean;
  translation: boolean;
  onToggleTranslation: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <ControlButton
        active={listenOnly && audioAvailable}
        disabled={!audioAvailable}
        label={t.passages.listenOnly}
        title={audioAvailable ? t.passages.listenOnly : t.passages.audioMissing}
        onClick={onToggleListenOnly}
      >
        <Headphones className="size-4" aria-hidden="true" />
        <span className="hidden md:inline">{t.passages.listenOnly}</span>
      </ControlButton>

      <ControlButton
        disabled={!audioAvailable}
        label={`${t.passages.speed}: ${formatPlaybackRate(rate)}`}
        onClick={onCycleRate}
      >
        <Gauge className="size-4" aria-hidden="true" />
        <span className="min-w-[2.25rem] text-start tabular-nums" dir="ltr">
          {formatPlaybackRate(rate)}
        </span>
      </ControlButton>

      {translationAvailable && (
        <ControlButton
          active={translation}
          label={t.passages.translation}
          onClick={onToggleTranslation}
        >
          <Languages className="size-4" aria-hidden="true" />
          <span className="hidden md:inline">{t.passages.translation}</span>
        </ControlButton>
      )}
    </div>
  );
}
