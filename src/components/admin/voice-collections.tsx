"use client";

import { useState, useTransition } from "react";
import { Check, Trash2, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { deleteVoiceAction, setDefaultVoiceAction } from "@/lib/admin/voices-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { cn } from "@/lib/utils";

const COLLECTION_LABELS: Record<string, string> = {
  "edge-tts": "Edge-TTS",
  elevenlabs: "ElevenLabs",
  cartesia: "Cartesia",
  hume: "Hume AI",
};

/**
 * Real, stored voices (see the voices table) — a genuinely different thing
 * from VoiceSettingsForm above it on this page, which only ever configures
 * a *preference* among whatever the Web Speech API happens to expose on
 * this browser (see voice-settings.ts's doc comment). New voices are added
 * per-provider (see EdgeTtsVoiceForm/ElevenLabsVoiceForm/etc. elsewhere on
 * this page) — this component only lists, previews, and deletes what's
 * already there, plus one specific setting (see "Set default" below).
 *
 * IMPORTANT — the "Set default" button here writes tts_settings.default_voice_id,
 * which is Stories/Conversation's OWN fallback voice (see
 * story-voice-generation.ts's resolveTargetVoices and this page's separate
 * "Default narration voice (Stories & Books)" picker in
 * ElevenLabsSettingsForm — the two must always point at the same voice, see
 * that form's own doc comment). It has nothing to do with Normal lessons,
 * Word Lists, or Mistake Review — see PronunciationDefaultVoiceForm
 * elsewhere on this page for that separate, independent setting.
 */
export function VoiceCollections({
  voices,
  defaultVoiceId,
}: {
  voices: VoiceRow[];
  defaultVoiceId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingVoiceId, setPendingVoiceId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const byCollection = new Map<string, VoiceRow[]>();
  for (const voice of voices) {
    const group = byCollection.get(voice.collection) ?? [];
    group.push(voice);
    byCollection.set(voice.collection, group);
  }

  function handleSetDefault(voiceId: string | null) {
    setMessage(null);
    setPendingVoiceId(voiceId);
    startTransition(async () => {
      const result = await setDefaultVoiceAction(voiceId);
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Saved." },
      );
      setPendingVoiceId(null);
    });
  }

  function handleDelete(voiceId: string) {
    setMessage(null);
    setPendingVoiceId(voiceId);
    startTransition(async () => {
      const result = await deleteVoiceAction(voiceId);
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Deleted." },
      );
      setPendingVoiceId(null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Voice collections</CardTitle>
        <CardDescription>
          Every registered voice, for preview and cleanup. The default set here applies only to
          Stories, Conversation & Books (their own narration fallback) — for Normal Lessons, Word
          Lists & Mistake Review, use the separate picker further down this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {voices.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No voices added yet — add one from a provider section further down this page.
            </p>
          </div>
        )}

        {[...byCollection.entries()].map(([collection, group]) => (
          <div key={collection} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
              {COLLECTION_LABELS[collection] ?? collection}
              <span className="text-muted-foreground ml-2 font-normal">({group.length})</span>
            </h3>
            <div className="flex flex-col gap-1.5">
              {group.map((voice) => (
                <VoiceRowItem
                  key={voice.id}
                  voice={voice}
                  isDefault={voice.id === defaultVoiceId}
                  isBusy={isPending && pendingVoiceId === voice.id}
                  onSetDefault={() => handleSetDefault(voice.id)}
                  onDelete={() => handleDelete(voice.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {defaultVoiceId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            disabled={isPending}
            onClick={() => handleSetDefault(null)}
          >
            Clear Stories default
          </Button>
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

function VoiceRowItem({
  voice,
  isDefault,
  isBusy,
  onSetDefault,
  onDelete,
}: {
  voice: VoiceRow;
  isDefault: boolean;
  isBusy: boolean;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const clip = useAudioClip(voice.sampleAudioUrl);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5",
        isDefault ? "bg-primary/10" : "hover:bg-muted",
      )}
    >
      <div
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          isDefault ? "border-primary bg-primary" : "border-border",
        )}
        aria-hidden="true"
      >
        {isDefault && <Check className="text-primary-foreground size-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{voice.name}</span>
          <Badge variant="secondary" className="shrink-0">
            {voice.gender === "female" ? "Female" : "Male"} · {voice.accent}
          </Badge>
        </div>
        {voice.description && (
          <p className="text-muted-foreground truncate text-xs">{voice.description}</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Preview ${voice.name}`}
        title={
          voice.sampleAudioUrl
            ? undefined
            : "No sample stored for this voice — preview it in its own section further down this page."
        }
        onClick={() => clip.play()}
        disabled={!voice.sampleAudioUrl}
        className={cn("shrink-0", clip.status === "playing" && "text-primary")}
      >
        <Volume2 className={cn("size-4", clip.status === "playing" && "animate-pulse")} />
      </Button>
      {!isDefault && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSetDefault}
          disabled={isBusy}
          title="Sets the Stories/Conversation/Books fallback voice — not Normal Lessons, Word Lists, or Mistake Review."
        >
          Set as Stories default
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Delete ${voice.name}`}
        onClick={onDelete}
        disabled={isBusy}
        className="text-danger shrink-0"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
