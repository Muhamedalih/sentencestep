"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Play, RotateCcw, Square } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePassageAudio, setPassageVoice } from "@/lib/admin/passages-actions";
import type {
  AdminPassageDetail,
  AdminPassageRole,
  AdminVoiceOption,
} from "@/lib/admin/passages-queries";
import { NARRATOR_ROLE } from "@/lib/passages/voice-aliases";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "border-input bg-background h-9 min-w-0 flex-1 rounded-lg border px-2.5 text-sm disabled:opacity-60";

/** A round that throws (a dropped connection, a cold start) is tried again a couple of times before the run gives up — the same care the book audio button takes. */
const ATTEMPTS_PER_ROUND = 3;
/** Safety valve, not a limit: a passage has a few dozen lines, six to a round. */
const MAX_ROUNDS = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const formatNumber = (n: number) => n.toLocaleString("en-US");

function choicesOf(roles: AdminPassageRole[]): Record<string, string> {
  return Object.fromEntries(roles.map((role) => [role.role, role.voiceId ?? ""]));
}

/**
 * The voices of a passage and its narration. One voice reads the story and every
 * character has one of their own — never two the same, whether a man's or a woman's —
 * chosen here, with a sample to listen to before choosing. Narration is made with
 * ElevenLabs only when a button is pressed (it costs characters, shown before it
 * runs): the lines that have no clip yet, or all of a role's lines again after its
 * voice was changed. It runs a few lines at a time and shows how far it is.
 */
