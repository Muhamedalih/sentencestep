"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { LessonImageField } from "@/components/admin/lesson-image-field";
import { LessonTranslationField } from "@/components/admin/lesson-translation-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SpeakerVoicesField } from "@/components/admin/speaker-voices-field";
import { saveLesson } from "@/lib/admin/content-actions";
import type { LessonMutationInput } from "@/lib/admin/content-actions";
import type { AdminLessonDetail, AdminLevel } from "@/lib/admin/content-queries";
import type { EnabledLocaleOption } from "@/lib/admin/translation-queries";
import type { ContentStatus, SentenceInput } from "@/lib/admin/validation";
import type { VoiceRow } from "@/lib/admin/voices-queries";
import { LEARNING_MODES, modeMeta } from "@/lib/learning-modes";
import type { LearningMode } from "@/types/content";

interface LessonFormProps {
  levels: AdminLevel[];
  initial?: AdminLessonDetail;
  defaultMode?: LearningMode;
  voices: VoiceRow[];
  enabledLocales: EnabledLocaleOption[];
  /** ElevenLabs-sourced voices only, for the Speaker Voices picker below — empty until a Conversation lesson already exists (see the edit page's own fetch, which skips this entirely for other modes). */
  elevenlabsVoices?: VoiceRow[];
  /** This Conversation lesson's current speaker -> voice_id assignments (lesson_speaker_voices) — empty for a brand-new, unsaved lesson. */
  speakerVoiceMap?: Record<string, string>;
}

function emptySentence(mode: LearningMode, index: number): SentenceInput {
  return {
    en: "",
    ar: "",
    es: "",
    tr: "",
    speaker: mode === "conversation" ? (index % 2 === 0 ? "A" : "B") : undefined,
    audioUrl: null,
  };
}

