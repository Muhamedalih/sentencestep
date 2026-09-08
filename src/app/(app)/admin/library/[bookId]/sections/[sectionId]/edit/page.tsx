import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { BookSectionForm } from "@/components/admin/book-section-form";
import { Button } from "@/components/ui/button";
import { getBookByIdAdmin, getBookSectionByIdAdmin } from "@/lib/admin/library-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Edit section" };

export default async function EditBookSectionPage({
  params,
}: {
  params: Promise<{ bookId: string; sectionId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { bookId, sectionId } = await params;
  const [book, section] = await Promise.all([
    getBookByIdAdmin(bookId),
    getBookSectionByIdAdmin(sectionId),
  ]);
  if (!book || !section || section.bookId !== bookId) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit section</h1>
          <p className="text-muted-foreground mt-1">
            {book.title} — {section.title}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/library/${bookId}/sections/${sectionId}/preview`}>Preview</Link>
        </Button>
      </div>
      <BookSectionForm bookId={bookId} initial={section} suggestedOrderIndex={section.orderIndex} />
    </div>
  );
}
