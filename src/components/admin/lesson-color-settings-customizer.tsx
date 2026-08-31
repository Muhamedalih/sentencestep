"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  LESSON_COLOR_REFERENCE_HEX,
  LESSON_COLOR_ROLES,
  type LessonColorRole,
  type LessonColorRoleMeta,
  type LessonColorSettings,
} from "@/lib/admin/lesson-color-settings";
import {
  resetLessonColorSettings,
  saveLessonColorSettings,
} from "@/lib/admin/lesson-color-settings-actions";

const GROUPS: LessonColorRoleMeta["group"][] = [
  "Global",
  "Lesson Player",
  "Conversation / Stories",
  "Rewards",
];

/**
 * Every role, as an inline CSS custom property assignment — handed straight
 * to the live preview's wrapper `style` so the preview reflects in-progress
 * (unsaved) edits immediately, the same way LessonCompletionThemeProvider's
 * nested provider lets the completion-screen customizer preview live. Only
 * roles present in `draft` are declared; the rest fall through to whatever
 * .lesson-shell's own defaults resolve to (see globals.css), exactly like
 * the real learner-facing render.
 */
function draftToStyle(draft: LessonColorSettings): Record<string, string> {
  const style: Record<string, string> = {};
  for (const role of LESSON_COLOR_ROLES) {
    const value = draft[role.key];
    if (value) style[role.cssVar] = value;
  }
  return style;
}

export function LessonColorSettingsCustomizer({ initial }: { initial: LessonColorSettings }) {
  const [savedSettings, setSavedSettings] = useState(initial);
  const [draft, setDraft] = useState<LessonColorSettings>(initial);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const previewStyle = useMemo(() => draftToStyle(draft), [draft]);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedSettings);

  function updateField(key: LessonColorRole, value: string | undefined) {
    setMessage(null);
    setDraft((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveLessonColorSettings(draft);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setSavedSettings(draft);
      setMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  function handleResetAll() {
    setMessage(null);
    startTransition(async () => {
      const result = await resetLessonColorSettings();
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setDraft({});
      setSavedSettings({});
      setMessage({ kind: "success", text: result.success ?? "Reset to default." });
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Live preview — a small mock of the lesson player's own visual
          language, not the real TypingText/LessonIllustration components
          (those need a full lesson session's context to render). Wrapping
          it in "lesson-shell" reuses the exact same class/cascade real
          lesson pages get, so every --lesson-* var not overridden in
          `draft` resolves to the same default a learner would see. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>
            Updates instantly as you edit below. Nothing is saved until you click Save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="lesson-shell bg-background border-border/60 overflow-hidden rounded-xl border p-6"
            style={previewStyle}
          >
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--lesson-story-label)] uppercase">
                Story
              </span>
              <div className="relative inline-flex w-fit flex-col gap-1">
                <span className="text-2xl font-semibold tracking-wide">
                  <span className="text-[var(--lesson-letter-correct)]">Good morn</span>
                  <span className="text-[var(--lesson-letter-wrong)]">i</span>
                  <span className="text-[var(--lesson-letter-pending)]">ng</span>
                </span>
                <span className="h-[3px] w-16 rounded-full bg-[var(--lesson-underline)]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary-foreground flex size-8 items-center justify-center rounded-full bg-[var(--lesson-speaker)] text-sm font-semibold">
                  A
                </span>
                <span className="flex size-8 items-center justify-center rounded-full bg-[var(--lesson-secondary)] text-sm font-semibold text-[var(--lesson-speaker)]">
                  B
                </span>
                <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                  <circle
                    cx="14"
                    cy="9"
                    r="4"
                    fill="none"
                    stroke="var(--lesson-illustration-stroke)"
                    strokeWidth="2"
                  />
                  <path
                    d="M6 24c0-5 4-8 8-8s8 3 8 8"
                    fill="none"
                    stroke="var(--lesson-illustration-stroke)"
                    strokeWidth="2"
                  />
                  <circle cx="21" cy="20" r="2.5" fill="var(--lesson-illustration-accent)" />
                </svg>
                <span className="text-sm font-medium text-[var(--lesson-xp)]">+20 XP</span>
              </div>
              <div>
                <span className="text-base font-semibold text-[var(--lesson-title)]">word</span>
                <p className="text-sm text-[var(--lesson-subtitle)]">translation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p className={cn("text-sm", message.kind === "error" ? "text-danger" : "text-success")}>
          {message.text}
        </p>
      )}

      {GROUPS.map((group) => {
        const roles = LESSON_COLOR_ROLES.filter((role) => role.group === group);
        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-lg">{group}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {roles.map((role) => (
                <RoleControl
                  key={role.key}
                  role={role}
                  value={draft[role.key]}
                  onChange={(value) => updateField(role.key, value)}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={isPending || !isDirty}>
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={handleResetAll} disabled={isPending}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset all to default
        </Button>
      </div>
    </div>
  );
}

function RoleControl({
  role,
  value,
  onChange,
}: {
  role: LessonColorRoleMeta;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const isCustom = value !== undefined;
  const referenceHex = LESSON_COLOR_REFERENCE_HEX[role.key];
  const [text, setText] = useState(value ?? referenceHex);
  useEffect(() => setText(value ?? referenceHex), [value, referenceHex]);

  return (
    <div className="border-border/60 flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{role.label}</p>
          <p className="text-muted-foreground text-xs">{role.description}</p>
        </div>
        {isCustom ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-muted-foreground hover:text-foreground shrink-0 text-xs underline underline-offset-2"
          >
            Reset
          </button>
        ) : (
          <span className="text-muted-foreground shrink-0 text-xs">Default</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isCustom ? value : referenceHex}
          onChange={(event) => onChange(event.target.value)}
          aria-label={role.label}
          className="border-border h-9 w-9 cursor-pointer rounded-md border bg-transparent p-0.5"
        />
        <Input
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
          }}
          placeholder={referenceHex}
          className="h-9 w-28 px-2 font-mono text-xs"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
