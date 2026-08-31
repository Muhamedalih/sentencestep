"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveElevenLabsSettingsAction } from "@/lib/admin/elevenlabs-actions";
import type { ElevenLabsSettings } from "@/lib/admin/elevenlabs-queries";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { cn } from "@/lib/utils";

const MODEL_OPTIONS = [
  { value: "eleven_v3", label: "Eleven v3 (most expressive — Stories)" },
  { value: "eleven_multilingual_v2", label: "Eleven Multilingual v2 (consistent, no audio tags)" },
];

/**
 * The admin-configurable defaults every Story falls back to (see
 * resolveTargetVoices in story-voice-generation.ts): model, default
 * narrator voice, and the base voice_settings the Voice Director's
 * per-sentence emotion/energy/pace adjustments are layered on top of (see
 * direction-to-tags.ts).
 */
export function ElevenLabsSettingsForm({
  initial,
  voices,
}: {
  initial: ElevenLabsSettings;
  voices: VoiceRow[];
}) {
  const [model, setModel] = useState(initial.model);
  const [defaultStoryVoiceId, setDefaultStoryVoiceId] = useState(initial.defaultStoryVoiceId ?? "");
  const [stability, setStability] = useState(initial.stability);
  const [similarityBoost, setSimilarityBoost] = useState(initial.similarityBoost);
  const [style, setStyle] = useState(initial.style);
  const [speed, setSpeed] = useState(initial.speed);
  const [useSpeakerBoost, setUseSpeakerBoost] = useState(initial.useSpeakerBoost);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveElevenLabsSettingsAction({
        model,
        defaultStoryVoiceId: defaultStoryVoiceId || null,
        stability,
        similarityBoost,
        style,
        speed,
        useSpeakerBoost,
      });
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
        <CardTitle className="text-lg">ElevenLabs settings</CardTitle>
        <CardDescription>
          Used only for Stories and Conversations — Normal lessons keep using the free Kokoro voices
          above.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            Model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Default story voice
            <select
              value={defaultStoryVoiceId}
              onChange={(e) => setDefaultStoryVoiceId(e.target.value)}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            >
              <option value="">— None set —</option>
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <ElevenLabsSlider
            label="Stability"
            value={stability}
            min={0}
            max={1}
            onChange={setStability}
          />
          <ElevenLabsSlider
            label="Similarity"
            value={similarityBoost}
            min={0}
            max={1}
            onChange={setSimilarityBoost}
          />
          <ElevenLabsSlider label="Style" value={style} min={0} max={1} onChange={setStyle} />
          <ElevenLabsSlider label="Speed" value={speed} min={0.7} max={1.2} onChange={setSpeed} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useSpeakerBoost}
            onChange={(e) => setUseSpeakerBoost(e.target.checked)}
            className="accent-primary"
          />
          Use speaker boost
        </label>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save ElevenLabs settings"}
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

function ElevenLabsSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-primary w-full"
      />
    </div>
  );
}
