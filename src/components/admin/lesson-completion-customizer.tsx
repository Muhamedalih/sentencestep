"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { LessonCompletion } from "@/components/learning/lesson-completion";
import { LessonCompletionThemeProvider } from "@/components/providers/lesson-completion-theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import {
  DEFAULT_LESSON_COMPLETION_THEME,
  LESSON_COMPLETION_PRESETS,
  LESSON_COMPLETION_THEME_RANGES,
} from "@/lib/admin/lesson-completion-theme";
import type { LessonCompletionTheme } from "@/lib/admin/lesson-completion-theme";
import {
  resetLessonCompletionTheme,
  saveLessonCompletionTheme,
} from "@/lib/admin/lesson-completion-theme-actions";
import type { LessonUnit, VocabularyItem } from "@/types/content";

/** Fixed mock lesson used for the "Next lesson" card's href/label in preview states that include one — not real content, just shaped like the real thing. */
const MOCK_NEXT_LESSON: LessonUnit = {
  id: "normal-2",
  mode: "normal",
  level: 1,
  order: 2,
  title: "The Missing Umbrella",
  titleAr: "المظلة المفقودة",
  isFree: true,
  sentences: [],
};

const MOCK_VOCABULARY: VocabularyItem[] = [
  { id: "v1", en: "receipt", ar: "إيصال" },
  { id: "v2", en: "counter", ar: "طاولة" },
  { id: "v3", en: "mix-up", ar: "ارتباك" },
];

const XP_SCENARIOS = [
  { label: "Same-level gain", xp: 635, xpEarned: 20 },
  { label: "Level-up crossing", xp: 635, xpEarned: 55 },
] as const;

type PreviewState = "with-mistakes" | "no-mistakes" | "no-next-lesson";

const STATE_OPTIONS: { id: PreviewState; label: string; description: string }[] = [
  {
    id: "with-mistakes",
    label: "State A — With mistakes",
    description: "Outstanding mistakes and a next lesson available: all three action cards render.",
  },
  {
    id: "no-mistakes",
    label: "State B — No mistakes",
    description:
      "No outstanding mistakes: Fix Mistakes is omitted, exactly as the real screen does.",
  },
  {
    id: "no-next-lesson",
    label: "State C — No next lesson",
    description:
      "Last lesson in the mode: Next Lesson is omitted, exactly as the real screen does.",
  },
];

type ColorKey = {
  [K in keyof LessonCompletionTheme]: LessonCompletionTheme[K] extends string ? K : never;
}[keyof LessonCompletionTheme];
type NumberKey = keyof typeof LESSON_COMPLETION_THEME_RANGES;

const MAIN_COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "colorBackground", label: "Background" },
  { key: "colorTextPrimary", label: "Primary text" },
  { key: "colorTextSecondary", label: "Secondary text" },
  { key: "colorBorder", label: "Hairline / border" },
];

const ACCENT_COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "colorAccent", label: "Accent (primary button, earned XP, rewards)" },
  { key: "colorXp", label: "XP bar fill" },
];

const TYPOGRAPHY_FIELDS: { key: NumberKey; label: string; unit: string }[] = [
  { key: "heroNumberSize", label: "Accuracy number size", unit: "px" },
  { key: "headingSize", label: "Heading size", unit: "px" },
  { key: "bodySize", label: "Body text size", unit: "px" },
  { key: "statSize", label: "Stat number size", unit: "px" },
  { key: "actionCardTextSize", label: "Button text size", unit: "px" },
  { key: "headingWeight", label: "Heading font weight", unit: "" },
  { key: "bodyWeight", label: "Body font weight", unit: "" },
];

const LAYOUT_FIELDS: { key: NumberKey; label: string; unit: string }[] = [
  { key: "contentWidth", label: "Content width", unit: "px" },
  { key: "sectionSpacing", label: "Section spacing", unit: "px" },
  { key: "cardSpacing", label: "Button spacing", unit: "px" },
  { key: "cardPadding", label: "Padding", unit: "px" },
  { key: "actionCardHeight", label: "Button height (scales both sizes)", unit: "px" },
  { key: "actionCardRadius", label: "Button corner radius", unit: "px" },
  { key: "headerSpacing", label: "Hero spacing", unit: "px" },
  { key: "borderOpacity", label: "Hairline strength", unit: "%" },
];

