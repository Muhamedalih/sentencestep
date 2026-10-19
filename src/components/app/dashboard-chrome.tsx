"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useLocale } from "@/components/providers/locale-provider";

/**
 * Wraps the dashboard's header/sidebar so /learn/settings can hide both of
 * them at md:+ only — desktop gets a focused, full-width settings screen
 * with no competing left-nav/top-bar chrome; the fixed bottom tab bar and
 * compact top bar below md: (see LearnSidebar/AppHeader's own responsive
 * classes) are untouched, since neither of those two components' own markup
 * changes here, only whether this wrapper renders them at all above md:.
 * Needs the current pathname, which only a Client Component can read, hence
 * this split from the (still async Server Component) layout itself.
 */
export function DashboardChrome({
  header,
  sidebar,
  children,
}: {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const focusedDesktopScreen = pathname === "/learn/settings";

  return (
    <>
      <a
        href="#main-content"
        className="bg-background text-foreground ring-ring sr-only text-sm font-medium shadow-lg focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:ring-2"
      >
        {t.nav.skipToContent}
      </a>
      <div className={focusedDesktopScreen ? "md:hidden" : undefined}>{header}</div>
      <div className="flex flex-1 flex-col md:flex-row">
        <div className={focusedDesktopScreen ? "md:hidden" : undefined}>{sidebar}</div>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 pb-16 outline-none md:pb-0">
          {children}
        </main>
      </div>
    </>
  );
}
