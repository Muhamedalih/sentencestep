"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  generateBookVoice,
  generateLessonVoice,
  setContentVoiceOverride,
  setVoiceGenerationExcluded,
} from "@/lib/admin/voice-generation-actions";
import { getStoryCharacterGenderLabelAr } from "@/lib/admin/story-character-gender";
import type { VoiceDashboardRow as VoiceDashboardRowData } from "@/lib/admin/voice-generation-queries";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { cn } from "@/lib/utils";

/**
 * One row of the unified Stories+Conversations+Normal+Books narration
 * dashboard — interactive (exclude toggle, per-row Generate button), so
 * this is a client component even though the page around it is a Server
 * Component. Story, Conversation, and Normal rows (all three are `lessons`)
 * link to their per-sentence detail page
 * (src/app/admin/voice/content/[lessonId]), which works for any mode since
 * getLessonVoiceStatus/generateLessonVoice don't care which; Book rows have
 * no per-sentence detail view yet, so the title links to the book's editor
 * instead, and every action here is inline.
 *
 * `voices` is ElevenLabs' own registered voices for Story/Book rows, or
 * Hume's own voices for Normal rows (see the page's own filtering — Normal
 * lessons always resolve and generate through Hume AI, Stories/Books always
 * through ElevenLabs, fixed assignments per content-provider-map.ts) — the
 * per-row picker that lets an admin choose
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
      const result =
        row.contentType === "book"
          ? await generateBookVoice(row.id)
          : await generateLessonVoice(row.id);
      setMessage(result.error ?? result.success ?? null);
    });
  }

  function handleToggleExcluded() {
    setMessage(null);
    startTransition(async () => {
      await setVoiceGenerationExcluded(row.contentType, row.id, !row.excluded);
    });
  }

  function handleVoiceChange(voiceId: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await setContentVoiceOverride(row.contentType, row.id, voiceId || null);
      setMessage(result.error ?? result.success ?? null);
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
        {row.excluded && (
          <Badge variant="outline" className="shrink-0">
            excluded
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
        <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={row.excluded}
            onChange={handleToggleExcluded}
            disabled={isPending}
            className="accent-primary"
          />
          Exclude
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || row.excluded}
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
