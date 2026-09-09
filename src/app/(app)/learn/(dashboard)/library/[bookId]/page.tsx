import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookOverview } from "@/components/app/book-overview";
import { fetchBookProgressAction } from "@/lib/book-progress/actions";
import { deriveChapterStates } from "@/lib/book-progress/chapter-state";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchBookContentCounts, fetchBookSections } from "@/lib/supabase/queries/book-content";
import { fetchBookById } from "@/lib/supabase/queries/library";
import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}): Promise<Metadata> {
  const { bookId } = await params;
  const book = await fetchBookById(bookId);
  return { title: book?.title ?? "Book" };
}

export default async function BookOverviewPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  // One shared client for every library/book-content query this page fires —
  // see library.ts's fetchCategories doc comment for why a separate
  // createPublicClient() per query must be avoided within one request.
  const supabase = isSupabaseConfigured() ? createPublicClient() : undefined;
  const locale = await getLocale();
  const book = await fetchBookById(bookId, supabase, locale);
  if (!book) notFound();

  // countsPromise is shared with fetchBookProgressAction below instead of
  // each independently calling fetchBookContentCounts — same duplicate-query
  // fix as the Home dashboard's identical book-progress-counts pattern (see
  // fetchBookProgressAction's own doc comment): without this, every Book
  // Overview view fired the exact same book_sections/book_sentences count
  // query twice.
  const countsPromise = fetchBookContentCounts(bookId, supabase);
  const [counts, progress, sections] = await Promise.all([
    countsPromise,
    fetchBookProgressAction(bookId, countsPromise),
    fetchBookSections(bookId, locale ?? undefined),
  ]);
  const chapterStates = deriveChapterStates(sections, progress);

  return (
    <BookOverview
      book={book}
      sectionCount={counts.sectionCount}
      sentenceCount={counts.sentenceCount}
      progress={progress}
      chapterStates={chapterStates}
    />
  );
}
