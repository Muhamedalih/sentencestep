"use client";

import { Play, Square } from "lucide-react";

import { useVoiceSample } from "@/components/admin/use-voice-sample";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminVoiceOption } from "@/lib/admin/passages-queries";
import { GERMAN_AUDITION_SENTENCE } from "@/lib/passages/german-twin";

/** "Susi - Effortless and Confident" → the name and what the library says about the voice. */
function splitName(name: string): { first: string; rest: string } {
  const at = name.indexOf(" - ");
  return at === -1
    ? { first: name, rest: "" }
    : { first: name.slice(0, at), rest: name.slice(at + 3) };
}

/**
 * One German sentence read by every German voice, so an admin can hear them side by side
 * and decide who stays — before any passage is narrated (the clips here are one short
 * sentence each, made once; nothing is narrated by opening this card).
 */
export function GermanVoiceAudition({ voices }: { voices: AdminVoiceOption[] }) {
  const { sampling, toggleSample } = useVoiceSample();
  if (voices.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>German voices — listen and decide</CardTitle>
        <CardDescription>
          The same sentence, read by each of the German voices. Listen one by one and say which
          voices stay and which go; nothing is narrated until you ask.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p lang="de" className="bg-muted/50 rounded-lg border px-4 py-3 text-lg leading-relaxed">
          {GERMAN_AUDITION_SENTENCE}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {voices.map((voice) => {
            const { first, rest } = splitName(voice.name);
            const playing = sampling === voice.id;
            return (
              <li key={voice.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                <Button
                  type="button"
                  variant={playing ? "default" : "outline"}
                  size="icon-sm"
                  disabled={!voice.sampleAudioUrl}
                  onClick={() => toggleSample(voice)}
                  aria-label={playing ? `Stop ${first}` : `Listen to ${first}`}
                >
                  {playing ? <Square aria-hidden="true" /> : <Play aria-hidden="true" />}
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{first}</p>
                  {rest && <p className="text-muted-foreground truncate text-xs">{rest}</p>}
                </div>
                <Badge variant="muted">{voice.gender === "female" ? "Female" : "Male"}</Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
