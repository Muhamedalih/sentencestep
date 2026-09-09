"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Search, Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addHumeVoiceAction,
  browseHumeVoicesAction,
  previewHumeAction,
} from "@/lib/admin/hume-actions";
import { deleteVoiceAction } from "@/lib/admin/voices-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import type { HumeVoiceSummary } from "@/lib/voice/providers/hume";
import { dataUriToBlobUrl } from "@/lib/audio-preview";
import { cn } from "@/lib/utils";

const PREVIEW_TEXT = "The old house creaked softly as the wind picked up outside.";

function slugify(providerVoiceId: string): string {
  return `hume-${providerVoiceId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/**
 * Registers a `voices` row for a Hume AI voice — either browsed live from
 * Hume's shared Voice Library (browseHumeVoicesAction) or pasted in by id
 * for a custom saved voice not in that library. Mirrors CartesiaVoiceForm's
 * shape exactly.
 */
export function HumeVoiceForm({ voices }: { voices: VoiceRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [results, setResults] = useState<HumeVoiceSummary[] | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    setMessage(null);
    const name = String(formData.get("name") ?? "").trim();
    const providerVoiceId = String(formData.get("providerVoiceId") ?? "").trim();
    const gender = (formData.get("gender") === "male" ? "male" : "female") as "female" | "male";
    const accent = String(formData.get("accent") ?? "").trim();

    startTransition(async () => {
      const result = await addHumeVoiceAction({
        id: slugify(providerVoiceId),
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

  function handleBrowse() {
    setMessage(null);
    startTransition(async () => {
      const result = await browseHumeVoicesAction();
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        setResults(null);
        return;
      }
      setResults(result.voices ?? []);
    });
  }

  function handleAddFromCatalog(voice: HumeVoiceSummary) {
    setMessage(null);
    startTransition(async () => {
      const result = await addHumeVoiceAction({
        id: slugify(voice.id),
        name: voice.name,
        providerVoiceId: voice.id,
        gender: "female",
        accent: "Neutral",
      });
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Added." },
      );
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
      const result = await previewHumeAction({ text: PREVIEW_TEXT, providerVoiceId });
      setPreviewingId(null);
      if (result.error || !result.audioDataUri) {
        setMessage({ kind: "error", text: result.error ?? "Preview failed." });
        return;
      }
      // Converted to a Blob URL — a raw inline data: URI renders
      // unreliably here (MediaError MEDIA_ERR_SRC_NOT_SUPPORTED, shows
      // "0:00 / 0:00" and never plays) — see dataUriToBlobUrl's own doc
      // comment, and pronunciation-default-voice-form.tsx for the same fix.
      setPreviewAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      const blobUrl = dataUriToBlobUrl(result.audioDataUri);
      setPreviewAudioUrl(blobUrl);
      if (audioRef.current) {
        audioRef.current.src = blobUrl;
        audioRef.current.play().catch(() => {
          // Same autoplay caveat as ElevenLabsVoiceForm — the native player
          // below is the reliable fallback.
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hume AI voices</CardTitle>
        <CardDescription>
          Browse Hume&apos;s Voice Library and add the ones you want, or paste a voice id directly
          for a custom saved voice.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={handleBrowse}
            className="w-fit"
          >
            <Search className="size-4" />
            Browse Voice Library
          </Button>
          {results && (
            <div className="flex flex-col gap-1.5 rounded-lg border p-2">
              {results.length === 0 && (
                <p className="text-muted-foreground py-2 text-center text-sm">No voices found.</p>
              )}
              {results.map((voice) => {
                const alreadyAdded = voices.some((v) => v.providerVoiceId === voice.id);
                return (
                  <div
                    key={voice.id}
                    className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{voice.name}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isPending || alreadyAdded}
                      onClick={() => handleAddFromCatalog(voice)}
                    >
                      {alreadyAdded ? "Added" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form ref={formRef} action={handleAdd} className="grid gap-3 sm:grid-cols-4">
          <input
            name="name"
            placeholder="Display name (e.g. Warm Narrator)"
            required
            className="border-input bg-background rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="providerVoiceId"
            placeholder="Hume voice id"
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
              No Hume voices registered yet.
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
