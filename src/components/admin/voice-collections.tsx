"use client";

import { useState, useTransition } from "react";
import { Check, Trash2, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAudioClip } from "@/hooks/use-audio-clip";
import {
  deleteVoiceAction,
  seedKokoroCollectionAction,
  setDefaultVoiceAction,
} from "@/lib/admin/voices-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { KOKORO_COLLECTION, KOKORO_VOICES } from "@/lib/voice/kokoro-catalog";
import { cn } from "@/lib/utils";

const COLLECTION_LABELS: Record<string, string> = {
  [KOKORO_COLLECTION]: "Kokoro Natural Learning",
};

/**
 * Real, stored voices (see the voices table) — a genuinely different thing
 * from VoiceSettingsForm above it on this page, which only ever configures
 * a *preference* among whatever the Web Speech API happens to expose on
 * this browser (see voice-settings.ts's doc comment). This is where an
 * admin picks the actual global default Kokoro voice and, per lesson, an
 * override (see LessonForm's own Voice field) — both read through the one
 * resolveVoiceId function everywhere else in the app.
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

  const kokoroSeeded = voices.filter((voice) => voice.collection === KOKORO_COLLECTION).length;
  const kokoroComplete = kokoroSeeded >= KOKORO_VOICES.length;

  function handleSeed() {
    setMessage(null);
    startTransition(async () => {
      const result = await seedKokoroCollectionAction();
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Done." },
      );
    });
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
          Real, generated voices lessons can use directly — pick a global default here, or override
          an individual lesson&apos;s voice from its editor.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {voices.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">No voices generated yet.</p>
            <Button type="button" onClick={handleSeed} disabled={isPending}>
              {isPending ? "Generating…" : "Generate Kokoro Natural Learning collection"}
            </Button>
          </div>
        )}

        {voices.length > 0 && !kokoroComplete && (
          <div className="border-border bg-muted/40 flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <p className="text-sm">
              {kokoroSeeded} of {KOKORO_VOICES.length} Kokoro voices generated.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSeed}
              disabled={isPending}
            >
              {isPending ? "Generating…" : "Generate remaining"}
            </Button>
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
            Clear global default
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
        onClick={() => clip.play()}
        disabled={!voice.sampleAudioUrl}
        className={cn("shrink-0", clip.status === "playing" && "text-primary")}
      >
        <Volume2 className={cn("size-4", clip.status === "playing" && "animate-pulse")} />
      </Button>
      {!isDefault && (
        <Button type="button" variant="outline" size="sm" onClick={onSetDefault} disabled={isBusy}>
          Set default
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
