"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { LinkPendingMarker } from "@/components/app/link-pending-marker";
import { useLocale } from "@/components/providers/locale-provider";
import { useDeferredPrefetch } from "@/hooks/use-deferred-prefetch";
import { useIntentPrefetch } from "@/hooks/use-intent-prefetch";
import { cn } from "@/lib/utils";

/**
 * Simple Stories/Longer Stories switch for the Stories pages, shown only
 * below md: — same gap and same fix as LibraryMobileTabs (see that
 * component's own doc comment): the sidebar's own Stories sub-nav (see
 * learn-sidebar.tsx) only renders on the md:+ desktop sidebar, so mobile had
 * no way to reach "Longer Stories" (/learn/normal) at all — the "Stories"
 * tab always opened Simple Stories. This is the mobile equivalent, rendered
 * at the top of each page instead of in the nav shell.
 *
 * Built so a tap never feels ignored: the OTHER tab's route is warmed
 * immediately on mount (this switch is the one thing a learner does next on
 * either page — it used to wait for the sidebar's ~1s background warm-up, so a
 * quick tap landed on a cold route), it's warmed again on finger-down, and a
 * pressed tab lights up at once while the next page loads.
 */
export function StoriesMobileTabs({
  active,
  className,
}: {
  active: "simplified" | "longer";
  className?: string;
}) {
  const { t, dir } = useLocale();
  useDeferredPrefetch([active === "longer" ? "/learn/stories" : "/learn/normal"], 0);

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
      <TabLink href="/learn/normal" active={active === "longer"}>
        {t.storiesHub.longerTab}
      </TabLink>
      <TabLink href="/learn/stories" active={active === "simplified"}>
        {t.storiesHub.simplifiedTab}
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
  const intent = useIntentPrefetch(href);

  return (
    <Link
      href={href}
      prefetch={false}
      role="tab"
      aria-selected={active}
      {...intent}
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        // Pressed: look selected right away and pulse until the page swaps (see LinkPendingMarker).
        "has-[[data-pending]]:bg-background has-[[data-pending]]:text-primary has-[[data-pending]]:animate-pulse has-[[data-pending]]:shadow-sm",
        active
          ? "bg-background text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <LinkPendingMarker />
    </Link>
  );
}
