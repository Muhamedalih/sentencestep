import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { BookSectionForm } from "@/components/admin/book-section-form";
import { getBookByIdAdmin, listBookSectionsAdmin } from "@/lib/admin/library-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "New section" };

export default async function NewBookSectionPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { bookId } = await params;
  const [book, sections] = await Promise.all([
    getBookByIdAdmin(bookId),
    listBookSectionsAdmin(bookId),
  ]);
  if (!book) notFound();

  const nextOrderIndex = sections.reduce((max, s) => Math.max(max, s.orderIndex + 1), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New section</h1>
        <p className="text-muted-foreground mt-1">{book.title}</p>
      </div>
      <BookSectionForm bookId={bookId} suggestedOrderIndex={nextOrderIndex} />
    </div>
  );
}
