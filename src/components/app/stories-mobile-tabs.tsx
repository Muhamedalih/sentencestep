"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Simple Stories/Longer Stories switch for the Stories pages, shown only
 * below md: — same gap and same fix as LibraryMobileTabs (see that
 * component's own doc comment): the sidebar's own Stories sub-nav (see
 * learn-sidebar.tsx) only renders on the md:+ desktop sidebar, so mobile had
 * no way to reach "Longer Stories" (/learn/normal) at all — the "Stories"
 * tab always opened Simple Stories. This is the mobile equivalent, rendered
 * at the top of each page instead of in the nav shell. Admin-only, matching
 * the sidebar's own gate (the whole Stories/Ordinary Lessons merge is
 * admin-only while Stories is being rebuilt).
 */
export function StoriesMobileTabs({
  active,
  className,
}: {
  active: "simplified" | "longer";
  className?: string;
}) {
  const { t, dir } = useLocale();

  return (
    <div
      role="tablist"
      aria-label={t.nav.stories}
      dir={dir}
      className={cn(
        "bg-muted/60 ring-border/50 inline-flex items-center gap-0.5 self-start rounded-full p-1 ring-1 md:hidden",
        className,
      )}
    >
      <TabLink href="/learn/stories" active={active === "simplified"}>
        {t.storiesHub.simplifiedTab}
      </TabLink>
      <TabLink href="/learn/normal" active={active === "longer"}>
        {t.storiesHub.longerTab}
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
