import type { Metadata } from "next";
import Link from "next/link";

import { BookTable } from "@/components/admin/book-table";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  LIBRARY_PAGE_SIZE,
  listBooksAdmin,
  listCategoriesAdmin,
} from "@/lib/admin/library-queries";
import type { LibraryBookListFilters } from "@/lib/admin/library-queries";
import type { BookStatus } from "@/lib/admin/library-validation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Library books",
};

interface AdminLibrarySearchParams {
  q?: string;
  status?: string;
  access?: string;
  difficulty?: string;
  category?: string;
  page?: string;
}

function isBookStatus(value: string | undefined): value is BookStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export default async function AdminLibraryBooksPage({
  searchParams,
}: {
  searchParams: Promise<AdminLibrarySearchParams>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const params = await searchParams;
  const filters: LibraryBookListFilters = {
    search: params.q?.trim() || undefined,
    status: isBookStatus(params.status) ? params.status : undefined,
    access: params.access === "free" || params.access === "premium" ? params.access : undefined,
    difficultyLevel: params.difficulty ? Number(params.difficulty) : undefined,
    categoryId: params.category || undefined,
  };
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.access ||
    filters.difficultyLevel ||
    filters.categoryId,
  );

  const page = Math.max(1, Number(params.page) || 1);
  const [{ books, totalCount }, categories] = await Promise.all([
    listBooksAdmin(filters, page),
    listCategoriesAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Library books</h1>
          <p className="text-muted-foreground mt-1">
            Manage book metadata here, then open a book&apos;s Sections to add the content that
            makes it playable.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/library/new">Add book</Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="q" className="text-xs font-medium">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Title or author…"
                className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
              />
            </div>
            <FilterSelect
              name="category"
              label="Category"
              value={params.category}
              options={[
                { value: "", label: "All" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
            <FilterSelect
              name="difficulty"
              label="Difficulty"
              value={params.difficulty}
              options={[
                { value: "", label: "All" },
                { value: "1", label: "Beginner" },
                { value: "2", label: "Intermediate" },
                { value: "3", label: "Advanced" },
              ]}
            />
            <FilterSelect
              name="access"
              label="Access"
              value={params.access}
              options={[
                { value: "", label: "All" },
                { value: "free", label: "Free" },
                { value: "premium", label: "Premium" },
              ]}
            />
            <FilterSelect
              name="status"
              label="Status"
              value={params.status}
              options={[
                { value: "", label: "All" },
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <Button type="submit" variant="secondary" size="sm">
              Apply
            </Button>
            {hasActiveFilters && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/library">Clear</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <BookTable books={books} hasActiveFilters={hasActiveFilters} />

      <PaginationControls
        page={page}
        pageSize={LIBRARY_PAGE_SIZE}
        totalCount={totalCount}
        basePath="/admin/library"
        searchParams={{
          q: params.q,
          status: params.status,
          access: params.access,
          difficulty: params.difficulty,
          category: params.category,
        }}
      />
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value ?? ""}
        className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
