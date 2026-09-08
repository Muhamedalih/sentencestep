import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { BookForm } from "@/components/admin/book-form";
import { getBookByIdAdmin, listCategoriesAdmin } from "@/lib/admin/library-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Edit book",
};

export default async function EditBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { bookId } = await params;
  const [book, allCategories] = await Promise.all([
    getBookByIdAdmin(bookId),
    listCategoriesAdmin(),
  ]);
  if (!book) notFound();

  // Keeps a category the book already uses selectable in the form even if
  // it's since been deleted (is_active: false) — otherwise editing an older
  // book could silently drop a category it still legitimately belongs to.
  const usedCategoryIds = new Set(book.categories.map((c) => c.categoryId));
  const categories = allCategories.filter((c) => c.isActive || usedCategoryIds.has(c.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit book</h1>
          <p className="text-muted-foreground mt-1">{book.title}</p>
        </div>
        <Link
          href={`/admin/library/${bookId}/sections`}
          className="border-border hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          Manage sections
        </Link>
      </div>
      <BookForm categories={categories} initial={book} />
    </div>
  );
}
