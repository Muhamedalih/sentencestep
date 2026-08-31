"use client";

import { useState, useTransition } from "react";
import { Check, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { saveTypingSoundSettings } from "@/lib/admin/typing-sound-actions";
import { TYPING_SOUND_VOLUME_RANGE } from "@/lib/admin/typing-sound-settings";
import type { TypingSoundSettings } from "@/lib/admin/typing-sound-settings";
import { LEARNING_SECTION_LABELS, LEARNING_SECTION_NAMES } from "@/lib/admin/learning-sections";
import type { LearningSection } from "@/lib/admin/learning-sections";
import { SOUND_PACK_LABELS, SOUND_PACK_NAMES } from "@/lib/typing-sound-packs";
import type { SoundPack } from "@/lib/typing-sound-packs";
import {
  SENTENCE_COMPLETE_SOUND_LABELS,
  SENTENCE_COMPLETE_SOUND_NAMES,
} from "@/lib/sentence-complete-sounds";
import type { SentenceCompleteSound } from "@/lib/sentence-complete-sounds";
import { cn } from "@/lib/utils";

/** The literal option value meaning "no override — inherit the plain global default" in each section's <select>, distinct from any real SentenceCompleteSound name. */
const USE_GLOBAL_DEFAULT = "__default__";

export function TypingSoundSettingsForm({ initial }: { initial: TypingSoundSettings }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [soundPack, setSoundPack] = useState<SoundPack>(initial.soundPack);
  const [volume, setVolume] = useState(initial.volume);
  const [sentenceCompleteSound, setSentenceCompleteSound] = useState<SentenceCompleteSound>(
    initial.sentenceCompleteSound,
  );
  const [sectionSounds, setSectionSounds] = useState<
    Partial<Record<LearningSection, SentenceCompleteSound>>
  >(initial.sectionSentenceCompleteSounds);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Previews always play, even if "enabled" is currently off — an admin
  // needs to hear a pack to decide whether to enable it. No fixed `pack`
  // here: each row's preview button passes its own pack directly to
  // play(), independent of which pack is currently selected below.
  const preview = useTypingSound({ enabled: true, volume });

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveTypingSoundSettings({
        enabled,
        soundPack,
        volume,
        sentenceCompleteSound,
        sectionSentenceCompleteSounds: sectionSounds,
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
          <CardTitle className="text-lg">Sound pack</CardTitle>
          <CardDescription>
            Plays on every correct keystroke during a lesson. Preview a pack before saving it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 sm:grid-cols-2">
          {SOUND_PACK_NAMES.map((pack) => {
            const isSelected = soundPack === pack;
            return (
              <div
                key={pack}
                role="button"
                tabIndex={0}
                onClick={() => setSoundPack(pack)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setSoundPack(pack);
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
                <span className="flex-1 text-sm font-medium">{SOUND_PACK_LABELS[pack]}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Preview ${SOUND_PACK_LABELS[pack]}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    preview.play("letter", pack);
                  }}
                  className="shrink-0"
                >
                  <Play className="size-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sentence completion sound</CardTitle>
          <CardDescription>
            Plays once, right after a learner correctly finishes typing a whole sentence.
            Independent of the keystroke pack above.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 sm:grid-cols-2">
          {SENTENCE_COMPLETE_SOUND_NAMES.map((sound) => {
            const isSelected = sentenceCompleteSound === sound;
            return (
              <div
                key={sound}
                role="button"
                tabIndex={0}
                onClick={() => setSentenceCompleteSound(sound)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setSentenceCompleteSound(sound);
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
                <span className="flex-1 text-sm font-medium">
                  {SENTENCE_COMPLETE_SOUND_LABELS[sound]}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Preview ${SENTENCE_COMPLETE_SOUND_LABELS[sound]}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    preview.playSentenceComplete(sound);
                  }}
                  className="shrink-0"
                >
                  <Play className="size-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section sounds</CardTitle>
          <CardDescription>
            Override the sentence-completion sound for a specific section — e.g. a page-turn sound
            for Book Reading, a different one for Stories. A section left on &quot;Default&quot;
            plays whichever sound is selected above.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {LEARNING_SECTION_NAMES.map((section) => {
            const value = sectionSounds[section] ?? USE_GLOBAL_DEFAULT;
            return (
              <div key={section} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{LEARNING_SECTION_LABELS[section]}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={value}
                    onChange={(event) => {
                      const next = event.target.value;
                      setSectionSounds((prev) => {
                        if (next === USE_GLOBAL_DEFAULT) {
                          const { [section]: _removed, ...rest } = prev;
                          return rest;
                        }
                        return { ...prev, [section]: next as SentenceCompleteSound };
                      });
                    }}
                    className="border-border bg-background flex-1 rounded-md border px-2.5 py-1.5 text-sm"
                  >
                    <option value={USE_GLOBAL_DEFAULT}>
                      Default ({SENTENCE_COMPLETE_SOUND_LABELS[sentenceCompleteSound]})
                    </option>
                    {SENTENCE_COMPLETE_SOUND_NAMES.map((sound) => (
                      <option key={sound} value={sound}>
                        {SENTENCE_COMPLETE_SOUND_LABELS[sound]}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Preview ${LEARNING_SECTION_LABELS[section]} sound`}
                    onClick={() =>
                      preview.playSentenceComplete(
                        value === USE_GLOBAL_DEFAULT
                          ? sentenceCompleteSound
                          : (value as SentenceCompleteSound),
                      )
                    }
                    className="shrink-0"
                  >
                    <Play className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Playback</CardTitle>
          <CardDescription>Applied to every learner&apos;s lesson session.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Typing sounds</span>
            <Button
              type="button"
              variant={enabled ? "default" : "outline"}
              size="sm"
              onClick={() => setEnabled((value) => !value)}
            >
              {enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volume</span>
              <span className="text-muted-foreground text-xs">{volume.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={TYPING_SOUND_VOLUME_RANGE.min}
              max={TYPING_SOUND_VOLUME_RANGE.max}
              step={0.05}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="accent-primary w-full"
              disabled={!enabled}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save typing sound settings"}
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
