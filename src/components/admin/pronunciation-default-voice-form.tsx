"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { previewCartesiaAction } from "@/lib/admin/cartesia-actions";
import { setDefaultPronunciationVoiceAction } from "@/lib/admin/voices-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { DEFAULT_CARTESIA_MODEL } from "@/lib/voice/content-provider-map";
import { dataUriToBlobUrl } from "@/lib/audio-preview";
import { cn } from "@/lib/utils";

const PREVIEW_TEXT = "The old house creaked softly as the wind picked up outside.";

/**
 * The one setting this form exists for: tts_settings.default_pronunciation_voice_id
 * — the voice every Word List falls back to when it has no per-group
 * override (see getDefaultPronunciationVoiceId). Deliberately separate from
 * VoiceCollections' "Set as Stories default" button
 * (tts_settings.default_voice_id), NormalLessonDefaultVoiceForm's own
 * setting (tts_settings.default_normal_lesson_voice_id), and
 * ElevenLabsSettingsForm's "Default narration voice (Stories & Books)"
 * (elevenlabs_settings.default_story_voice_id) — picking a voice here can
 * never affect Stories, Conversation, Books, or Normal lessons. Only lists
 * Cartesia voices: Word Lists' generation pipeline always uses Cartesia
 * specifically (see word-list-voice-generation.ts's own doc comment and
 * content-provider-map.ts), so any other source would just fail to
 * resolve.
 */
export function PronunciationDefaultVoiceForm({
  voices,
  currentVoiceId,
}: {
  voices: VoiceRow[];
  currentVoiceId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState(currentVoiceId);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const current = voices.find((v) => v.id === selected);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await setDefaultPronunciationVoiceAction(selected);
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Saved." },
      );
    });
  }

  function handlePreview() {
    if (!current) return;
    setMessage(null);
    setPreviewAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setIsPreviewing(true);
    startTransition(async () => {
      const result = await previewCartesiaAction({
        text: PREVIEW_TEXT,
        providerVoiceId: current.providerVoiceId,
        model: DEFAULT_CARTESIA_MODEL,
      });
      setIsPreviewing(false);
      if (result.error || !result.audioDataUri) {
        setMessage({ kind: "error", text: result.error ?? "Preview failed." });
        return;
      }
      // Converted to a Blob URL — see dataUriToBlobUrl's own doc comment
      // for why a raw inline data: URI renders unreliably here (shows
      // "0:00 / 0:00" and never actually plays).
      setPreviewAudioUrl(dataUriToBlobUrl(result.audioDataUri));
      requestAnimationFrame(() => {
        audioRef.current?.play().catch(() => {
          // Autoplay can be blocked (the click's user-gesture window has
          // already passed by the time this async round trip finishes) —
          // the visible native player below is the reliable fallback.
        });
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Default voice — Word Lists</CardTitle>
        <CardDescription>
          Applies to every Word List (no per-group override exists yet). Never affects Stories,
          Conversation, Books, or Normal lessons — see Voice collections above and the Normal
          Lessons section below for those separate settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {voices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No Cartesia voices registered yet — add some from the Cartesia section below first.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selected}
              onChange={(event) => {
                setSelected(event.target.value);
                setPreviewAudioUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
              }}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} — {voice.gender} · {voice.accent}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Preview ${current?.name ?? ""}`}
              onClick={handlePreview}
              disabled={isPending || !current}
            >
              {isPreviewing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </Button>
            {previewAudioUrl && (
              <audio
                ref={audioRef}
                controls
                autoPlay
                src={previewAudioUrl}
                className="h-8 max-w-[220px]"
              />
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || selected === currentVoiceId}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
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
      </CardContent>
    </Card>
  );
}
