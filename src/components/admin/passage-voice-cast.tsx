"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Square } from "lucide-react";

import { useVoiceSample } from "@/components/admin/use-voice-sample";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { replaceCharacterVoice, setNarratorForAll } from "@/lib/admin/passages-actions";
import type { ActionResult } from "@/lib/admin/passages-actions";
import type { AdminVoiceOption, VoiceCast } from "@/lib/admin/passages-queries";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "border-input bg-background h-9 min-w-0 rounded-lg border px-2.5 text-sm disabled:opacity-60";
const MIXED = "__mixed__";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The voices a select offers, women's and men's apart; `skip` leaves one out (the voice a row already has). */
function VoiceOptions({ voices, skip }: { voices: AdminVoiceOption[]; skip?: string }) {
  const pick = (gender: "female" | "male") =>
    voices.filter((voice) => voice.gender === gender && voice.id !== skip);
  return (
    <>
      <optgroup label="Female voices">
        {pick("female").map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Male voices">
        {pick("male").map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </optgroup>
    </>
  );
}

/**
 * "Voices for all passages": the way to choose the voices once for the whole library
 * instead of opening each passage. The characters of all the passages speak with a handful
 * of voices — pick another voice for one of them and it replaces that voice for every
 * character who has it, in every passage — and the narrator of all the passages is one
 * choice too. A change that would give one voice to two roles of a passage is refused, with
 * nothing changed. A passage can still be set on its own page.
 */
export function PassageVoiceCast({ cast }: { cast: VoiceCast }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const { sampling, toggleSample } = useVoiceSample();

  function run(confirmText: string, action: () => Promise<ActionResult>) {
    if (!window.confirm(confirmText)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Saved." },
      );
      router.refresh();
    });
  }

  function replace(entry: VoiceCast["characters"][number], toVoiceId: string) {
    const to = cast.voices.find((voice) => voice.id === toVoiceId);
    if (!to) return;
    run(
      `Replace ${entry.voice.name} with ${to.name} for ${plural(entry.characters, "character")} in ${plural(entry.passages, "passage")}? Lines already narrated keep the old voice until you narrate them again.`,
      () => replaceCharacterVoice({ fromVoiceId: entry.voice.id, toVoiceId }),
    );
  }

  function changeNarrator(value: string) {
    if (value === MIXED) return;
    const to = cast.voices.find((voice) => voice.id === value);
    run(
      to
        ? `Make ${to.name} the narrator of all ${cast.narrator.total} passages? Lines already narrated keep the old voice until you narrate them again.`
        : `Give every passage the site's default narration voice (${cast.defaultNarrator?.name ?? "none set"}) again?`,
      () => setNarratorForAll(value || null),
    );
  }

  const { narrator } = cast;
  const narratorShown = narrator.mode === "same" ? narrator.voice : cast.defaultNarrator;
  const narratorNote =
    narrator.mode === "default"
      ? "reads every story — the site's default"
      : narrator.mode === "same"
        ? `reads all ${narrator.total} stories`
        : `has an own voice in ${narrator.passagesWithOwn} of ${narrator.total} passages`;

  const playButton = (voice: AdminVoiceOption | null | undefined) =>
    voice?.sampleAudioUrl ? (
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => toggleSample(voice)}
        aria-label={sampling === voice.id ? "Stop the sample" : `Listen to ${voice.name}`}
        title={sampling === voice.id ? "Stop the sample" : "Listen to a sample"}
      >
        {sampling === voice.id ? <Square aria-hidden="true" /> : <Play aria-hidden="true" />}
      </Button>
    ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Voices for all passages</CardTitle>
        <CardDescription>
          Choose the voices once for the whole library. The narrator reads every passage&apos;s
          story; each voice under Characters speaks for every character who has it — pick another
          voice and it replaces that one in all the passages. A passage can still be set on its own
          page. Narrated lines keep their old voice until you narrate them again.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
          <div className="min-w-0 flex-1 basis-44">
            <p className="font-medium">Narrator</p>
            <p className="text-muted-foreground text-xs">{narratorNote}</p>
          </div>
          {playButton(narratorShown)}
          <select
            aria-label="Narrator of all passages"
            value={
              narrator.mode === "same"
                ? (narrator.voice?.id ?? "")
                : narrator.mode === "mixed"
                  ? MIXED
                  : ""
            }
            disabled={isPending}
            onChange={(event) => changeNarrator(event.target.value)}
            className={cn(SELECT_CLASS, "w-full sm:w-80")}
          >
            <option value="">
              Site default{cast.defaultNarrator ? ` — ${cast.defaultNarrator.name}` : " (none set)"}
            </option>
            {narrator.mode === "mixed" && (
              <option value={MIXED} disabled>
                Different in each passage
              </option>
            )}
            <VoiceOptions voices={cast.voices} />
          </select>
        </div>

        {cast.characters.length === 0 ? (
          <p className="text-muted-foreground text-sm">No character has a voice yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {cast.characters.map((entry) => (
              <li
                key={entry.voice.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 flex-1 basis-44 items-center gap-2">
                  {playButton(entry.voice)}
                  <div className="min-w-0">
                    <p className="truncate font-medium" title={entry.voice.name}>
                      {entry.voice.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {plural(entry.characters, "character")} in {plural(entry.passages, "passage")}
                    </p>
                  </div>
                </div>
                <Badge variant="muted">{entry.voice.gender === "female" ? "Female" : "Male"}</Badge>
                <select
                  aria-label={`Replace ${entry.voice.name} in all passages`}
                  value=""
                  disabled={isPending}
                  onChange={(event) => replace(entry, event.target.value)}
                  className={cn(SELECT_CLASS, "w-full sm:w-80")}
                >
                  <option value="">Replace with…</option>
                  <VoiceOptions voices={cast.voices} skip={entry.voice.id} />
                </select>
              </li>
            ))}
          </ul>
        )}

        {isPending && (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving…
          </p>
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
