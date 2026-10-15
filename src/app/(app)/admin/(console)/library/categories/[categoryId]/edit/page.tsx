import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { CategoryForm } from "@/components/admin/category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryByIdAdmin } from "@/lib/admin/library-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Edit category",
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { categoryId } = await params;
  const category = await getCategoryByIdAdmin(categoryId);
  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Edit category</h1>
        <p className="text-muted-foreground mt-1">{category.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm initial={category} />
        </CardContent>
      </Card>
    </div>
  );
}
