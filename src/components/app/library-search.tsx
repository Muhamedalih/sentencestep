"use client";

import { Search } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";

/**
 * A single controlled input — the parent (LibraryHome) owns the query state
 * and filtering logic, this is purely presentational so it stays reusable
 * without pulling routing/query-param concerns into it (Section 11 of the
 * spec: "a clean, reusable Library search component").
 */
export function LibrarySearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t, dir } = useLocale();

  return (
    <div className="relative w-full max-w-md">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.bookLibrary.searchPlaceholder}
        aria-label={t.bookLibrary.searchAriaLabel}
        dir={dir}
        className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-full border py-2 pr-4 pl-10 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
      />
    </div>
  );
}
