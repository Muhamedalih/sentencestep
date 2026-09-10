"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  generateBookVoice,
  generateLessonVoice,
  setContentVoiceOverride,
} from "@/lib/admin/voice-generation-actions";
import { getStoryCharacterGenderLabelAr } from "@/lib/admin/story-character-gender";
import type { VoiceDashboardRow as VoiceDashboardRowData } from "@/lib/admin/voice-generation-queries";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { cn } from "@/lib/utils";

/**
 * One row of the unified Stories+Conversations+Normal+Books narration
 * dashboard — interactive (voice picker, per-row Generate button), so this
 * is a client component even though the page around it is a Server
 * Component. Story, Conversation, and Normal rows (all three are `lessons`)
 * link to their per-sentence detail page
 * (src/app/admin/voice/content/[lessonId]), which works for any mode since
 * getLessonVoiceStatus/generateLessonVoice don't care which; Book rows have
 * no per-sentence detail view yet, so the title links to the book's editor
 * instead, and every action here is inline.
 *
 * `voices` is ElevenLabs' own registered voices for Story/Book rows, or
 * Cartesia's own voices for Normal rows (see the page's own filtering —
 * Normal lessons always resolve and generate through Cartesia,
 * Stories/Books always through ElevenLabs, fixed assignments per
 * content-provider-map.ts) — the per-row picker that lets an admin choose
 * a specific narration voice for just this Story, Normal lesson, or Book
 * instead of only ever getting the one global default (see setContentVoiceOverride's
 * doc comment). For a Normal lesson this is also what makes the generated
 * audio audible to a learner at all: voice-audio.ts's
 * resolvePronunciationAudioAction reads this exact same lessons.voice_id
 * for playback, so picking a voice here and generating is a one-step
 * "narrate this lesson" action, not just a background pre-fetch. Never
 * rendered for "conversation" rows, which have no single-voice concept.
 */
export function VoiceDashboardRow({
  row,
  voices,
}: {
  row: VoiceDashboardRowData;
  voices: VoiceRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const complete = row.totalSentences > 0 && row.readyCount === row.totalSentences;

  function handleGenerate() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result =
          row.contentType === "book"
            ? await generateBookVoice(row.id)
            : await generateLessonVoice(row.id);
        setMessage(result.error ?? result.success ?? null);
      } catch {
        // A network/platform hiccup (timeout, dropped connection) throws
        // out of the Server Action call itself rather than returning a
        // normal ActionResult — see voice-bulk-generate-control.tsx's own
        // try/catch for the same reasoning. Uncaught here it crashes this
        // whole page to the nearest error boundary; caught, it's just an
        // inline message, and it's always safe to click Generate again.
        setMessage("Couldn't reach the server. Safe to try again.");
      }
    });
  }

  function handleVoiceChange(voiceId: string) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setContentVoiceOverride(row.contentType, row.id, voiceId || null);
        setMessage(result.error ?? result.success ?? null);
      } catch {
        setMessage("Couldn't reach the server. Safe to try again.");
      }
    });
  }

  const titleHref =
    row.contentType === "book" ? `/admin/library/${row.id}/edit` : `/admin/voice/content/${row.id}`;
  const characterGenderLabel =
    row.contentType === "story" ? getStoryCharacterGenderLabelAr(row.id) : null;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <Link href={titleHref} className="truncate text-sm font-medium hover:underline">
          {row.title}
        </Link>
        <span className="text-muted-foreground shrink-0 text-xs capitalize">{row.contentType}</span>
        {characterGenderLabel && (
          <Badge variant="muted" className="shrink-0" title="Speaking character's gender">
            {characterGenderLabel}
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge variant={complete ? "success" : "outline"}>
          {row.readyCount}/{row.totalSentences} ready
        </Badge>
        {row.failedCount > 0 && (
          <Badge variant="outline" className="text-danger border-danger/40">
            {row.failedCount} failed
          </Badge>
        )}
        {row.unresolvedCount > 0 && (
          <Badge variant="outline">{row.unresolvedCount} unresolved</Badge>
        )}
        {row.contentType !== "conversation" && (
          <select
            value={row.voiceId ?? ""}
            onChange={(e) => handleVoiceChange(e.target.value)}
            disabled={isPending}
            aria-label={`Narration voice for ${row.title}`}
            className="border-input bg-background rounded-md border px-2 py-1 text-xs disabled:opacity-50"
          >
            <option value="">Default voice</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium",
            "border-input hover:bg-muted disabled:opacity-50",
          )}
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Generate"}
        </button>
        {message && <span className="text-muted-foreground text-xs">{message}</span>}
      </div>
    </div>
  );
}
