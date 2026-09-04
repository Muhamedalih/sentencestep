"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Sparkles, Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addEdgeTtsVoiceAction,
  previewEdgeTtsAction,
  seedEdgeTtsVoicesAction,
} from "@/lib/admin/edge-tts-actions";
import { deleteVoiceAction } from "@/lib/admin/voices-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { EDGE_TTS_VOICES } from "@/lib/voice/edge-tts-catalog";
import { cn } from "@/lib/utils";

const PREVIEW_TEXT = "The old house creaked softly as the wind picked up outside.";

/**
 * Registers `voices` rows for Edge-TTS — the free, zero-configuration
 * narration provider (see providers/edge-tts.ts): no API key, no account,
 * works immediately. "Add suggested voices" seeds the whole curated
 * EDGE_TTS_VOICES list in one click (see seedEdgeTtsVoicesAction) so an
 * admin has several real, diverse voices to choose from right away, without
 * typing voice names in one at a time — the manual form below still exists
 * for any other real Edge/Azure neural voice name.
 */
export function EdgeTtsVoiceForm({ voices }: { voices: VoiceRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSeed() {
    setMessage(null);
    startTransition(async () => {
      const result = await seedEdgeTtsVoicesAction();
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Added." },
      );
    });
  }

  function handleAdd(formData: FormData) {
    setMessage(null);
    const name = String(formData.get("name") ?? "").trim();
    const providerVoiceId = String(formData.get("providerVoiceId") ?? "").trim();
    const gender = (formData.get("gender") === "male" ? "male" : "female") as "female" | "male";
    const accent = String(formData.get("accent") ?? "").trim();

    startTransition(async () => {
      const result = await addEdgeTtsVoiceAction({
        id: `edge-tts-manual-${providerVoiceId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name,
        providerVoiceId,
        gender,
        accent,
      });
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Added." },
      );
      if (!result.error) formRef.current?.reset();
    });
  }

  function handleDelete(voiceId: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteVoiceAction(voiceId);
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Deleted." },
      );
    });
  }

  function handlePreview(providerVoiceId: string, voiceId: string) {
    setMessage(null);
    setPreviewingId(voiceId);
    startTransition(async () => {
      const result = await previewEdgeTtsAction({ text: PREVIEW_TEXT, providerVoiceId });
      setPreviewingId(null);
      if (result.error || !result.audioDataUri) {
        setMessage({ kind: "error", text: result.error ?? "Preview failed." });
        return;
      }
      setPreviewAudioUrl(result.audioDataUri);
      if (audioRef.current) {
        audioRef.current.src = result.audioDataUri;
        audioRef.current.play().catch(() => {
          // Browsers can refuse this autoplay — the actual play() call lands
          // after the server round-trip above, past the original click's
          // user-gesture window. The native player revealed below (bound to
          // previewAudioUrl) is the reliable fallback: pressing its own play
          // button is a fresh gesture the browser always allows.
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Edge-TTS voices (free, no signup)</CardTitle>
        <CardDescription>
          Microsoft Edge&apos;s built-in Read Aloud neural voices — no API key or account needed.
          Unofficial (see providers/edge-tts.ts), works today, no monthly limit.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSeed}
          disabled={isPending}
          className="w-fit"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Add {EDGE_TTS_VOICES.length} suggested voices
        </Button>

        <form ref={formRef} action={handleAdd} className="grid gap-3 sm:grid-cols-4">
          <input
            name="name"
            placeholder="Display name (e.g. Warm Narrator)"
            required
            className="border-input bg-background rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="providerVoiceId"
            placeholder="Voice name (e.g. en-US-AriaNeural)"
            required
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          />
          <select
            name="gender"
            defaultValue="female"
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <input
            name="accent"
            placeholder="Accent (e.g. American)"
            className="border-input bg-background rounded-md border px-3 py-2 text-sm sm:col-span-3"
          />
          <Button type="submit" disabled={isPending}>
            Add voice
          </Button>
        </form>

        <div className="flex flex-col gap-1.5">
          {voices.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No Edge-TTS voices registered yet.
            </p>
          )}
          {voices.map((voice) => (
            <div
              key={voice.id}
              className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{voice.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {voice.gender} · {voice.accent}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Preview ${voice.name}`}
                disabled={isPending}
                onClick={() => handlePreview(voice.providerVoiceId, voice.id)}
              >
                {previewingId === voice.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${voice.name}`}
                disabled={isPending}
                onClick={() => handleDelete(voice.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <audio
          ref={audioRef}
          controls
          className={cn("h-8 max-w-full", !previewAudioUrl && "hidden")}
        />
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
