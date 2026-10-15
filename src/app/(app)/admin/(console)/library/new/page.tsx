import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { BookForm } from "@/components/admin/book-form";
import { listCategoriesAdmin } from "@/lib/admin/library-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "New book",
};

export default async function NewBookPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const categories = (await listCategoriesAdmin()).filter((c) => c.isActive);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New book</h1>
        <p className="text-muted-foreground mt-1">
          Metadata only — sections and sentences are a future phase.
        </p>
      </div>
      <BookForm categories={categories} />
    </div>
  );
}
