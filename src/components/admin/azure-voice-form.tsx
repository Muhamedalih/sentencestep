"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addAzureVoiceAction, previewAzureAction } from "@/lib/admin/azure-actions";
import { deleteVoiceAction } from "@/lib/admin/voices-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import type { ElevenLabsSettings } from "@/lib/admin/elevenlabs-queries";
import { cn } from "@/lib/utils";

const PREVIEW_TEXT = "The old house creaked softly as the wind picked up outside.";

/**
 * A curated shortlist of Azure neural voices with rich mstts:express-as
 * style support (see direction-to-ssml.ts's EXPRESS_AS_STYLE) — not an
 * exhaustive catalog (Azure's full voice list is far larger, see
 * https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts),
 * just a starting point so an admin doesn't have to look up a voice name
 * before trying this out. The provider voice id field stays free text
 * (datalist, not a locked <select>) so any real Azure voice name works.
 */
const SUGGESTED_VOICES = [
  { id: "en-US-AriaNeural", label: "Aria (US, female — widest style range)" },
  { id: "en-US-JennyNeural", label: "Jenny (US, female — assistant/chat)" },
  { id: "en-US-GuyNeural", label: "Guy (US, male — newscast/narration)" },
  { id: "en-US-DavisNeural", label: "Davis (US, male)" },
  { id: "en-US-SaraNeural", label: "Sara (US, female)" },
  { id: "en-US-TonyNeural", label: "Tony (US, male)" },
  { id: "en-GB-SoniaNeural", label: "Sonia (UK, female)" },
  { id: "en-GB-RyanNeural", label: "Ryan (UK, male)" },
];

/**
 * Registers a `voices` row for a real Azure neural voice name — unlike
 * ElevenLabs (ElevenLabsVoiceForm), there is no per-account cloning step:
 * every Azure Speech resource shares the same public catalog, so the admin
 * just picks (or types) a real voice name. Each row's Preview button calls
 * previewAzureAction, ephemeral by construction — nothing here ever writes
 * to voice_audio_cache or Storage.
 */
export function AzureVoiceForm({
  voices,
  settings,
}: {
  voices: VoiceRow[];
  settings: ElevenLabsSettings;
}) {
  const [isPending, startTransition] = useTransition();
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    setMessage(null);
    const name = String(formData.get("name") ?? "").trim();
    const providerVoiceId = String(formData.get("providerVoiceId") ?? "").trim();
    const gender = (formData.get("gender") === "male" ? "male" : "female") as "female" | "male";
    const accent = String(formData.get("accent") ?? "").trim();

    startTransition(async () => {
      const result = await addAzureVoiceAction({
        id: `azure-${providerVoiceId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
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
      const result = await previewAzureAction({ text: PREVIEW_TEXT, providerVoiceId });
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
        <CardTitle className="text-lg">Azure voices (free)</CardTitle>
        <CardDescription>
          Register a real Azure neural voice name (see the suggestions below, or Azure&apos;s full
          voice list), then preview how it sounds. Azure&apos;s free tier covers 500,000
          characters/month — see AZURE_SPEECH_KEY in .env.example for setup.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form ref={formRef} action={handleAdd} className="grid gap-3 sm:grid-cols-4">
          <input
            name="name"
            placeholder="Display name (e.g. Warm Narrator)"
            required
            className="border-input bg-background rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="providerVoiceId"
            placeholder="Azure voice name (e.g. en-US-AriaNeural)"
            required
            list="azure-suggested-voices"
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          />
          <datalist id="azure-suggested-voices">
            {SUGGESTED_VOICES.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.label}
              </option>
            ))}
          </datalist>
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
              No Azure voices registered yet.
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
                {settings.defaultStoryVoiceId === voice.id && (
                  <span className="text-primary ml-2 text-xs font-medium">
                    Default narration voice
                  </span>
                )}
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
