"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory, updateCategory } from "@/lib/admin/library-actions";
import type { AdminCategory } from "@/lib/admin/library-queries";

/** Same optional-`initial` pattern as LessonForm/LevelForm — one component for both create (no `initial`) and edit (`initial` set), redirecting back to the list on success either way. */
export function CategoryForm({ initial }: { initial?: AdminCategory }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [orderIndex, setOrderIndex] = useState(String(initial?.orderIndex ?? 0));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const input = {
        name,
        description: description || undefined,
        orderIndex: Number(orderIndex),
      };
      const result = initial
        ? await updateCategory({ ...input, id: initial.id })
        : await createCategory(input);

      if (result.error) {
        setError(result.error);
        return;
      }
      if (initial) {
        router.push("/admin/library/categories");
        router.refresh();
      } else {
        setName("");
        setDescription("");
        setOrderIndex("0");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category-name" className="text-xs font-medium">
          Name
        </label>
        <Input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          dir="ltr"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category-description" className="text-xs font-medium">
          Description (optional)
        </label>
        <Input
          id="category-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          dir="ltr"
          className="w-64"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category-order" className="text-xs font-medium">
          Order
        </label>
        <Input
          id="category-order"
          type="number"
          min={0}
          value={orderIndex}
          onChange={(event) => setOrderIndex(event.target.value)}
          className="w-24"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : initial ? "Save changes" : "Add category"}
      </Button>
      {initial && (
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/library/categories")}
        >
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
