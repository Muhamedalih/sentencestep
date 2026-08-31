"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSpeech } from "@/hooks/use-speech";
import { rankVoices, toVoiceInfo } from "@/lib/speech";
import { saveVoiceSettings } from "@/lib/admin/voice-actions";
import {
  VOICE_PITCH_RANGE,
  VOICE_RATE_RANGE,
  VOICE_VOLUME_RANGE,
} from "@/lib/admin/voice-settings";
import type { VoiceSettings } from "@/lib/admin/voice-settings";
import { cn } from "@/lib/utils";

const PREVIEW_TEXT = "This is a preview of how this voice sounds.";

/**
 * Detected voices are entirely this browser/OS's own — whatever the admin
 * saves here is a *preference*, not a guarantee (see use-speech.ts's
 * matchVoice). This form only ever writes voice_name/voice_lang for a voice
 * actually present in the live list below, so what the admin previews is
 * exactly what gets saved.
 */
export function VoiceSettingsForm({ initial }: { initial: VoiceSettings }) {
  const speech = useSpeech();
  const [selected, setSelected] = useState<{ name: string; lang: string } | null>(
    initial.voiceName ? { name: initial.voiceName, lang: initial.voiceLang ?? "" } : null,
  );
  const [rate, setRate] = useState(initial.rate);
  const [pitch, setPitch] = useState(initial.pitch);
  const [volume, setVolume] = useState(initial.volume);
  const [previewingURI, setPreviewingURI] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!speech.isSpeaking) setPreviewingURI(null);
  }, [speech.isSpeaking]);

  const voices = speech.getAvailableEnglishVoices();
  const ranked = rankVoices(voices.map(toVoiceInfo));

  function handlePreview(voiceURI: string) {
    setPreviewingURI(voiceURI);
    speech.previewVoice(voiceURI, PREVIEW_TEXT, { rate, pitch, volume });
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveVoiceSettings({
        voiceName: selected?.name ?? null,
        voiceLang: selected?.lang || null,
        rate,
        pitch,
        volume,
      });
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Default lesson voice</CardTitle>
          <CardDescription>
            {voices.length === 0
              ? "Detecting voices available in this browser…"
              : `${voices.length} English voice${voices.length === 1 ? "" : "s"} detected on this device. Every learner's own browser matches this choice by name automatically, falling back to the best voice it has if this one isn't installed there.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {voices.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No voices detected yet — some browsers report their voice list a moment after the page
              loads.
            </p>
          )}
          <div className="max-h-80 overflow-y-auto">
            {ranked.map(({ voice, reasons }) => {
              const isSelected = selected?.name === voice.name && selected.lang === voice.lang;
              const isNatural = reasons.some((reason) => reason.includes("high-quality"));
              const isPreviewing = previewingURI === voice.voiceURI && speech.isSpeaking;
              return (
                <div
                  key={voice.voiceURI}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected({ name: voice.name, lang: voice.lang })}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    setSelected({ name: voice.name, lang: voice.lang });
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      isSelected ? "border-primary bg-primary" : "border-border",
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="text-primary-foreground size-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{voice.name}</span>
                      {isNatural && (
                        <Badge variant="default" className="shrink-0">
                          Natural
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs">{voice.lang}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Preview ${voice.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePreview(voice.voiceURI);
                    }}
                    className={cn("shrink-0", isPreviewing && "text-primary")}
                  >
                    <Volume2 className={cn("size-4", isPreviewing && "animate-pulse")} />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voice parameters</CardTitle>
          <CardDescription>Applied to every automatic and replayed pronunciation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <VoiceSlider label="Speed" value={rate} range={VOICE_RATE_RANGE} onChange={setRate} />
          <VoiceSlider label="Pitch" value={pitch} range={VOICE_PITCH_RANGE} onChange={setPitch} />
          <VoiceSlider
            label="Volume"
            value={volume}
            range={VOICE_VOLUME_RANGE}
            onChange={setVolume}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save voice settings"}
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
    </div>
  );
}

function VoiceSlider({
  label,
  value,
  range,
  onChange,
}: {
  label: string;
  value: number;
  range: { min: number; max: number };
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
        min={range.min}
        max={range.max}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-primary w-full"
      />
    </div>
  );
}
