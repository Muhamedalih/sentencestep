"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookCoverImageField } from "@/components/admin/book-cover-image-field";
import { saveBook } from "@/lib/admin/library-actions";
import type { BookStatus } from "@/lib/admin/library-validation";
import type { AdminBookDetail, AdminCategory } from "@/lib/admin/library-queries";
import { tierLabel, type Difficulty } from "@/lib/levels";

const DIFFICULTY_BY_LEVEL: Record<number, Difficulty> = {
  1: "beginner",
  2: "intermediate",
  3: "advanced",
};

interface BookFormProps {
  categories: AdminCategory[];
  initial?: AdminBookDetail;
}

/**
 * Book title/author/description are plain English fields only — no ar/es/tr
 * inputs, unlike LessonForm. Per Section 18 of the spec this foundation
 * implements, book content translation is a later phase; content_translations
 * is only widened to accept content_type='book' (see the migration), not
 * populated from this form.
 */
export function BookForm({ categories, initial }: BookFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [difficultyLevel, setDifficultyLevel] = useState(initial?.difficultyLevel ?? 1);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isFree, setIsFree] = useState(initial?.isFree ?? true);
  const [freePreviewSentenceCount, setFreePreviewSentenceCount] = useState(
    String(initial?.freePreviewSentenceCount ?? 0),
  );
  const [status, setStatus] = useState<BookStatus>(initial?.status ?? "draft");
  const [orderIndex, setOrderIndex] = useState(String(initial?.orderIndex ?? 0));

  const initialPrimaryId = initial?.categories.find((c) => c.isPrimary)?.categoryId ?? null;
  const initialSelectedIds = initial?.categories.map((c) => c.categoryId) ?? [];
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialSelectedIds);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(initialPrimaryId);

  function toggleCategory(id: string, checked: boolean) {
    setSelectedCategoryIds((prev) => {
      const next = checked ? [...prev, id] : prev.filter((existingId) => existingId !== id);
      // Auto-pick a primary the moment there's exactly one selected category,
      // and clear it if the primary gets unchecked — one fewer manual step
      // for the common "just pick one category" case, without ever leaving
      // two or zero categories silently unassigned a primary.
      if (checked && prev.length === 0) setPrimaryCategoryId(id);
      if (!checked && primaryCategoryId === id) setPrimaryCategoryId(next[0] ?? null);
      return next;
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await saveBook({
        id: initial?.id,
        title,
        author,
        description: description || undefined,
        difficultyLevel,
        isFeatured,
        isFree,
        freePreviewSentenceCount: Number(freePreviewSentenceCount),
        status,
        orderIndex: Number(orderIndex),
        categories: selectedCategoryIds.map((categoryId) => ({
          categoryId,
          isPrimary: categoryId === primaryCategoryId,
        })),
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/library");
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
          <Field label="Title" htmlFor="book-title">
            <Input
              id="book-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              dir="ltr"
              required
            />
          </Field>
          <Field label="Author" htmlFor="book-author">
            <Input
              id="book-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              dir="ltr"
              required
            />
          </Field>
          <Field
            label="Description (optional)"
            htmlFor="book-description"
            className="sm:col-span-2"
          >
            <textarea
              id="book-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              dir="ltr"
              rows={2}
              placeholder="A short, engaging blurb shown on the book card…"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>
          <BookCoverImageField bookId={initial?.id} initialUrl={initial?.coverImageUrl ?? null} />

          <Field label="Difficulty" htmlFor="book-difficulty">
            <select
              id="book-difficulty"
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(Number(e.target.value))}
              className="border-input bg-background h-11 rounded-lg border px-3 text-sm"
            >
              {[1, 2, 3].map((level) => (
                <option key={level} value={level}>
                  {tierLabel(DIFFICULTY_BY_LEVEL[level] as Difficulty).label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Order" htmlFor="book-order">
            <Input
              id="book-order"
              type="number"
              min={0}
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              required
            />
          </Field>

          <Field label="Status" htmlFor="book-status">
            <select
              id="book-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as BookStatus)}
              className="border-input bg-background h-11 rounded-lg border px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Free preview sentences" htmlFor="book-preview-count">
            <Input
              id="book-preview-count"
              type="number"
              min={0}
              value={freePreviewSentenceCount}
              onChange={(e) => setFreePreviewSentenceCount(e.target.value)}
              disabled={isFree}
              required
            />
            <p className="text-muted-foreground text-xs">
              Only takes effect once this book is Premium — inert while Free.
            </p>
          </Field>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-primary size-4"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="accent-primary size-4"
            />
            Free (unchecked = Premium — not enforced yet in this phase)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No categories yet — add one under Library categories first.
            </p>
          ) : (
            categories.map((category) => {
              const checked = selectedCategoryIds.includes(category.id);
              return (
                <div key={category.id} className="flex items-center gap-3">
                  <label className="flex flex-1 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleCategory(category.id, e.target.checked)}
                      className="accent-primary size-4"
                    />
                    {category.name}
                  </label>
                  {checked && (
                    <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <input
                        type="radio"
                        name="primary-category"
                        checked={primaryCategoryId === category.id}
                        onChange={() => setPrimaryCategoryId(category.id)}
                        className="accent-primary size-3.5"
                      />
                      Primary
                    </label>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : initial ? "Save changes" : "Create book"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/library")}>
          Cancel
        </Button>
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
