"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setSpeakerVoicesAction } from "@/lib/admin/elevenlabs-actions";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { cn } from "@/lib/utils";

/**
 * Persistent per-speaker ElevenLabs voice assignment for a Conversation
 * lesson (lesson_speaker_voices) — saved independently of the main
 * saveLesson submit (a separate action, setSpeakerVoicesAction), since it
 * doesn't need to block on or participate in the sentence save/failure
 * path the way translations do. Speakers are always exactly "A"/"B" (see
 * emptySentence's hardcoded alternation in lesson-form.tsx — the speaker
 * select field itself only ever offers those two options).
 */
export function SpeakerVoicesField({
  lessonId,
  voices,
  initial,
}: {
  lessonId: string;
  voices: VoiceRow[];
  initial: Record<string, string>;
}) {
  const [voiceA, setVoiceA] = useState(initial.A ?? "");
  const [voiceB, setVoiceB] = useState(initial.B ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await setSpeakerVoicesAction(lessonId, [
        { speaker: "A", voiceId: voiceA },
        { speaker: "B", voiceId: voiceB },
      ]);
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Saved." },
      );
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Speaker voices</CardTitle>
        <CardDescription>
          Each character keeps this voice on every regeneration — leave a speaker unset and its
          audio generation will fail loudly rather than silently sharing another speaker&apos;s
          voice.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {voices.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No ElevenLabs voices registered yet — add one in Admin &gt; Voice first.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            Speaker A
            <select
              value={voiceA}
              onChange={(e) => setVoiceA(e.target.value)}
              className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
            >
              <option value="">— Unset —</option>
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Speaker B
            <select
              value={voiceB}
              onChange={(e) => setVoiceB(e.target.value)}
              className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
            >
              <option value="">— Unset —</option>
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save speaker voices"}
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
      </CardContent>
    </Card>
  );
}
