"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, ListChecks, NotebookText, Type } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Persistent primary navigation for the learning app. Home (the dashboard,
 * at the bare /learn route) is nav item #1. For admins, Stories and Ordinary
 * Lessons (Stories/Ordinary Lessons merge) collapse into a single "Stories"
 * item pointing at /learn/stories — StoriesHubToggle (rendered on both the
 * Stories and Ordinary Lessons pages) is what actually switches between the
 * two, this sidebar just opens the pair on the Stories side first. Regular
 * learners never had a Stories tab (still admin-only while it's being
 * rebuilt), so their nav keeps its own direct "Ordinary Lessons" item to
 * /learn/normal instead, unchanged from before this merge. Same `Type`/
 * `NotebookText` icons Ordinary Lessons/Stories already use everywhere else
 * (see learning-modes.ts's modeMeta). Conversation (also a LEARNING_MODE —
 * see @/lib/learning-modes) is deliberately NOT listed here — off the
 * current roadmap for now (product call, not a removed feature:
 * /learn/conversation and its content are untouched, this just stops
 * linking to it from primary nav). Re-add its NAV_ITEMS entry to bring it
 * back.
 * Renders as a fixed bottom tab bar (even-width icon+label buttons) on
 * small screens — the standard mobile-app nav pattern, replacing an earlier
 * horizontal scrollable strip that clipped off-screen items with no visible
 * hint — and switches to a fixed vertical sidebar at md: — one component,
 * two responsive layouts, so there's no risk of the two ever drifting apart.
 * Labels come from the active learner-support locale (see useLocale) —
 * previously hardcoded to Arabic regardless of the chosen language, which
 * was one of the confirmed localization gaps.
 *
 * The streak/XP reminder that used to live at the top of this sidebar moved
 * to AppHeader's own center HUD (header/account-menu redesign, round 2) —
 * that one is visible on every viewport, not just md:+, so keeping a second
 * copy here would just be the same numbers shown twice.
 */
export function LearnSidebar({ isAdminUser = false }: { isAdminUser?: boolean }) {
  const pathname = usePathname();
  const { t, dir } = useLocale();
  // Home is an exact match (not a prefix) — "/learn" is a short enough
  // prefix that /learn/settings, /learn/saved, and every other non-nav
  // route under it would otherwise light up Home too. Every other item
  // stays a prefix match, no catch-all fallback: /learn/settings and
  // /learn/saved (reached via the account menu, not this sidebar) used to
  // fall through to "library" by default and light up a nav item the
  // learner never clicked, which also would have mislabeled any future
  // non-Library route added under /learn the same way.
  const active =
    pathname === "/learn"
      ? "home"
      : pathname.startsWith("/learn/normal")
        ? isAdminUser
          ? "stories"
          : "normal-lessons"
        : pathname.startsWith("/learn/conversation")
          ? "conversation"
          : pathname.startsWith("/learn/stories")
            ? "stories"
            : pathname.startsWith("/learn/word-lists")
              ? "word-lists"
              : pathname.startsWith("/learn/library")
                ? "library"
                : null;

  // Stories is temporarily admin-only while it's being rebuilt (see
  // stories/page.tsx and [mode]/[lessonId]/page.tsx, which enforce this same
  // gate server-side). For admins, Stories and Ordinary Lessons collapse
  // into one "Stories" nav item — it opens on /learn/stories (the Simplified
  // Stories tab, shown first) and StoriesHubToggle (see stories-library.tsx/
  // lesson-list-view.tsx) is what lets them switch over to Ordinary Lessons
  // from there. Regular learners never had a Stories tab to merge, so their
  // nav is untouched: still a direct "Ordinary Lessons" item straight to
  // /learn/normal.
  const NAV_ITEMS = [
    { key: "home", href: "/learn", label: t.nav.home, icon: Home },
    { key: "normal-lessons", href: "/learn/normal", label: t.nav.normalLessons, icon: Type },
    { key: "library", href: "/learn/library", label: t.nav.library, icon: Library },
    { key: "stories", href: "/learn/stories", label: t.nav.stories, icon: NotebookText },
    { key: "word-lists", href: "/learn/word-lists", label: t.nav.wordLists, icon: ListChecks },
  ].filter((item) => (isAdminUser ? item.key !== "normal-lessons" : item.key !== "stories"));

  return (
    <nav
      aria-label={t.nav.ariaLabel}
      className={cn(
        "border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md",
        "md:bg-background/80 md:sticky md:top-16 md:bottom-auto md:h-[calc(100svh-4rem)] md:w-56 md:border-t-0 md:border-r",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className={cn(
          "flex items-stretch justify-around px-1 py-1.5",
          "md:h-full md:flex-col md:items-stretch md:justify-start md:gap-1 md:px-3 md:py-6",
        )}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring focus-visible:ring-offset-background flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "md:flex-none md:flex-row md:gap-2.5 md:px-3 md:py-2.5 md:text-sm md:whitespace-nowrap",
                isActive
                  ? "text-primary md:bg-brand-muted"
                  : "text-muted-foreground hover:text-foreground md:hover:bg-secondary",
              )}
            >
              <Icon className="size-5 shrink-0 md:size-4" aria-hidden="true" />
              <span dir={dir}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
