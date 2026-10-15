"use client";

import type { ReactNode } from "react";
import { Gauge, Headphones, Languages } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { formatPlaybackRate } from "@/lib/passages/prefs";
import { cn } from "@/lib/utils";

/**
 * The reader's three switches, in one small toolbar in the header: listen-only
 * (hides the text so the part has to be understood by ear), the narration speed
 * and the Arabic translation. A switch that is on sits raised in the toolbar,
 * lit with the brand colour; each press has the same sink-and-spring feel as
 * every Passages button. Each one is a per-device preference; on a phone only the
 * icons stay, so the toolbar never crowds the back link.
 */

function ToolbarSwitch({
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
      title={title}
      className={cn(
        "passage-btn focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[0.82rem] font-medium outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 pointer-coarse:h-10",
        active
          ? "bg-background text-primary shadow-[0_1px_2px_rgb(0_0_0/0.28),0_0_0_1px_color-mix(in_oklab,var(--primary)_38%,transparent)]"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] disabled:hover:bg-transparent",
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
    <div className="bg-foreground/[0.06] flex items-center gap-0.5 rounded-2xl p-1">
      <ToolbarSwitch
        active={listenOnly && audioAvailable}
        disabled={!audioAvailable}
        label={t.passages.listenOnly}
        title={audioAvailable ? undefined : t.passages.audioMissing}
        onClick={onToggleListenOnly}
      >
        <Headphones className="size-4" aria-hidden="true" />
        <span className="hidden md:inline">{t.passages.listenOnly}</span>
      </ToolbarSwitch>

      <ToolbarSwitch
        disabled={!audioAvailable}
        label={`${t.passages.speed}: ${formatPlaybackRate(rate)}`}
        onClick={onCycleRate}
      >
        <Gauge className="size-4" aria-hidden="true" />
        <span className="min-w-[2.25rem] text-start tabular-nums" dir="ltr">
          {formatPlaybackRate(rate)}
        </span>
      </ToolbarSwitch>

      {translationAvailable && (
        <ToolbarSwitch
          active={translation}
          label={t.passages.translation}
          onClick={onToggleTranslation}
        >
          <Languages className="size-4" aria-hidden="true" />
          <span className="hidden md:inline">{t.passages.translation}</span>
        </ToolbarSwitch>
      )}
    </div>
  );
}
