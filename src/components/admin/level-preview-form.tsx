"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLevelPreview } from "@/lib/admin/content-actions";
import type { PreviewSentence } from "@/types/content";

/**
 * Editor for a level's "Start Simple" homepage preview sentences (see
 * getStartSimplePreviews in src/lib/content.ts) — separate from the main
 * level row since it edits a different field (preview_sentences) with its
 * own shape, not the level's title/index.
 */
export function LevelPreviewForm({
  levelId,
  initial,
}: {
  levelId: string;
  initial: PreviewSentence[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sentences, setSentences] = useState<PreviewSentence[]>(
    initial.length > 0 ? initial : [{ en: "", ar: "", es: "" }],
  );

  function update(index: number, patch: Partial<PreviewSentence>) {
    setSentences((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function add() {
    setSentences((prev) => [...prev, { en: "", ar: "", es: "" }]);
  }

  function remove(index: number) {
    setSentences((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateLevelPreview(levelId, sentences);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {sentences.map((sentence, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={sentence.en}
            onChange={(event) => update(index, { en: event.target.value })}
            placeholder="English"
            dir="ltr"
            className="sm:flex-1"
          />
          <Input
            value={sentence.ar}
            onChange={(event) => update(index, { ar: event.target.value })}
            placeholder="Arabic"
            dir="rtl"
            className="sm:flex-1"
          />
          <Input
            value={sentence.es ?? ""}
            onChange={(event) => update(index, { es: event.target.value })}
            placeholder="Spanish (optional)"
            dir="ltr"
            className="sm:flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            disabled={sentences.length === 1}
            aria-label="Remove preview sentence"
            className="shrink-0"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={add} className="w-fit">
          Add sentence
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save preview"}
        </Button>
        {error && (
          <p role="alert" className="text-danger w-full text-sm">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
