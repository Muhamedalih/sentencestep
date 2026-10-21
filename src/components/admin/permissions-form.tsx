"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROLLOUT_IDS, ROLLOUTS } from "@/lib/rollouts/catalog";
import type { RolloutDef } from "@/lib/rollouts/catalog";
import type { RolloutConfig, RolloutEntry, RolloutMode } from "@/lib/rollouts/config";
import { saveRolloutAction, setRolloutPreviewAction } from "@/lib/rollouts/actions";
import { cn } from "@/lib/utils";

type Message = { kind: "success" | "error"; text: string } | null;

function modeOptions(def: RolloutDef): { value: RolloutMode; label: string; hint: string }[] {
  const visitor = def.audience === "visitor";
  return [
    { value: "admin", label: "Admins only", hint: "Nobody but admins sees it" },
    ...(visitor
      ? []
      : [
          {
            value: "emails" as const,
            label: "Specific people",
            hint: "Admins, plus the people whose email you list",
          },
        ]),
    {
      value: "everyone",
      label: visitor ? "A share of new visitors" : "Everyone",
      hint: visitor ? "A percentage of first-time visitors" : "Every learner and guest",
    },
  ];
}

function statusLabel(def: RolloutDef, mode: RolloutMode, people: number, percent: number): string {
  if (mode === "admin") return "Admins only";
  if (mode === "emails") return `${people} ${people === 1 ? "person" : "people"}`;
  return def.audience === "visitor" ? `${percent}% of new visitors` : "Everyone";
}

function RolloutCard({
  def,
  initial,
  serverNote,
  disabled,
}: {
  def: RolloutDef;
  initial: RolloutEntry;
  serverNote?: string;
  disabled: boolean;
}) {
  const [mode, setMode] = useState<RolloutMode>(initial.mode);
  const [percent, setPercent] = useState(initial.percent);
  const [emailsText, setEmailsText] = useState(initial.emails.join("\n"));
  const [savedStatus, setSavedStatus] = useState(
    statusLabel(def, initial.mode, initial.emails.length, initial.percent),
  );
  const [message, setMessage] = useState<Message>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveRolloutAction({ feature: def.id, mode, percent, emailsText });
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      const people = emailsText.split(/[\s,;]+/).filter(Boolean).length;
      setSavedStatus(statusLabel(def, mode, people, percent));
      setMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-lg">{def.title}</CardTitle>
          <Badge variant={savedStatus === "Admins only" ? "muted" : "default"}>{savedStatus}</Badge>
          <Badge variant="secondary">
            {def.audience === "visitor" ? "First-time visitors" : "Learners and guests"}
          </Badge>
        </div>
        <CardDescription>{def.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {def.notes.length > 0 && (
          <ul className="text-muted-foreground list-disc space-y-1 ps-5 text-sm">
            {def.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
        {serverNote && <p className="text-sm font-medium">{serverNote}</p>}

        <div role="radiogroup" aria-label={`${def.title} access`} className="flex flex-wrap gap-2">
          {modeOptions(def).map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={mode === option.value}
              title={option.hint}
              onClick={() => setMode(option.value)}
              className={cn(
                "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                mode === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {mode === "emails" && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Emails (one per line, or separated by commas)</span>
            <textarea
              value={emailsText}
              onChange={(event) => setEmailsText(event.target.value)}
              rows={Math.min(12, Math.max(4, emailsText.split("\n").length + 1))}
              spellCheck={false}
              dir="ltr"
              placeholder="name@gmail.com"
              className="border-border bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2"
            />
            <span className="text-muted-foreground text-xs">
              They get it when they are signed in with that address. Admins always have it.
            </span>
          </label>
        )}

        {mode === "everyone" && def.audience === "visitor" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Share of new visitors (%)</span>
            <Input
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (Number.isFinite(parsed)) setPercent(parsed);
              }}
              className="w-28"
            />
          </label>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleSave} disabled={isPending || disabled}>
            {isPending ? "Saving…" : "Save"}
          </Button>
          {message && (
            <p
              role="status"
              className={cn("text-sm", message.kind === "error" ? "text-danger" : "text-success")}
            >
              {message.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PermissionsForm({
  initial,
  previewActive,
  remindersServerOn,
  tableReady,
}: {
  initial: RolloutConfig;
  previewActive: boolean;
  remindersServerOn: boolean;
  tableReady: boolean;
}) {
  const [preview, setPreview] = useState(previewActive);
  const [previewMessage, setPreviewMessage] = useState<Message>(null);
  const [isPending, startTransition] = useTransition();

  function togglePreview() {
    setPreviewMessage(null);
    startTransition(async () => {
      const result = await setRolloutPreviewAction(!preview);
      if (result.error) {
        setPreviewMessage({ kind: "error", text: result.error });
        return;
      }
      setPreview(!preview);
      setPreviewMessage({ kind: "success", text: result.success ?? "Done." });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {!tableReady && (
        <Card className="border-danger/40">
          <CardContent className="text-sm">
            The permissions table doesn&apos;t exist yet (migration 20250346000000_rollouts.sql), so
            every feature below is Admins only and changes can&apos;t be saved until it is applied.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview in this browser</CardTitle>
          <CardDescription>
            Shows every feature below to THIS browser for 7 days, even when you are signed out — how
            you check what a guest sees before giving it to anyone. It works only on a browser you
            switch it on in from here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={preview ? "outline" : "default"}
            onClick={togglePreview}
            disabled={isPending}
          >
            {preview ? "Turn preview off" : "Turn preview on"}
          </Button>
          <Badge variant={preview ? "default" : "muted"}>
            {preview ? "On in this browser" : "Off"}
          </Badge>
          {previewMessage && (
            <p
              role="status"
              className={cn(
                "text-sm",
                previewMessage.kind === "error" ? "text-danger" : "text-success",
              )}
            >
              {previewMessage.text}
            </p>
          )}
        </CardContent>
      </Card>

      {ROLLOUT_IDS.map((id) => (
        <RolloutCard
          key={id}
          def={ROLLOUTS[id]}
          initial={initial[id]}
          disabled={!tableReady}
          serverNote={
            id === "sessionReminders"
              ? remindersServerOn
                ? "Server: reminder emails are switched ON (SESSION_REMINDER_MAX_PER_RUN is set)."
                : "Server: reminder emails are OFF (SESSION_REMINDER_MAX_PER_RUN is not set), so the card is not offered to anyone yet."
              : undefined
          }
        />
      ))}
    </div>
  );
}
