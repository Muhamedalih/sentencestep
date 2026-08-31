"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWordGroup, updateWordGroup } from "@/lib/admin/word-lists-actions";
import type { WordGroupStatus } from "@/lib/admin/word-lists-validation";
import type { AdminWordGroup } from "@/lib/admin/word-lists-queries";

/** Same optional-`initial` pattern as CategoryForm/LessonForm — one component for both create and edit. */
export function WordGroupForm({ initial }: { initial?: AdminWordGroup }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [level, setLevel] = useState(String(initial?.level ?? 1));
  const [orderIndex, setOrderIndex] = useState(String(initial?.orderIndex ?? 0));
  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? "");
  const [isFree, setIsFree] = useState(initial?.isFree ?? false);
  const [status, setStatus] = useState<WordGroupStatus>(initial?.status ?? "draft");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const input = {
        level: Number(level),
        orderIndex: Number(orderIndex),
        title,
        titleAr,
        description: description || undefined,
        descriptionAr: descriptionAr || undefined,
        isFree,
        status,
      };
      const result = initial
        ? await updateWordGroup({ ...input, id: initial.id })
        : await createWordGroup(input);

      if (result.error) {
        setError(result.error);
        return;
      }
      if (initial) {
        router.refresh();
      } else if (result.id) {
        router.push(`/admin/word-lists/${result.id}/edit`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" htmlFor="group-title">
          <Input
            id="group-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            dir="ltr"
            required
          />
        </Field>
        <Field label="Arabic title" htmlFor="group-title-ar">
          <Input
            id="group-title-ar"
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            dir="rtl"
            required
          />
        </Field>
        <Field label="Description (optional)" htmlFor="group-description">
          <Input
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            dir="ltr"
          />
        </Field>
        <Field label="Arabic description (optional)" htmlFor="group-description-ar">
          <Input
            id="group-description-ar"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            dir="rtl"
          />
        </Field>
        <Field label="Level" htmlFor="group-level">
          <select
            id="group-level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          >
            <option value="1">1 — Beginner</option>
            <option value="2">2 — Intermediate</option>
            <option value="3">3 — Advanced</option>
          </select>
        </Field>
        <Field label="Order" htmlFor="group-order">
          <Input
            id="group-order"
            type="number"
            min={0}
            value={orderIndex}
            onChange={(e) => setOrderIndex(e.target.value)}
            required
          />
        </Field>
        <Field label="Status" htmlFor="group-status">
          <select
            id="group-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as WordGroupStatus)}
            className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="accent-primary size-4"
          />
          Free (unchecked = Premium)
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : initial ? "Save changes" : "Create group"}
        </Button>
        {initial && (
          <Button type="button" variant="outline" onClick={() => router.push("/admin/word-lists")}>
            Back to list
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
