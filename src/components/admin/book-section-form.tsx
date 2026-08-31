"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveBookSection } from "@/lib/admin/library-actions";
import type { AdminBookSectionDetail } from "@/lib/admin/library-queries";

interface BookSectionFormProps {
  bookId: string;
  initial?: AdminBookSectionDetail;
  /** The next unused order_index for a new section — irrelevant when editing (the existing section keeps its own order unless changed). */
  suggestedOrderIndex: number;
}

/**
 * One section = one form: title/description/order, plus its full sentence
 * list as plain one-sentence-per-line text — see splitSentenceLines' doc
 * comment in library-validation.ts for why a textarea rather than
 * per-sentence rows. Saving always replaces the section's entire sentence
 * list (delete-and-reinsert), same as BookForm replaces a book's category
 * links wholesale — simpler and more reliable to reason about than diffing
 * for a first version.
 */
export function BookSectionForm({ bookId, initial, suggestedOrderIndex }: BookSectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [orderIndex, setOrderIndex] = useState(String(initial?.orderIndex ?? suggestedOrderIndex));
  const [sentencesText, setSentencesText] = useState(initial?.sentencesText ?? "");
  const [arabicText, setArabicText] = useState(initial?.arabicText ?? "");
  const [turkishText, setTurkishText] = useState(initial?.turkishText ?? "");
  const [spanishText, setSpanishText] = useState(initial?.spanishText ?? "");
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleTr, setTitleTr] = useState(initial?.titleTr ?? "");
  const [titleEs, setTitleEs] = useState(initial?.titleEs ?? "");

  const sentenceCount = sentencesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await saveBookSection({
        id: initial?.id,
        bookId,
        title,
        description: description || undefined,
        orderIndex: Number(orderIndex),
        sentencesText,
        arabicText: arabicText || undefined,
        turkishText: turkishText || undefined,
        spanishText: spanishText || undefined,
        titleAr: titleAr || undefined,
        titleTr: titleTr || undefined,
        titleEs: titleEs || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/admin/library/${bookId}/sections`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="section-title" className="sm:col-span-2">
            <Input
              id="section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              dir="ltr"
              required
            />
          </Field>
          <Field
            label="Description (optional)"
            htmlFor="section-description"
            className="sm:col-span-2"
          >
            <textarea
              id="section-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              dir="ltr"
              rows={2}
              placeholder="A short summary of what this section covers…"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>
          <Field label="Order" htmlFor="section-order">
            <Input
              id="section-order"
              type="number"
              min={0}
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sentences</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Field
            label={`English sentences — one per line (${sentenceCount})`}
            htmlFor="section-sentences"
          >
            <textarea
              id="section-sentences"
              value={sentencesText}
              onChange={(e) => setSentencesText(e.target.value)}
              dir="ltr"
              rows={14}
              placeholder={
                "Atomic Habits argues that small changes compound over time.\nEach habit is a vote for the type of person you wish to become.\n…"
              }
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 font-mono text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>
          <p className="text-muted-foreground text-xs">
            Saving replaces this section&apos;s entire sentence list with exactly these lines, in
            order.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Translations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-xs">
            The section title, translated — one line each. Leave a field entirely empty to fall back
            to English for that locale.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Title — Arabic (ar)" htmlFor="section-title-ar">
              <Input
                id="section-title-ar"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                dir="rtl"
              />
            </Field>
            <Field label="Title — Turkish (tr)" htmlFor="section-title-tr">
              <Input
                id="section-title-tr"
                value={titleTr}
                onChange={(e) => setTitleTr(e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label="Title — Spanish (es)" htmlFor="section-title-es">
              <Input
                id="section-title-es"
                value={titleEs}
                onChange={(e) => setTitleEs(e.target.value)}
                dir="ltr"
              />
            </Field>
          </div>
          <p className="text-muted-foreground text-xs">
            One translated line per English sentence above, in the same order. Leave a field
            entirely empty to fall back to English for that locale — a learner never sees a broken
            or partial translation.
          </p>
          <Field label="Arabic (ar)" htmlFor="section-arabic">
            <textarea
              id="section-arabic"
              value={arabicText}
              onChange={(e) => setArabicText(e.target.value)}
              dir="rtl"
              rows={8}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>
          <Field label="Turkish (tr)" htmlFor="section-turkish">
            <textarea
              id="section-turkish"
              value={turkishText}
              onChange={(e) => setTurkishText(e.target.value)}
              dir="ltr"
              rows={8}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>
          <Field label="Spanish (es)" htmlFor="section-spanish">
            <textarea
              id="section-spanish"
              value={spanishText}
              onChange={(e) => setSpanishText(e.target.value)}
              dir="ltr"
              rows={8}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
            />
          </Field>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : initial ? "Save changes" : "Create section"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/library/${bookId}/sections`)}
        >
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
