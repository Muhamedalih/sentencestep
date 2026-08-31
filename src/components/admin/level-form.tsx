"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLevel, updateLevel } from "@/lib/admin/content-actions";
import { LEARNING_MODES, modeMeta } from "@/lib/learning-modes";
import type { AdminLevel } from "@/lib/admin/content-queries";
import type { LearningMode } from "@/types/content";

/** Same optional-`initial` pattern as CategoryForm/WordGroupForm — one component for both create and edit. Mode is fixed once a level exists (see updateLevel's doc comment) and shown read-only rather than as an editable select when `initial` is set. */
export function LevelForm({ initial }: { initial?: AdminLevel }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<LearningMode>(initial?.mode ?? "normal");
  const [index, setIndex] = useState(initial ? String(initial.index) : "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleEs, setTitleEs] = useState(initial?.titleEs ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const input = { mode, index: Number(index), title, titleAr, titleEs: titleEs || undefined };
      const result = initial
        ? await updateLevel({ ...input, id: initial.id })
        : await createLevel(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (initial) {
        router.push("/admin/levels");
        router.refresh();
        return;
      }
      setIndex("");
      setTitle("");
      setTitleAr("");
      setTitleEs("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="level-mode" className="text-xs font-medium">
          Type
        </label>
        {initial ? (
          <p className="border-input bg-muted text-muted-foreground flex h-10 items-center rounded-lg border px-3 text-sm">
            {modeMeta[mode].title}
          </p>
        ) : (
          <select
            id="level-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as LearningMode)}
            className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
          >
            {LEARNING_MODES.map((option) => (
              <option key={option} value={option}>
                {modeMeta[option].title}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="level-index" className="text-xs font-medium">
          Number
        </label>
        <Input
          id="level-index"
          type="number"
          min={1}
          value={index}
          onChange={(event) => setIndex(event.target.value)}
          className="w-24"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="level-title" className="text-xs font-medium">
          Title (English)
        </label>
        <Input
          id="level-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          dir="ltr"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="level-title-ar" className="text-xs font-medium">
          Title (Arabic)
        </label>
        <Input
          id="level-title-ar"
          value={titleAr}
          onChange={(event) => setTitleAr(event.target.value)}
          dir="rtl"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="level-title-es" className="text-xs font-medium">
          Title (Spanish, optional)
        </label>
        <Input
          id="level-title-es"
          value={titleEs}
          onChange={(event) => setTitleEs(event.target.value)}
          dir="ltr"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : initial ? "Save changes" : "Add level"}
      </Button>
      {initial && (
        <Button type="button" variant="outline" onClick={() => router.push("/admin/levels")}>
          Cancel
        </Button>
      )}
      {error && (
        <p role="alert" className="text-danger w-full text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
