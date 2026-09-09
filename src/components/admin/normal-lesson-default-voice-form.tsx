"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { previewHumeAction } from "@/lib/admin/hume-actions";
import { setDefaultNormalLessonVoiceAction } from "@/lib/admin/voices-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { dataUriToBlobUrl } from "@/lib/audio-preview";
import { cn } from "@/lib/utils";

const PREVIEW_TEXT = "The old house creaked softly as the wind picked up outside.";

/**
 * The one setting this form exists for: tts_settings.default_normal_lesson_voice_id
 * — the voice Normal lessons (Daily Lessons) fall back to when a lesson has
 * no `voice_id` override (see getDefaultNormalLessonVoiceId). Deliberately
 * separate from VoiceCollections' "Set as Stories default" button
 * (tts_settings.default_voice_id), PronunciationDefaultVoiceForm's own
 * setting (tts_settings.default_pronunciation_voice_id, now Word Lists'
 * only), and ElevenLabsSettingsForm's "Default narration voice (Stories &
 * Books)" (elevenlabs_settings.default_story_voice_id) — picking a voice
 * here can never affect Stories, Conversation, Books, or Word Lists. Only
 * lists Hume voices: Normal lessons' generation pipeline always uses Hume
 * specifically (see story-voice-generation.ts's own doc comment and
 * content-provider-map.ts), so any other source would just fail to
 * resolve.
 */
export function NormalLessonDefaultVoiceForm({
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
      const result = await setDefaultNormalLessonVoiceAction(selected);
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
      const result = await previewHumeAction({
        text: PREVIEW_TEXT,
        providerVoiceId: current.providerVoiceId,
      });
      setIsPreviewing(false);
      if (result.error || !result.audioDataUri) {
        setMessage({ kind: "error", text: result.error ?? "Preview failed." });
        return;
      }
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
        <CardTitle className="text-lg">Default voice — Normal Lessons</CardTitle>
        <CardDescription>
          Applies to every Normal lesson (Daily Lessons) that has no voice of its own picked in the
          &quot;Normal Lessons&quot; section of Story audio status. Never affects Stories,
          Conversation, Books, or Word Lists — see Voice collections above and Word Lists below for
          those separate settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {voices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No Hume voices registered yet — add some from the Hume AI section below first.
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
