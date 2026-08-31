import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategoriesAdmin } from "@/lib/admin/library-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Library categories",
};

export default async function AdminLibraryCategoriesPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const categories = await listCategoriesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Library categories</h1>
        <p className="text-muted-foreground mt-1">
          A book belongs to one or more of these. Deleting a category never breaks a book already
          assigned to it — see{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">deleteCategory</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a category</CardTitle>
          <CardDescription>
            Becomes available in the Library and the book editor immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Books</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="text-muted-foreground px-4 py-3">{category.orderIndex}</td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="text-muted-foreground px-4 py-3">{category.description ?? "—"}</td>
                  <td className="px-4 py-3">{category.bookCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={category.isActive ? "success" : "muted"}>
                      {category.isActive ? "Active" : "Deleted"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/library/categories/${category.id}/edit`}
                        className="hover:bg-muted rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      {category.isActive && (
                        <DeleteCategoryButton id={category.id} bookCount={category.bookCount} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