const XP_FIELDS: { key: NumberKey; label: string; unit: string }[] = [
  { key: "xpAnimationDuration", label: "Fill animation duration", unit: "ms" },
  { key: "progressBarHeight", label: "Bar height", unit: "px" },
  { key: "progressBarRadius", label: "Bar radius", unit: "px" },
];

const VOCAB_FIELDS: { key: NumberKey; label: string; unit: string }[] = [
  { key: "chipRadius", label: "Chip radius", unit: "px" },
  { key: "chipSpacing", label: "Chip spacing", unit: "px" },
];

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="border-border h-9 w-9 cursor-pointer rounded-md border bg-transparent p-0.5"
        />
        <Input
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
          }}
          className="h-9 w-24 px-2 font-mono text-xs"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-primary w-full"
      />
    </div>
  );
}

function TextControl({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9"
      />
    </div>
  );
}

/**
 * The Admin → Lesson Completion customization panel: a live-editable
 * LessonCompletionTheme (see src/lib/admin/lesson-completion-theme.ts) with
 * controls for every field the current flat, near-monochrome design
 * actually reads, a real LessonCompletion preview that reflects every edit
 * immediately (via a nested LessonCompletionThemeProvider — see that
 * provider's doc comment), Save/Reset actions backed by the
 * lesson_completion_theme table, and four one-click presets. Deliberately
 * has no glow/gradient/hover-effect/multi-color controls — this design has
 * none of those, so a control for one would silently do nothing, which is
 * worse than not having it. Nothing here reads or writes XP, progress,
 * mistakes, or navigation — every field it touches is purely visual.
 */
