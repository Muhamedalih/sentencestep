import type { Metadata } from "next";
import Link from "next/link";

import { ContentTable } from "@/components/admin/content-table";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONTENT_PAGE_SIZE, listContentLessons } from "@/lib/admin/content-queries";
import type { ContentListFilters } from "@/lib/admin/content-queries";
import type { ContentStatus } from "@/lib/admin/validation";
import { LEARNING_MODES, modeMeta } from "@/lib/learning-modes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LearningMode } from "@/types/content";

export const metadata: Metadata = {
  title: "Content",
};

interface AdminSearchParams {
  mode?: string;
  level?: string;
  access?: string;
  status?: string;
  q?: string;
  page?: string;
}

function isLearningMode(value: string | undefined): value is LearningMode {
  return value === "normal" || value === "stories" || value === "conversation";
}

function isContentStatus(value: string | undefined): value is ContentStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const params = await searchParams;
  const filters: ContentListFilters = {
    mode: isLearningMode(params.mode) ? params.mode : undefined,
    level: params.level ? Number(params.level) : undefined,
    access: params.access === "free" || params.access === "premium" ? params.access : undefined,
    status: isContentStatus(params.status) ? params.status : undefined,
    search: params.q?.trim() || undefined,
  };

  const page = Math.max(1, Number(params.page) || 1);
  const { lessons, totalCount } = await listContentLessons(filters, page);
  const hasActiveFilters = Boolean(
    filters.mode || filters.level || filters.access || filters.status || filters.search,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Content</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount} item{totalCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content/new">New content</Link>
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
                placeholder="Title…"
                className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
              />
            </div>
            <FilterSelect
              name="mode"
              label="Type"
              value={params.mode}
              options={[
                { value: "", label: "All" },
                ...LEARNING_MODES.map((mode) => ({ value: mode, label: modeMeta[mode].title })),
              ]}
            />
            <FilterSelect
              name="level"
              label="Level"
              value={params.level}
              options={[
                { value: "", label: "All" },
                ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Level ${n}` })),
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
                <Link href="/admin/content">Clear</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <ContentTable lessons={lessons} />

      <PaginationControls
        page={page}
        pageSize={CONTENT_PAGE_SIZE}
        totalCount={totalCount}
        basePath="/admin/content"
        searchParams={{
          mode: params.mode,
          level: params.level,
          access: params.access,
          status: params.status,
          q: params.q,
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
