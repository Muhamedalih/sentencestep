"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Books/Novels switch for the Library pages, shown only below md: — the
 * sidebar's own Books/Novels sub-nav (see learn-sidebar.tsx) only renders on
 * the md:+ desktop sidebar, by design (the mobile bottom tab bar has no room
 * for a nested sub-list), which left mobile with literally no way to reach
 * Novels at all: the "Library" tab always opened Books. This is the mobile
 * equivalent, rendered at the top of each page instead of in the nav shell.
 * Admin-only, matching the sidebar's own gate (Novels' own separate rollout
 * — see library/novels/page.tsx's isAdmin() check) — a non-admin never sees
 * this since they'd just be redirected straight back to Books.
 */
export function LibraryMobileTabs({
  active,
  className,
}: {
  active: "books" | "novels";
  className?: string;
}) {
  const { t, dir } = useLocale();

  return (
    <div
      role="tablist"
      aria-label={t.bookLibrary.heading}
      dir={dir}
      className={cn(
        "bg-muted/60 ring-border/50 inline-flex items-center gap-0.5 self-start rounded-full p-1 ring-1 md:hidden",
        className,
      )}
    >
      <TabLink href="/learn/library" active={active === "books"}>
        {t.bookLibrary.booksTabLabel}
      </TabLink>
      <TabLink href="/learn/library/novels" active={active === "novels"}>
        {t.bookLibrary.novelsTabLabel}
      </TabLink>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      role="tab"
      aria-selected={active}
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        active
          ? "bg-background text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