export function LessonCompletionCustomizer({ initial }: { initial: LessonCompletionTheme }) {
  const [savedTheme, setSavedTheme] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [previewState, setPreviewState] = useState<PreviewState>("with-mistakes");
  const [xpScenarioIndex, setXpScenarioIndex] = useState(0);
  const [replayCount, setReplayCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedTheme),
    [draft, savedTheme],
  );

  function updateField<K extends keyof LessonCompletionTheme>(
    key: K,
    value: LessonCompletionTheme[K],
  ) {
    setMessage(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(theme: LessonCompletionTheme) {
    setMessage(null);
    setDraft(theme);
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveLessonCompletionTheme(draft);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setSavedTheme(draft);
      setMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  function handleReset() {
    setMessage(null);
    startTransition(async () => {
      const result = await resetLessonCompletionTheme();
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setDraft(DEFAULT_LESSON_COMPLETION_THEME);
      setSavedTheme(DEFAULT_LESSON_COMPLETION_THEME);
      setMessage({ kind: "success", text: result.success ?? "Reset to default." });
    });
  }

  function replayXpAnimation() {
    setXpScenarioIndex((index) => (index + 1) % XP_SCENARIOS.length);
    setReplayCount((count) => count + 1);
  }

  const hasMistakes = previewState === "with-mistakes" || previewState === "no-next-lesson";
  const hasNextLesson = previewState !== "no-next-lesson";
  const activeOption =
    STATE_OPTIONS.find((option) => option.id === previewState) ?? STATE_OPTIONS[0]!;
  const xpScenario = XP_SCENARIOS[xpScenarioIndex]!;
  const learnerLevel = getLearnerLevel(xpScenario.xp);

  return (
    <div className="flex flex-col gap-8">
      {/* Live preview */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {STATE_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={option.id === previewState ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewState(option.id)}
              className="h-auto justify-start px-4 py-2.5 text-left"
            >
              {option.label}
            </Button>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={replayXpAnimation}>
            Replay XP animation ({xpScenario.label} next)
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">{activeOption.description}</p>

        <div className="border-border mx-auto w-full max-w-3xl overflow-y-auto rounded-2xl border lg:h-[860px]">
          <LessonCompletionThemeProvider theme={draft}>
            <LessonCompletion
              key={replayCount}
              mode="normal"
              accuracy={0.97}
              wpm={42}
              nextLesson={hasNextLesson ? MOCK_NEXT_LESSON : undefined}
              vocabulary={MOCK_VOCABULARY}
              streak={5}
              xp={xpScenario.xp}
              xpEarned={xpScenario.xpEarned}
              learnerLevel={learnerLevel}
              rewards={hasMistakes ? [{ type: "lessonCountMilestone", count: 1 }] : []}
              mistakeCount={hasMistakes ? 4 : 0}
              onFixMistakes={hasMistakes ? () => {} : undefined}
              saveStatus="saved"
            />
          </LessonCompletionThemeProvider>
        </div>
        <p className="text-muted-foreground text-xs">
          Mock data only — nothing here reads or writes real progress. Every control below updates
          this preview immediately; nothing is saved until you click Save changes.
        </p>
      </div>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Presets</CardTitle>
          <CardDescription>
            Apply a complete accent instantly, then fine-tune below. Visual only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {LESSON_COMPLETION_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.theme)}
            >
              {preset.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Colors</CardTitle>
          <CardDescription>
            The screen is near-monochrome text on a dark background.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {MAIN_COLOR_FIELDS.map(({ key, label }) => (
            <ColorControl
              key={key}
              label={label}
              value={draft[key]}
              onChange={(v) => updateField(key, v)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Accent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accent color</CardTitle>
          <CardDescription>
            The one color used decoratively on this screen — the primary button, the XP bar, the
            earned-XP stat, and the rewards line. Everything else stays neutral.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {ACCENT_COLOR_FIELDS.map(({ key, label }) => (
            <ColorControl
              key={key}
              label={label}
              value={draft[key]}
              onChange={(v) => updateField(key, v)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Typography</CardTitle>
          <CardDescription>
            Text sizes and weights, including the big accuracy number.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {TYPOGRAPHY_FIELDS.map(({ key, label, unit }) => {
            const range = LESSON_COMPLETION_THEME_RANGES[key];
            return (
              <SliderControl
                key={key}
                label={label}
                unit={unit}
                min={range.min}
                max={range.max}
                step={range.step}
                value={draft[key]}
                onChange={(v) => updateField(key, v)}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Layout / spacing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Layout &amp; spacing</CardTitle>
          <CardDescription>Overall width, gaps, padding, and button sizing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {LAYOUT_FIELDS.map(({ key, label, unit }) => {
            const range = LESSON_COMPLETION_THEME_RANGES[key];
            return (
              <SliderControl
                key={key}
                label={label}
                unit={unit}
                min={range.min}
                max={range.max}
                step={range.step}
                value={draft[key]}
                onChange={(v) => updateField(key, v)}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Completion header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completion header</CardTitle>
          <CardDescription>The heading text below the accuracy number.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextControl
            label="Heading text"
            value={draft.headingText}
            placeholder="Default: lesson complete message"
            onChange={(v) => updateField("headingText", v)}
          />
        </CardContent>
      </Card>

      {/* XP section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">XP bar</CardTitle>
          <CardDescription>Fill color lives under Accent color above.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {XP_FIELDS.map(({ key, label, unit }) => {
            const range = LESSON_COMPLETION_THEME_RANGES[key];
            return (
              <SliderControl
                key={key}
                label={label}
                unit={unit}
                min={range.min}
                max={range.max}
                step={range.step}
                value={draft[key]}
                onChange={(v) => updateField(key, v)}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Vocabulary section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vocabulary section</CardTitle>
          <CardDescription>The word-chips row shown when a lesson has vocabulary.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextControl
            label="Section title"
            value={draft.vocabTitle}
            placeholder="Default: vocabulary heading"
            onChange={(v) => updateField("vocabTitle", v)}
          />
          {VOCAB_FIELDS.map(({ key, label, unit }) => {
            const range = LESSON_COMPLETION_THEME_RANGES[key];
            return (
              <SliderControl
                key={key}
                label={label}
                unit={unit}
                min={range.min}
                max={range.max}
                step={range.step}
                value={draft[key]}
                onChange={(v) => updateField(key, v)}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Save / reset */}
      <div className="bg-background sticky bottom-4 flex items-center gap-3 rounded-xl border p-4 shadow-lg">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} disabled={isPending}>
          Reset to default
        </Button>
        {isDirty && !message && (
          <span className="text-muted-foreground text-sm">
            Unsaved changes — preview only until saved.
          </span>
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
      </div>
    </div>
  );
}
