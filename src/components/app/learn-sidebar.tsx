"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, ListChecks, NotebookText, Type } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Persistent primary navigation for the learning app (Home dashboard/
 * Ordinary Lessons separation): Home (the dashboard, at the bare /learn
 * route) is nav item #1, Ordinary Lessons is #2 right after it — its own
 * sibling route now (/learn/normal), structurally consistent with Library/
 * Stories/Word Lists rather than living inside Home the way it used to. Same
 * `Type` icon Ordinary Lessons already uses everywhere else (see
 * learning-modes.ts's modeMeta). Conversation (also a LEARNING_MODE — see
 * @/lib/learning-modes) is deliberately NOT listed here — off the current
 * roadmap for now (product call, not a removed feature: /learn/conversation
 * and its content are untouched, this just stops linking to it from primary
 * nav). Re-add its NAV_ITEMS entry to bring it back.
 * Renders as a horizontal, scrollable tab strip under the header on small
 * screens and switches to a fixed vertical sidebar at md: — one component,
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
export function LearnSidebar() {
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
        ? "normal-lessons"
        : pathname.startsWith("/learn/conversation")
          ? "conversation"
          : pathname.startsWith("/learn/stories")
            ? "stories"
            : pathname.startsWith("/learn/word-lists")
              ? "word-lists"
              : pathname.startsWith("/learn/library")
                ? "library"
                : null;

  const NAV_ITEMS = [
    { key: "home", href: "/learn", label: t.nav.home, icon: Home },
    { key: "normal-lessons", href: "/learn/normal", label: t.nav.normalLessons, icon: Type },
    { key: "library", href: "/learn/library", label: t.nav.library, icon: Library },
    { key: "stories", href: "/learn/stories", label: t.nav.stories, icon: NotebookText },
    { key: "word-lists", href: "/learn/word-lists", label: t.nav.wordLists, icon: ListChecks },
  ] as const;

  return (
    <nav
      aria-label={t.nav.ariaLabel}
      className={cn(
        "border-border/60 bg-background/80 sticky top-16 z-40 flex shrink-0 items-center gap-1 overflow-x-auto border-b px-4 py-2 backdrop-blur-md",
        "md:h-[calc(100svh-4rem)] md:w-56 md:flex-col md:items-stretch md:gap-1 md:overflow-visible md:border-r md:border-b-0 md:px-3 md:py-6",
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
              "focus-visible:ring-ring focus-visible:ring-offset-background flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              isActive
                ? "bg-brand-muted text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span dir={dir}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
