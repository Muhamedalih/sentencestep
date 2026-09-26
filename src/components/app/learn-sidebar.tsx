"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, ListChecks, NotebookText } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useDeferredPrefetch } from "@/hooks/use-deferred-prefetch";
import { cn } from "@/lib/utils";

/**
 * Persistent primary navigation for the learning app. Home (the dashboard,
 * at the bare /learn route) is nav item #1. Stories and Ordinary Lessons
 * (Stories/Ordinary Lessons merge) collapse into a single "Stories" item
 * pointing at /learn/stories. Once that item is the active section (current
 * route under /learn/stories or /learn/normal), it grows two indented
 * sub-links right beneath it — "Simple Stories" (/learn/stories) and
 * "Longer Stories" (/learn/normal) — same route split as before, just
 * reached from inside the sidebar itself instead of a second top-level nav
 * item. "Library" gets the identical treatment: once active (under
 * /learn/library), it grows "Books" (/learn/library) and "Novels"
 * (/learn/library/novels) beneath it — this replaced the old top-of-page
 * Books/Novels pill toggle (formerly LibraryTypeToggle) both pages used to
 * render, same reasoning as the Stories merge: the split now lives in the
 * sidebar itself. Both sub-navs are desktop-only (see their own `hidden
 * md:flex`): the mobile bottom tab bar has no room for a nested sub-list,
 * so there "Stories"/"Library" stay single plain buttons, same as every
 * other mobile tab. Both switches reappear on mobile a different way —
 * LibraryMobileTabs and StoriesMobileTabs, rendered at the top of each of
 * their pages instead of in this nav shell (see those components' own doc
 * comments). Same `NotebookText`/`Library` icons already used everywhere
 * else (see learning-modes.ts's modeMeta). Conversation (also a
 * LEARNING_MODE — see @/lib/learning-modes) is deliberately NOT listed here
 * — off the current roadmap for now (product call, not a removed feature:
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
        ? "stories"
        : pathname.startsWith("/learn/conversation")
          ? "conversation"
          : pathname.startsWith("/learn/stories")
            ? "stories"
            : pathname.startsWith("/learn/word-lists")
              ? "word-lists"
              : pathname.startsWith("/learn/library")
                ? "library"
                : null;

  // Stories and Ordinary Lessons collapse into one "Stories" nav item, which
  // opens on /learn/stories (Simple Stories, shown first) — see the
  // Stories/Library sub-navs rendered right below their parent items further
  // down.
  const NAV_ITEMS = [
    { key: "home", href: "/learn", label: t.nav.home, icon: Home },
    { key: "library", href: "/learn/library", label: t.nav.library, icon: Library },
    { key: "stories", href: "/learn/stories", label: t.nav.stories, icon: NotebookText },
    { key: "word-lists", href: "/learn/word-lists", label: t.nav.wordLists, icon: ListChecks },
  ];

  // Every route this sidebar links to, present on every /learn/* page —
  // warmed in the background instead of through each Link's own default
  // prefetch (see this file's Links below, all `prefetch={false}`) so they
  // don't all fire the instant this persistent nav mounts, competing with
  // whatever the current page itself needs to load. See
  // useDeferredPrefetch's own doc comment for why router.prefetch() (not a
  // <link> tag) is the right mechanism here.
  const subNavHrefs =
    active === "stories"
      ? ["/learn/stories", "/learn/normal"]
      : active === "library"
        ? ["/learn/library", "/learn/library/novels"]
        : [];
  useDeferredPrefetch([...NAV_ITEMS.map((item) => item.href), ...subNavHrefs]);

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
        {NAV_ITEMS.flatMap((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const navLink = (
            <Link
              key={item.key}
              href={item.href}
              prefetch={false}
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

          // The Stories/Ordinary Lessons and Library/Novels sub-navs (see
          // this file's own doc comment): only once the parent item is the
          // active section, and only on the md:+ sidebar — the mobile
          // bottom bar has no room for a nested sub-list.
          const subItems =
            item.key === "stories" && isActive
              ? [
                  {
                    key: "simplified",
                    href: "/learn/stories",
                    label: t.storiesHub.simplifiedTab,
                    isSubActive: pathname.startsWith("/learn/stories"),
                  },
                  {
                    key: "longer",
                    href: "/learn/normal",
                    label: t.storiesHub.longerTab,
                    isSubActive: pathname.startsWith("/learn/normal"),
                  },
                ]
              : item.key === "library" && isActive
                ? [
                    {
                      key: "books",
                      href: "/learn/library",
                      label: t.bookLibrary.booksTabLabel,
                      isSubActive: !pathname.startsWith("/learn/library/novels"),
                    },
                    {
                      key: "novels",
                      href: "/learn/library/novels",
                      label: t.bookLibrary.novelsTabLabel,
                      isSubActive: pathname.startsWith("/learn/library/novels"),
                    },
                  ]
                : null;

          if (!subItems) return [navLink];

          return [
            navLink,
            <div
              key={`${item.key}-sub-nav`}
              className="hidden md:flex md:flex-col md:gap-0.5 md:ps-9 md:pe-3"
            >
              {subItems.map((subItem) => (
                <Link
                  key={subItem.key}
                  href={subItem.href}
                  prefetch={false}
                  aria-current={subItem.isSubActive ? "page" : undefined}
                  className={cn(
                    "focus-visible:ring-ring focus-visible:ring-offset-background rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    subItem.isSubActive
                      ? "text-primary bg-brand-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <span dir={dir}>{subItem.label}</span>
                </Link>
              ))}
            </div>,
          ];
        })}
      </div>
    </nav>
  );
}
