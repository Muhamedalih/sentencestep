import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteBookSectionButton } from "@/components/admin/delete-book-section-button";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { Button } from "@/components/ui/button";
import { getBookByIdAdmin, listBookSectionsAdmin } from "@/lib/admin/library-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Book sections" };

export default async function AdminBookSectionsPage({
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

  const totalSentences = sections.reduce((sum, s) => sum + s.sentenceCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sections</h1>
          <p className="text-muted-foreground mt-1">
            {book.title} — {sections.length} section{sections.length === 1 ? "" : "s"},{" "}
            {totalSentences} sentence
            {totalSentences === 1 ? "" : "s"}. A book needs at least one section with at least one
            sentence before it&apos;s playable — see the Book Overview page.
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/library/${bookId}/sections/new`}>Add section</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Sentences</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {sections.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  No sections yet.
                </td>
              </tr>
            ) : (
              sections.map((section) => (
                <tr key={section.id}>
                  <td className="text-muted-foreground px-4 py-3">{section.orderIndex}</td>
                  <td className="px-4 py-3 font-medium" dir="ltr">
                    {section.title}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{section.sentenceCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/library/${bookId}/sections/${section.id}/edit`}
                        className="hover:bg-muted rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteBookSectionButton id={section.id} bookId={bookId} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Link
        href={`/admin/library/${bookId}/edit`}
        className="text-muted-foreground hover:text-foreground w-fit text-sm font-medium transition-colors"
      >
        ← Back to book details
      </Link>
    </div>
  );
}
