"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveLessonFontSettings } from "@/lib/admin/lesson-font-actions";
import { FONT_CHOICES } from "@/lib/admin/lesson-font-settings";
import type { FontChoice, LessonFontSettings } from "@/lib/admin/lesson-font-settings";
import { LEARNING_SECTION_LABELS, LEARNING_SECTION_NAMES } from "@/lib/admin/learning-sections";
import type { LearningSection } from "@/lib/admin/learning-sections";
import { cn } from "@/lib/utils";

/** The literal option value meaning "no override — keep that section's current default font" in each section's <select>, distinct from any real FontChoice name. */
const USE_SECTION_DEFAULT = "__default__";

/** A short, fixed sample sentence shown in each choice's preview — deliberately not locale/lesson content, since this page only exists to compare letterforms, not to preview real learner text. */
const SAMPLE_TEXT = "The quick fox reads twelve pages.";

export function LessonFontSettingsForm({ initial }: { initial: LessonFontSettings }) {
  const [sectionFonts, setSectionFonts] = useState<LessonFontSettings>(initial);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveLessonFontSettings(sectionFonts);
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
          <CardTitle className="text-lg">Font collection</CardTitle>
          <CardDescription>
            Every choice is a system font stack (no downloads, no flash of unstyled text) — legible
            at large sizes since learners must read these characters exactly to type them.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {FONT_CHOICES.map((choice) => (
            <div key={choice.key} className="border-border rounded-lg border p-3">
              <p className="text-sm font-medium">{choice.label}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{choice.description}</p>
              <p className="mt-2 truncate text-xl" style={{ fontFamily: choice.cssValue }}>
                {SAMPLE_TEXT}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section fonts</CardTitle>
          <CardDescription>
            Assign a font per section. A section left on &quot;Default&quot; keeps its exact current
            font — nothing changes there until you pick one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {LEARNING_SECTION_NAMES.map((section: LearningSection) => {
            const value = sectionFonts[section] ?? USE_SECTION_DEFAULT;
            const preview = FONT_CHOICES.find((choice) => choice.key === value)?.cssValue;
            return (
              <div key={section} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{LEARNING_SECTION_LABELS[section]}</span>
                <select
                  value={value}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSectionFonts((prev) => {
                      if (next === USE_SECTION_DEFAULT) {
                        const { [section]: _removed, ...rest } = prev;
                        return rest;
                      }
                      return { ...prev, [section]: next as FontChoice };
                    });
                  }}
                  className="border-border bg-background rounded-md border px-2.5 py-1.5 text-sm"
                >
                  <option value={USE_SECTION_DEFAULT}>Default (unchanged)</option>
                  {FONT_CHOICES.map((choice) => (
                    <option key={choice.key} value={choice.key}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {preview && (
                  <p
                    className="text-muted-foreground truncate text-sm"
                    style={{ fontFamily: preview }}
                  >
                    {SAMPLE_TEXT}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save font settings"}
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
