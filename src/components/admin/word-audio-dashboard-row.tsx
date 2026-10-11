"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  generateWordGroupVoiceAction,
  getWordGroupAudioStatusAction,
  setWordGroupVoiceAction,
  type WordAudioActionResult,
} from "@/lib/admin/word-audio-actions";
import type { WordAudioDashboardRow as WordAudioDashboardRowData } from "@/lib/admin/word-audio-queries";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { cn } from "@/lib/utils";

const VOICE_SOURCE_LABELS: Record<string, string> = {
  "edge-tts": "Edge-TTS (free)",
  "fish-audio": "Fish Audio",
};

/** A row keeps asking for fresh counts every few seconds while a background generation finishes, then gives up (the page can always be reloaded, and the scheduled sweep finishes whatever is left). */
const POLL_INTERVAL_MS = 6_000;
const MAX_POLLS = 12;
/** One Generate click works through a whole group by itself: it repeats rounds until the group is complete, a round makes no progress, or this many rounds have run. */
const MAX_GENERATE_ROUNDS = 8;

type Counts = { ready: number; total: number; failed: number };

/**
 * One row of the Word audio status dashboard — the Word Lists counterpart to
 * VoiceDashboardRow (Stories): the group's audio completeness, a "Narration
 * voice" picker (Edge-TTS and Fish Audio voices), and a Generate button.
 * Interactive, so a client component even though the page around it is a
 * Server Component. Unlike the Story rows, the counts update in place (every
 * action returns a fresh status), so changing a voice or generating never
 * reloads the whole dashboard.
 */
export function WordAudioDashboardRow({
  row,
  voices,
  defaultVoiceName,
}: {
  row: WordAudioDashboardRowData;
  voices: VoiceRow[];
  defaultVoiceName: string;
}) {
  const [voiceId, setVoiceId] = useState(row.voiceId ?? "");
  const [counts, setCounts] = useState<Counts>({
    ready: row.ready,
    total: row.total,
    failed: row.failed,
  });
  const [busy, setBusy] = useState<"saving" | "generating" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const complete = counts.total > 0 && counts.ready >= counts.total;

  useEffect(() => {
    if (!polling) return;
    let polls = 0;
    let stopped = false;
    const timer = setInterval(async () => {
      if (stopped) return;
      polls += 1;
      try {
        const result = await getWordGroupAudioStatusAction(row.id);
        if (stopped) return;
        const status = result.status;
        if (status) setCounts({ ready: status.ready, total: status.total, failed: status.failed });
        if (!status || status.ready >= status.total || polls >= MAX_POLLS) setPolling(false);
      } catch {
        setPolling(false);
      }
    }, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [polling, row.id]);

  function applyStatus(result: WordAudioActionResult): Counts | null {
    const status = result.status;
    if (!status) return null;
    const next = { ready: status.ready, total: status.total, failed: status.failed };
    setCounts(next);
    return next;
  }

  async function handleVoiceChange(next: string) {
    const previous = voiceId;
    setMessage(null);
    setBusy("saving");
    try {
      const result = await setWordGroupVoiceAction(row.id, next || null);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setVoiceId(next);
      const nextCounts = applyStatus(result);
      setMessage(result.success ?? null);
      setPolling(nextCounts !== null && nextCounts.ready < nextCounts.total);
    } catch {
      setVoiceId(previous);
      setMessage("Couldn't reach the server. Safe to try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerate() {
    setMessage(null);
    setPolling(false);
    setBusy("generating");
    try {
      for (let round = 0; round < MAX_GENERATE_ROUNDS; round += 1) {
        const result = await generateWordGroupVoiceAction(row.id);
        const nextCounts = applyStatus(result);
        setMessage(result.error ?? result.success ?? null);
        if (result.error) break;
        if (!nextCounts || nextCounts.ready >= nextCounts.total) break;
        if (!result.generated) break;
      }
    } catch {
      // A dropped connection / platform timeout throws out of the Server
      // Action itself — always safe to click Generate again (see
      // VoiceDashboardRow's identical handling).
      setMessage("Couldn't reach the server. Safe to try again.");
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        {/* prefetch={false}: one Link per group — same reason as VoiceDashboardRow. */}
        <Link
          href={`/admin/word-lists/${row.id}/edit`}
          prefetch={false}
          className="truncate text-sm font-medium hover:underline"
        >
          {row.title}
        </Link>
        {row.status === "draft" && (
          <Badge variant="muted" className="shrink-0">
            draft
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge variant={complete ? "success" : "outline"}>
          {counts.ready}/{counts.total} ready
        </Badge>
        {counts.failed > 0 && (
          <Badge variant="outline" className="text-danger border-danger/40">
            {counts.failed} failed
          </Badge>
        )}
        <select
          value={voiceId}
          onChange={(e) => void handleVoiceChange(e.target.value)}
          disabled={disabled}
          aria-label={`Narration voice for ${row.title}`}
          className="border-input bg-background rounded-md border px-2 py-1 text-xs disabled:opacity-50"
        >
          <option value="">Default voice ({defaultVoiceName})</option>
          {Object.entries(VOICE_SOURCE_LABELS).map(([source, label]) => {
            const group = voices.filter((voice) => voice.source === source);
            if (group.length === 0) return null;
            return (
              <optgroup key={source} label={label}>
                {group.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={disabled}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium",
            "border-input hover:bg-muted disabled:opacity-50",
          )}
        >
          {busy === "generating" || busy === "saving" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "Generate"
          )}
        </button>
        {message && <span className="text-muted-foreground text-xs">{message}</span>}
        {polling && !message && (
          <span className="text-muted-foreground text-xs">Generating in the background…</span>
        )}
      </div>
    </div>
  );
}
