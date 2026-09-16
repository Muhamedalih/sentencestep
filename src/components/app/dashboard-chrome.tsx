"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
  const focusedDesktopScreen = pathname === "/learn/settings";

  return (
    <>
      <div className={focusedDesktopScreen ? "md:hidden" : undefined}>{header}</div>
      <div className="flex flex-1 flex-col md:flex-row">
        <div className={focusedDesktopScreen ? "md:hidden" : undefined}>{sidebar}</div>
        <main className="min-w-0 flex-1 pb-16 md:pb-0">{children}</main>
      </div>
    </>
  );
}
