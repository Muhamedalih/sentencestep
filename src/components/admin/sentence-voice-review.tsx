"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, RefreshCw, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateLessonVoice, regenerateSentenceVoice } from "@/lib/admin/voice-generation-actions";
import type { SentenceVoiceStatus } from "@/lib/voice/story-voice-generation";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<SentenceVoiceStatus["status"], string> = {
  pending: "Pending",
  generating: "Generating…",
  ready: "Ready",
  failed: "Failed",
  unresolved: "No voice",
};

const STATUS_VARIANT: Record<SentenceVoiceStatus["status"], "success" | "outline" | "muted"> = {
  pending: "muted",
  generating: "outline",
  ready: "success",
  failed: "outline",
  unresolved: "outline",
};

/** Mirrors TranslationFieldReview's shape for the story-audio equivalent: per-sentence status, a Play control for ready rows (audio doesn't need approval the way text does), and a per-sentence Regenerate button. */
export function SentenceVoiceReview({
  lessonId,
  statuses,
  sentenceText,
}: {
  lessonId: string;
  statuses: SentenceVoiceStatus[];
  sentenceText: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingSentenceId, setPendingSentenceId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function handleRegenerateAll() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await generateLessonVoice(lessonId);
        setMessage(
          result.error
            ? { kind: "error", text: result.error }
            : { kind: "success", text: result.success ?? "Done." },
        );
      } catch {
        // A network/platform hiccup throws out of the Server Action call
        // itself rather than returning a normal ActionResult — see
        // voice-bulk-generate-control.tsx's own try/catch for the same
        // reasoning. Uncaught here it crashes this whole page instead of
        // just showing an inline message.
        setMessage({ kind: "error", text: "Couldn't reach the server. Safe to try again." });
      }
    });
  }

  function handleRegenerateOne(sentenceId: string) {
    setMessage(null);
    setPendingSentenceId(sentenceId);
    startTransition(async () => {
      try {
        const result = await regenerateSentenceVoice(lessonId, sentenceId);
        setMessage(
          result.error
            ? { kind: "error", text: result.error }
            : { kind: "success", text: result.success ?? "Done." },
        );
      } catch {
        setMessage({ kind: "error", text: "Couldn't reach the server. Safe to try again." });
      }
      setPendingSentenceId(null);
    });
  }

  function handlePlay(audioUrl: string) {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => {});
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleRegenerateAll} disabled={isPending}>
          {isPending && pendingSentenceId === null ? "Regenerating…" : "Regenerate Story Audio"}
        </Button>
        {message && (
          <p
            role={message.kind === "error" ? "alert" : undefined}
            className={cn(
              "text-sm",
              message.kind === "error" ? "text-danger" : "text-muted-foreground",
            )}
          >
            {message.text}
          </p>
        )}
      </div>
      <Card>
        <CardContent className="flex flex-col divide-y p-0">
          {statuses.map((status) => (
            <div
              key={status.sentenceId}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {sentenceText[status.sentenceId] ?? status.sentenceId}
                </p>
                {status.error && (
                  <p className="text-danger mt-0.5 truncate text-xs">{status.error}</p>
                )}
              </div>
              <Badge variant={STATUS_VARIANT[status.status]}>{STATUS_LABEL[status.status]}</Badge>
              {status.status === "ready" && status.audioUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Play"
                  onClick={() => handlePlay(status.audioUrl!)}
                >
                  <Volume2 className="size-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Regenerate"
                disabled={isPending}
                onClick={() => handleRegenerateOne(status.sentenceId)}
              >
                {isPending && pendingSentenceId === status.sentenceId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