export function LessonForm({
  levels,
  initial,
  defaultMode,
  voices,
  enabledLocales,
  elevenlabsVoices = [],
  speakerVoiceMap = {},
}: LessonFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Spanish/Turkish (and, when a description is present, Arabic too) are
  // only required for a lesson that doesn't exist yet — editing one of the
  // pre-existing lessons must never be blocked on backfilling translations
  // it doesn't have (see validateLessonInput's isNewContent, the
  // server-side authority this mirrors for UX only).
  const isNew = !initial;

  const [mode, setMode] = useState<LearningMode>(initial?.mode ?? defaultMode ?? "normal");
  const [levelId, setLevelId] = useState(initial?.levelId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleEs, setTitleEs] = useState(initial?.titleEs ?? "");
  const [titleTr, setTitleTr] = useState(initial?.titleTr ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? "");
  const [descriptionEs, setDescriptionEs] = useState(initial?.descriptionEs ?? "");
  const [descriptionTr, setDescriptionTr] = useState(initial?.descriptionTr ?? "");
  const [orderIndex, setOrderIndex] = useState(initial ? String(initial.orderIndex) : "");
  const [isFree, setIsFree] = useState(initial?.isFree ?? true);
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "draft");
  const [voiceId, setVoiceId] = useState<string>(initial?.voiceId ?? "");
  const [sentences, setSentences] = useState<SentenceInput[]>(
    initial?.sentences.map((s) => ({
      en: s.en,
      ar: s.ar,
      es: s.es,
      tr: s.tr,
      speaker: s.speaker ?? undefined,
      audioUrl: s.audioUrl ?? null,
    })) ?? [emptySentence(mode, 0)],
  );
  // Every sentence starts expanded (unchanged behavior for short lessons);
  // collapsing is purely a display concern, never touches the field values
  // above, so it can't affect validation or saving.
  const [collapsedSentences, setCollapsedSentences] = useState<Set<number>>(new Set());
  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Descriptions stay fully optional; but the moment an English description
  // is typed, its Arabic/Spanish/Turkish counterparts become required
  // together on a new lesson (matching validateLessonInput) — never on an
  // edit of an existing one.
  const descriptionTranslationsRequired = isNew && description.trim().length > 0;

  const levelsForMode = levels.filter((level) => level.mode === mode);

  const voicesByCollection: [string, VoiceRow[]][] = [];
  for (const voice of voices) {
    const existing = voicesByCollection.find(([collection]) => collection === voice.collection);
    if (existing) existing[1].push(voice);
    else voicesByCollection.push([voice.collection, [voice]]);
  }

  function updateSentence(index: number, patch: Partial<SentenceInput>) {
    setSentences((prev) =>
      prev.map((sentence, i) => (i === index ? { ...sentence, ...patch } : sentence)),
    );
  }

  function addSentence() {
    setSentences((prev) => [...prev, emptySentence(mode, prev.length)]);
  }

  function removeSentence(index: number) {
    setSentences((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSentence(index: number, direction: -1 | 1) {
    setSentences((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const moved = next[index]!;
      next[index] = next[target]!;
      next[target] = moved;
      return next;
    });
  }

  function toggleSentenceCollapsed(index: number) {
    setCollapsedSentences((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function jumpToSentence(index: number) {
    setCollapsedSentences((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    // Collapsing/expanding is synchronous state, but the newly-expanded
    // block's height only lands in the DOM on the next paint — scrolling
    // one tick later (rather than in the same call) so it lands on the
    // final expanded position instead of the still-collapsed one.
    requestAnimationFrame(() => {
      sentenceRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const input: LessonMutationInput = {
      id: initial?.id,
      mode,
      levelId,
      title,
      titleAr,
      titleEs: titleEs || undefined,
      titleTr: titleTr || undefined,
      description: description || undefined,
      descriptionAr: descriptionAr || undefined,
      descriptionEs: descriptionEs || undefined,
      descriptionTr: descriptionTr || undefined,
      orderIndex: Number(orderIndex),
      isFree,
      status,
      sentences,
      voiceId: voiceId || null,
    };

    startTransition(async () => {
      const result = await saveLesson(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/content");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="mode">
            <select
              id="mode"
              value={mode}
              onChange={(event) => {
                const nextMode = event.target.value as LearningMode;
                setMode(nextMode);
                setLevelId("");
              }}
              disabled={Boolean(initial)}
              className="border-input bg-background h-11 rounded-lg border px-3 text-sm disabled:opacity-60"
            >
              {LEARNING_MODES.map((option) => (
                <option key={option} value={option}>
                  {modeMeta[option].title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Level" htmlFor="level">
            <select
              id="level"
              value={levelId}
              onChange={(event) => setLevelId(event.target.value)}
              className="border-input bg-background h-11 rounded-lg border px-3 text-sm"
              required
            >
              <option value="" disabled>
                Select a level…
              </option>
              {levelsForMode.map((level) => (
                <option key={level.id} value={level.id}>
                  Level {level.index} — {level.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Title (English)" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              dir="ltr"
              required
            />
          </Field>

          <Field label="Title (Arabic)" htmlFor="titleAr">
            <Input
              id="titleAr"
              value={titleAr}
              onChange={(event) => setTitleAr(event.target.value)}
              dir="rtl"
              required
            />
          </Field>

          <Field label={isNew ? "Title (Spanish)" : "Title (Spanish, optional)"} htmlFor="titleEs">
            <Input
              id="titleEs"
              value={titleEs}
              onChange={(event) => setTitleEs(event.target.value)}
              dir="ltr"
              required={isNew}
              placeholder={
                isNew
                  ? undefined
                  : "Optional — falls back to English for Spanish learners until set"
              }
            />
          </Field>

          <Field label={isNew ? "Title (Turkish)" : "Title (Turkish, optional)"} htmlFor="titleTr">
            <Input
              id="titleTr"
              value={titleTr}
              onChange={(event) => setTitleTr(event.target.value)}
              dir="ltr"
              required={isNew}
              placeholder={
                isNew
                  ? undefined
                  : "Optional — falls back to English for Turkish learners until set"
              }
            />
          </Field>

          <Field label="Description (English)" htmlFor="description" className="sm:col-span-2">
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              dir="ltr"
              rows={2}
              placeholder="A short, engaging blurb shown on the lesson card…"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>

          <Field
            label={
              descriptionTranslationsRequired
                ? "Description (Arabic)"
                : "Description (Arabic, optional)"
            }
            htmlFor="descriptionAr"
            className="sm:col-span-2"
          >
            <textarea
              id="descriptionAr"
              value={descriptionAr}
              onChange={(event) => setDescriptionAr(event.target.value)}
              dir="rtl"
              rows={2}
              required={descriptionTranslationsRequired}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>

          <Field
            label={
              descriptionTranslationsRequired
                ? "Description (Spanish)"
                : "Description (Spanish, optional)"
            }
            htmlFor="descriptionEs"
            className="sm:col-span-2"
          >
            <textarea
              id="descriptionEs"
              value={descriptionEs}
              onChange={(event) => setDescriptionEs(event.target.value)}
              dir="ltr"
              rows={2}
              required={descriptionTranslationsRequired}
              placeholder="Optional — falls back to English for Spanish learners until set"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>

          <Field
            label={
              descriptionTranslationsRequired
                ? "Description (Turkish)"
                : "Description (Turkish, optional)"
            }
            htmlFor="descriptionTr"
            className="sm:col-span-2"
          >
            <textarea
              id="descriptionTr"
              value={descriptionTr}
              onChange={(event) => setDescriptionTr(event.target.value)}
              dir="ltr"
              rows={2}
              required={descriptionTranslationsRequired}
              placeholder="Optional — falls back to English for Turkish learners until set"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>

          <Field label="Order" htmlFor="order">
            <Input
              id="order"
              type="number"
              min={1}
              value={orderIndex}
              onChange={(event) => setOrderIndex(event.target.value)}
              required
            />
          </Field>

          <Field label="Status" htmlFor="status">
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ContentStatus)}
              className="border-input bg-background h-11 rounded-lg border px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>

          <Field label="Voice" htmlFor="voice">
            <select
              id="voice"
              value={voiceId}
              onChange={(event) => setVoiceId(event.target.value)}
              className="border-input bg-background h-11 rounded-lg border px-3 text-sm"
            >
              <option value="">Use Default Voice</option>
              {voicesByCollection.map(([collection, group]) => (
                <optgroup key={collection} label={collection}>
                  {group.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} — {voice.gender === "female" ? "Female" : "Male"} /{" "}
                      {voice.accent}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          {mode === "conversation" && initial && (
            <div className="sm:col-span-2">
              <SpeakerVoicesField
                lessonId={initial.id}
                voices={elevenlabsVoices}
                initial={speakerVoiceMap}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(event) => setIsFree(event.target.checked)}
              className="accent-primary size-4"
            />
            Free (unchecked = Premium)
          </label>

          <LessonImageField
            lessonId={initial?.id}
            mode={mode}
            initialUrl={initial?.illustrationUrl ?? null}
          />

          <LessonTranslationField lessonId={initial?.id} locales={enabledLocales} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sentences</CardTitle>
          <CardDescription>Order here is exactly the order learners see.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sentences.length > 3 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground mr-1 font-medium">Jump to:</span>
              {sentences.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => jumpToSentence(index)}
                  className="border-input bg-background hover:bg-muted flex size-7 items-center justify-center rounded-md border font-medium tabular-nums"
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
          {sentences.map((sentence, index) => {
            const isCollapsed = collapsedSentences.has(index);
            return (
              <div
                key={index}
                ref={(el) => {
                  sentenceRefs.current[index] = el;
                }}
                className="border-border scroll-mt-20 rounded-lg border p-4"
              >
                <div
                  className={
                    isCollapsed
                      ? "flex items-center justify-between"
                      : "mb-3 flex items-center justify-between"
                  }
                >
                  <button
                    type="button"
                    onClick={() => toggleSentenceCollapsed(index)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? (
                      <ChevronDown
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronUp
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-muted-foreground shrink-0 text-xs font-semibold">
                      Sentence {index + 1}
                    </span>
                    {isCollapsed && (
                      <span className="text-muted-foreground truncate text-sm" dir="ltr">
                        {sentence.en || "(empty)"}
                      </span>
                    )}
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSentence(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSentence(index, 1)}
                      disabled={index === sentences.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSentence(index)}
                      disabled={sentences.length === 1}
                      aria-label="Remove sentence"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mode === "conversation" && (
                      <Field
                        label="Speaker"
                        htmlFor={`speaker-${index}`}
                        className="sm:col-span-2 sm:w-32"
                      >
                        <select
                          id={`speaker-${index}`}
                          value={sentence.speaker ?? "A"}
                          onChange={(event) =>
                            updateSentence(index, { speaker: event.target.value })
                          }
                          className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                      </Field>
                    )}
                    <Field label="English" htmlFor={`en-${index}`}>
                      <Input
                        id={`en-${index}`}
                        value={sentence.en}
                        onChange={(event) => updateSentence(index, { en: event.target.value })}
                        dir="ltr"
                        required
                      />
                    </Field>
                    <Field label="Arabic" htmlFor={`ar-${index}`}>
                      <Input
                        id={`ar-${index}`}
                        value={sentence.ar}
                        onChange={(event) => updateSentence(index, { ar: event.target.value })}
                        dir="rtl"
                        required
                      />
                    </Field>
                    <Field label={isNew ? "Spanish" : "Spanish (optional)"} htmlFor={`es-${index}`}>
                      <Input
                        id={`es-${index}`}
                        value={sentence.es ?? ""}
                        onChange={(event) => updateSentence(index, { es: event.target.value })}
                        dir="ltr"
                        required={isNew}
                        placeholder={
                          isNew ? undefined : "Falls back to English for Spanish learners until set"
                        }
                      />
                    </Field>
                    <Field label={isNew ? "Turkish" : "Turkish (optional)"} htmlFor={`tr-${index}`}>
                      <Input
                        id={`tr-${index}`}
                        value={sentence.tr ?? ""}
                        onChange={(event) => updateSentence(index, { tr: event.target.value })}
                        dir="ltr"
                        required={isNew}
                        placeholder={
                          isNew ? undefined : "Falls back to English for Turkish learners until set"
                        }
                      />
                    </Field>
                    <Field
                      label="Audio URL (optional)"
                      htmlFor={`audio-${index}`}
                      className="sm:col-span-2"
                    >
                      <Input
                        id={`audio-${index}`}
                        value={sentence.audioUrl ?? ""}
                        onChange={(event) =>
                          updateSentence(index, { audioUrl: event.target.value || null })
                        }
                        placeholder="https://... (leave blank to use built-in pronunciation)"
                        dir="ltr"
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={addSentence} className="w-fit">
            Add sentence
          </Button>
        </CardContent>
      </Card>

      <div className="bg-background/95 sticky bottom-0 z-10 -mx-6 flex flex-col gap-2 border-t px-6 py-4 supports-[backdrop-filter]:backdrop-blur">
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : initial ? "Save changes" : "Create content"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/content")}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