export function PassageNarrationPanel({ passage }: { passage: AdminPassageDetail }) {
  const router = useRouter();
  const [choices, setChoices] = useState(() => choicesOf(passage.roles));
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ handled: number; total: number } | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [sampling, setSampling] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // A refresh brings the saved voices back in.
  useEffect(() => setChoices(choicesOf(passage.roles)), [passage.roles]);
  useEffect(() => () => audioRef.current?.pause(), []);

  const busy = Boolean(running) || isSaving;
  const voiceById = new Map(passage.voices.map((voice) => [voice.id, voice]));
  const female = passage.voices.filter((voice) => voice.gender === "female");
  const male = passage.voices.filter((voice) => voice.gender === "male");
  const blocked = passage.problems.length > 0;

  function changeVoice(role: string, voiceId: string) {
    setMessage(null);
    setSavingRole(role);
    setChoices((current) => ({ ...current, [role]: voiceId }));
    startSaving(async () => {
      const result = await setPassageVoice({
        passageId: passage.id,
        role,
        voiceId: voiceId || null,
      });
      setSavingRole(null);
      if (result.error) {
        setChoices(choicesOf(passage.roles));
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "success", text: result.success ?? "Voice saved." });
      router.refresh();
    });
  }

  function toggleSample(voice: AdminVoiceOption | undefined) {
    if (!voice?.sampleAudioUrl) return;
    audioRef.current?.pause();
    if (sampling === voice.id) {
      setSampling(null);
      return;
    }
    const audio = new Audio(voice.sampleAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setSampling(null);
    setSampling(voice.id);
    audio.play().catch(() => setSampling(null));
  }

  async function narrate(options: { role?: string; force?: boolean }, label: string) {
    setMessage(null);
    setRunning(label);
    setProgress(null);
    let skip: string[] = [];
    let done = 0;
    let failed = 0;
    let total = 0;
    let stop: string | undefined;
    let failedReason: string | undefined;
    try {
      for (let round = 0; round < MAX_ROUNDS; round++) {
        let result: Awaited<ReturnType<typeof generatePassageAudio>> | null = null;
        for (let attempt = 0; attempt < ATTEMPTS_PER_ROUND && !result; attempt++) {
          try {
            result = await generatePassageAudio({ passageId: passage.id, ...options, skip });
          } catch {
            if (attempt < ATTEMPTS_PER_ROUND - 1) await sleep(1000 * (attempt + 1));
          }
        }
        if (!result) {
          stop =
            "Couldn't reach the server. What was narrated so far is saved — press the button again to carry on.";
          break;
        }
        done += result.done ?? 0;
        failed += result.failed ?? 0;
        failedReason = result.failedReason ?? failedReason;
        skip = [...skip, ...(result.handled ?? [])];
        if (round === 0) total = skip.length + (result.remaining ?? 0);
        setProgress({ handled: skip.length, total });
        if (result.error) {
          stop = result.error;
          break;
        }
        if (!result.remaining || (result.handled?.length ?? 0) === 0) break;
      }
    } finally {
      setRunning(null);
      setProgress(null);
      router.refresh();
    }

    const narrated = `${plural(done, "line")} narrated`;
    const lost =
      failed > 0
        ? `, ${failed} failed${failedReason ? ` (${failedReason})` : ""} — press the button again to retry just those`
        : "";
    setMessage(
      stop
        ? { kind: "error", text: `${stop} ${narrated} before it stopped.` }
        : {
            kind: failed > 0 ? "error" : "success",
            text: done === 0 && failed === 0 ? "Nothing to narrate." : `${narrated}${lost}.`,
          },
    );
  }

  function confirmAndNarrate(
    options: { role?: string; force?: boolean },
    label: string,
    lines: number,
    characters: number,
  ) {
    const replacing = options.force ? " It replaces the clips that exist." : "";
    if (
      !window.confirm(
        `Narrate ${plural(lines, "line")} with ElevenLabs (${passage.model})? This uses about ${formatNumber(characters)} ElevenLabs characters.${replacing}`,
      )
    ) {
      return;
    }
    void narrate(options, label);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Voices and narration</CardTitle>
        <CardDescription>
          One voice reads the story and every character has a voice of their own — never two the
          same, a man&apos;s or a woman&apos;s. Listen to the voices below before you choose.
          Narration is made with ElevenLabs ({passage.model}) only when you press a button, and
          costs ElevenLabs characters.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge
            variant={passage.clips === passage.lines && passage.lines > 0 ? "success" : "outline"}
          >
            {passage.clips} / {passage.lines} lines narrated
          </Badge>
          {passage.missing.lines > 0 && (
            <span className="text-muted-foreground">
              {plural(passage.missing.lines, "line")} still to narrate (
              {formatNumber(passage.missing.characters)} characters)
            </span>
          )}
        </div>

        {blocked && (
          <div role="alert" className="text-danger text-sm">
            <p className="font-medium">Narration is off until this is fixed:</p>
            <ul className="mt-1 list-disc ps-5">
              {passage.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        <details open className="rounded-lg border px-3 py-2.5">
          <summary className="cursor-pointer text-sm font-medium">Listen to the voices</summary>
          <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: "Female voices", voices: female },
              { label: "Male voices", voices: male },
            ].map((group) => (
              <div key={group.label} className="min-w-0">
                <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
                  {group.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {group.voices.map((voice) => (
                    <li key={voice.id}>
                      <button
                        type="button"
                        onClick={() => toggleSample(voice)}
                        disabled={!voice.sampleAudioUrl}
                        className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors disabled:opacity-50"
                      >
                        {sampling === voice.id ? (
                          <Square className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <Play className="size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="truncate" title={voice.name}>
                          {voice.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>

        <div className="flex flex-col gap-2">
          {passage.roles.map((role) => {
            const isNarrator = role.role === NARRATOR_ROLE;
            const chosen = choices[role.role] ?? "";
            const speaking =
              (chosen ? voiceById.get(chosen) : undefined) ?? role.speaking ?? undefined;
            const missingLines = role.lines - role.clips;
            return (
              <div
                key={role.role}
                className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[11rem_minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{isNarrator ? "Narrator" : role.role}</p>
                  <p className="text-muted-foreground text-xs">
                    {isNarrator ? "reads the story · " : ""}
                    {plural(role.lines, "line")} · {role.clips} narrated
                  </p>
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  <select
                    aria-label={`Voice of ${isNarrator ? "the narrator" : role.role}`}
                    value={chosen}
                    disabled={busy}
                    onChange={(event) => changeVoice(role.role, event.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="">
                      {isNarrator
                        ? `Site default${passage.defaultNarrator ? ` — ${passage.defaultNarrator.name}` : " (none set)"}`
                        : "Same as the narrator"}
                    </option>
                    <optgroup label="Female voices">
                      {female.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Male voices">
                      {male.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {speaking?.sampleAudioUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => toggleSample(speaking)}
                      aria-label={
                        sampling === speaking.id
                          ? "Stop the sample"
                          : "Listen to a sample of this voice"
                      }
                      title={sampling === speaking.id ? "Stop the sample" : "Listen to a sample"}
                    >
                      {sampling === speaking.id ? (
                        <Square aria-hidden="true" />
                      ) : (
                        <Play aria-hidden="true" />
                      )}
                    </Button>
                  )}
                  {speaking && (
                    <Badge variant="muted" className="hidden sm:inline-flex">
                      {speaking.gender === "female" ? "Female" : "Male"}
                    </Badge>
                  )}
                  {savingRole === role.role && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy || blocked || missingLines === 0}
                    onClick={() =>
                      confirmAndNarrate(
                        { role: role.role },
                        `${isNarrator ? "the narrator" : role.role}`,
                        missingLines,
                        // Only the missing lines are sent; their cost is the role's share of what is missing.
                        Math.round((role.characters * missingLines) / Math.max(role.lines, 1)),
                      )
                    }
                  >
                    <Mic aria-hidden="true" />
                    Narrate{missingLines > 0 ? ` (${missingLines})` : ""}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy || blocked || role.lines === 0}
                    title="Narrate all of this role's lines again — after changing its voice"
                    onClick={() =>
                      confirmAndNarrate(
                        { role: role.role, force: true },
                        `${isNarrator ? "the narrator" : role.role}`,
                        role.lines,
                        role.characters,
                      )
                    }
                  >
                    <RotateCcw aria-hidden="true" />
                    Redo all
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground text-xs">
          Changing a voice doesn&apos;t change the clips already narrated: use “Redo all” on that
          role to hear it in the new voice.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={busy || blocked || passage.missing.lines === 0}
            onClick={() =>
              confirmAndNarrate(
                {},
                "the passage",
                passage.missing.lines,
                passage.missing.characters,
              )
            }
          >
            {running ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Mic aria-hidden="true" />
            )}
            {running
              ? `Narrating ${running}…`
              : passage.missing.lines === 0
                ? "Everything is narrated"
                : `Narrate the missing lines (${passage.missing.lines})`}
          </Button>
          {progress && progress.total > 0 && (
            <div className="flex min-w-40 flex-1 items-center gap-3 text-sm">
              <div className="bg-muted h-2 max-w-64 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${Math.round((progress.handled / progress.total) * 100)}%` }}
                />
              </div>
              <span className="text-muted-foreground tabular-nums">
                {progress.handled} / {progress.total}
              </span>
            </div>
          )}
        </div>

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
