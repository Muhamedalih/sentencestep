"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Headphones,
  Home,
  LayoutGrid,
  Library,
  Lightbulb,
  ListChecks,
  NotebookText,
  Play,
  Route,
  type LucideIcon,
} from "lucide-react";

import { LinkPendingMarker } from "@/components/app/link-pending-marker";
import { useLocale } from "@/components/providers/locale-provider";
import { useDeferredPrefetch } from "@/hooks/use-deferred-prefetch";
import { useIntentPrefetch } from "@/hooks/use-intent-prefetch";
import { usePhoneMoreSeen } from "@/hooks/use-phone-more-seen";
import { ruleStrings } from "@/lib/daily-rule/strings";
import { videoStrings } from "@/lib/video-dictation/strings";
import { cn } from "@/lib/utils";

/**
 * Persistent primary navigation for the learning app. Home (the dashboard,
 * at the bare /learn route) is nav item #1, Stories is nav item #2. Stories
 * and Ordinary Lessons (Stories/Ordinary Lessons merge) collapse into a
 * single "Stories" item pointing at /learn/normal (Daily Lessons opens by
 * default; the learner can still switch to General Stories from the sub-nav
 * right beneath it). Once that item is the active section (current route
 * under /learn/stories or /learn/normal), it grows two indented sub-links
 * right beneath it — "Longer Stories" i.e. Daily Lessons (/learn/normal),
 * shown first, then "Simple Stories" (/learn/stories) — same route split as
 * before, just reached from inside the sidebar itself instead of a second
 * top-level nav item. "Library" gets the identical treatment for admins: once
 * active (under /learn/library), it grows "Books" (/learn/library) and
 * "Novels" (/learn/library/novels) beneath it — this replaced the old
 * top-of-page Books/Novels pill toggle (formerly LibraryTypeToggle) both
 * pages used to render, same reasoning as the Stories merge: the split now
 * lives in the sidebar itself. Regular learners never see the Library item
 * at all (still admin-only — see (dashboard)/library/page.tsx's isAdmin()
 * gate). Both sub-navs are desktop-only (see their own `hidden md:flex`):
 * the mobile bottom tab bar has no room for a nested sub-list, so there
 * "Stories"/"Library" stay single plain buttons, same as every other mobile
 * tab. Both switches reappear on mobile a different way —
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
export function LearnSidebar({
  isAdminUser = false,
  libraryOpen,
  passagesEnabled = false,
  mobilePath = false,
  rulesEnabled = false,
  videoEnabled = false,
}: {
  isAdminUser?: boolean;
  /** Whether the Library's menu item exists for this visitor: admins, and subscribers once the "libraryGift" permission is open for them. Defaults to isAdminUser. */
  libraryOpen?: boolean;
  /** The "passages" feature switch, resolved for this visitor — the nav item exists only while it is open to them (Admin preview: admins only). */
  passagesEnabled?: boolean;
  /** The mobilePath permission, resolved for this visitor: below md: the bottom bar becomes Path, Passages, Stories, Lessons and More, whose sheet holds Words, the rule library, the Library and Video (the desktop sidebar is unchanged). */
  mobilePath?: boolean;
  /** The "dailyRule" permission, resolved for this visitor (and signed in): the rule library, «قواعدي», is a menu item from md: up, and a tile in the phone's More sheet. */
  rulesEnabled?: boolean;
  /** The "videoDictation" permission, resolved for this visitor: «فيديو» is a menu item from md: up, and a tile in the phone's More sheet. */
  videoEnabled?: boolean;
}) {
  const pathname = usePathname();
  const { t, dir, locale } = useLocale();
  const showLibrary = libraryOpen ?? isAdminUser;
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
      : pathname.startsWith("/learn/path")
        ? "path"
        : pathname.startsWith("/learn/normal")
          ? "stories"
          : pathname.startsWith("/learn/conversation")
            ? "conversation"
            : pathname.startsWith("/learn/stories")
              ? "stories"
              : pathname.startsWith("/learn/passages")
                ? "passages"
                : pathname.startsWith("/learn/video")
                  ? "video"
                  : pathname.startsWith("/learn/word-lists")
                    ? "word-lists"
                    : pathname.startsWith("/learn/library")
                      ? "library"
                      : pathname.startsWith("/learn/rules")
                        ? "rules"
                        : null;

  // Stories and Ordinary Lessons collapse into one "Stories" nav item, which
  // opens on /learn/normal (Daily Lessons) by default — see the
  // Stories/Library sub-navs rendered right below their parent items
  // further down. Order is Home, Stories, Library, Word Lists.
  // Library is admin-only for now (see (dashboard)/library/page.tsx and its
  // sibling pages, which enforce this same gate server-side) — a regular
  // learner never sees the nav item to it.
  // Passages sits right after Stories (the two reading-flavoured sections) and, like
  // Library, only exists while the section is open to this visitor — see
  // passagesEnabled (the "passages" feature switch: Admin preview = admins only).
  const NAV_ITEMS = [
    { key: "home", href: "/learn", label: t.nav.home, icon: Home },
    { key: "stories", href: "/learn/normal", label: t.nav.stories, icon: NotebookText },
    { key: "passages", href: "/learn/passages", label: t.nav.passages, icon: Headphones },
    { key: "video", href: "/learn/video", label: videoStrings(locale).navLabel, icon: Play },
    { key: "library", href: "/learn/library", label: t.nav.library, icon: Library },
    { key: "word-lists", href: "/learn/word-lists", label: t.nav.wordLists, icon: ListChecks },
    { key: "rules", href: "/learn/rules", label: ruleStrings(locale).myRules, icon: Lightbulb },
  ].filter(
    (item) =>
      (item.key !== "library" || showLibrary) &&
      (item.key !== "passages" || passagesEnabled) &&
      (item.key !== "video" || videoEnabled) &&
      (item.key !== "rules" || rulesEnabled),
  );

  // The phone bar of the mobilePath permission: one tab per kind of content (Path, Passages, Stories and
  // the daily Lessons, named short here: the page it opens carries the full title) and «More», which
  // holds the sections that are not content tabs. Only drawn below md:, the desktop sidebar above keeps
  // its own items.
  const PHONE_ITEMS: PhoneMoreItem[] | null = mobilePath
    ? [
        { key: "home", href: "/learn", label: t.mobilePath.navPath, icon: Home },
        ...(passagesEnabled
          ? [{ key: "passages", href: "/learn/passages", label: t.nav.passages, icon: Headphones }]
          : []),
        { key: "stories", href: "/learn/stories", label: t.nav.stories, icon: NotebookText },
        { key: "path", href: "/learn/path", label: t.mobilePath.navLessons, icon: Route },
      ]
    : null;

  // What «More» holds, in this order: the rule library (a signed-in learner with dailyRule open), Words,
  // the Library (admins, and subscribers once libraryGift is open) and Video dictation (while its
  // permission is open). A visitor with only Words left (a guest) gets it as a plain tab instead.
  const MORE_ITEMS: PhoneMoreItem[] = mobilePath
    ? [
        ...(rulesEnabled
          ? [
              {
                key: "rules",
                href: "/learn/rules",
                label: ruleStrings(locale).myRules,
                icon: Lightbulb,
              },
            ]
          : []),
        {
          key: "word-lists",
          href: "/learn/word-lists",
          label: t.mobilePath.navWords,
          icon: ListChecks,
        },
        ...(showLibrary
          ? [
              {
                key: "library",
                href: "/learn/library",
                label: t.nav.library,
                icon: Library,
                tag: t.mobilePath.moreSubscribers,
              },
            ]
          : []),
        ...(videoEnabled
          ? [
              {
                key: "video",
                href: "/learn/video",
                label: videoStrings(locale).navLabel,
                icon: Play,
                fullLoad: true,
              },
            ]
          : []),
      ]
    : [];
  const showMore = MORE_ITEMS.length > 1;
  const phoneTabs = PHONE_ITEMS && !showMore ? [...PHONE_ITEMS, ...MORE_ITEMS] : PHONE_ITEMS;

  // Every route this sidebar links to, present on every /learn/* page —
  // warmed in the background instead of through each Link's own default
  // prefetch (see this file's Links below, all `prefetch={false}`) so they
  // don't all fire the instant this persistent nav mounts, competing with
  // whatever the current page itself needs to load. See
  // useDeferredPrefetch's own doc comment for why router.prefetch() (not a
  // <link> tag) is the right mechanism here.
  //
  // The sub-nav routes go first and don't wait out the usual startup delay:
  // the only thing a learner does next from Daily Lessons is tap General
  // Stories (or back), and queued behind the four primary routes that tap
  // landed on a cold route for about a second after every arrival — the
  // intermittent "button didn't respond" lag.
  const subNavHrefs =
    active === "stories"
      ? ["/learn/stories", "/learn/normal"]
      : active === "library" && showLibrary
        ? ["/learn/library", "/learn/library/novels"]
        : [];
  useDeferredPrefetch(subNavHrefs, 0);
  // «فيديو» is entered with a full page load (see SidebarLink's fullLoad), so there is nothing to warm for it.
  useDeferredPrefetch(
    [...NAV_ITEMS, ...(PHONE_ITEMS ?? [])]
      .filter((item) => item.key !== "video")
      .map((item) => item.href),
  );

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
          "group/bar flex items-stretch justify-around px-1 py-1.5",
          "md:h-full md:flex-col md:items-stretch md:justify-start md:gap-1 md:px-3 md:py-6",
        )}
      >
        {NAV_ITEMS.flatMap((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const navLink = (
            <SidebarLink
              key={item.key}
              href={item.href}
              isActive={isActive}
              fullLoad={item.key === "video"}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-xs font-medium",
                "md:flex-none md:flex-row md:gap-2.5 md:px-3 md:py-2.5 md:text-sm md:whitespace-nowrap pointer-coarse:md:min-h-11",
                (PHONE_ITEMS || item.key === "rules") && "max-md:hidden",
                isActive
                  ? "text-primary md:bg-brand-muted"
                  : "text-muted-foreground hover:text-foreground md:hover:bg-secondary",
                "has-[[data-pending]]:text-primary md:has-[[data-pending]]:bg-brand-muted",
              )}
            >
              <Icon className="size-5 shrink-0 md:size-4" aria-hidden="true" />
              <span dir={dir}>{item.label}</span>
            </SidebarLink>
          );

          // The Stories/Ordinary Lessons and Library/Novels sub-navs (see
          // this file's own doc comment): only once the parent item is the
          // active section, and only on the md:+ sidebar — the mobile
          // bottom bar has no room for a nested sub-list.
          const subItems =
            item.key === "stories" && isActive
              ? [
                  {
                    key: "longer",
                    href: "/learn/normal",
                    label: t.storiesHub.longerTab,
                    isSubActive: pathname.startsWith("/learn/normal"),
                  },
                  {
                    key: "simplified",
                    href: "/learn/stories",
                    label: t.storiesHub.simplifiedTab,
                    isSubActive: pathname.startsWith("/learn/stories"),
                  },
                ]
              : item.key === "library" && isActive && showLibrary
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
                <SidebarLink
                  key={subItem.key}
                  href={subItem.href}
                  isActive={subItem.isSubActive}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap pointer-coarse:min-h-11 pointer-coarse:py-3",
                    subItem.isSubActive
                      ? "text-primary bg-brand-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    "has-[[data-pending]]:text-primary has-[[data-pending]]:bg-brand-muted",
                  )}
                >
                  <span dir={dir}>{subItem.label}</span>
                </SidebarLink>
              ))}
            </div>,
          ];
        })}
        {phoneTabs?.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <SidebarLink
              key={`phone-${item.key}`}
              fullLoad={item.fullLoad}
              href={item.href}
              isActive={isActive}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-xs font-medium md:hidden",
                isActive
                  ? "text-primary group-has-[[data-more-open]]/bar:text-muted-foreground"
                  : "text-muted-foreground hover:text-foreground",
                "has-[[data-pending]]:text-primary",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span dir={dir}>{item.label}</span>
            </SidebarLink>
          );
        })}
        {PHONE_ITEMS && showMore && (
          <PhoneMore
            key={pathname}
            items={MORE_ITEMS}
            active={active}
            label={t.mobilePath.navMore}
            dir={dir}
          />
        )}
      </div>
    </nav>
  );
}

/** One section of the phone bar: a plain tab, or a tile in the «More» sheet. */
interface PhoneMoreItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** A small line under the name in the sheet (the Library's «for subscribers»). */
  tag?: string;
  /** Loads as a new page, see SidebarLink. */
  fullLoad?: boolean;
}

/**
 * The phone bar's last tab, «More» (below md: only): the sections that are not content tabs (the rule
 * library, Words, the Library, Video dictation) sit in a small sheet above the bar, so a phone reaches
 * them without a sixth tab. The sheet closes on a tap outside it, on Escape and when the page changes
 * (LearnSidebar keys this component by the path, so it starts closed on every page); a tapped section
 * stays in view, pulsing like a bar tab, until its page arrives. While one of these sections is the
 * current page the tab takes its name and icon and stays lit, so the learner always sees where they
 * are, and a dot marks the tab until the sheet has been opened once on this device. The sheet hangs
 * from the bar's top edge (inside the fixed nav, whose backdrop blur would make a fixed child size
 * itself to the bar) and, while it is open, the page's own current tab steps back so only «More» is lit.
 */
function PhoneMore({
  items,
  active,
  label,
  dir,
}: {
  items: readonly PhoneMoreItem[];
  active: string | null;
  label: string;
  dir: "ltr" | "rtl";
}) {
  const [open, setOpen] = useState(false);
  const { seen, markSeen } = usePhoneMoreSeen();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const current = items.find((item) => item.key === active);
  const Icon = current?.icon ?? LayoutGrid;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        data-more-open={open ? "" : undefined}
        onClick={() => {
          setOpen((value) => !value);
          markSeen();
        }}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-xs font-medium md:hidden",
          "focus-visible:ring-ring focus-visible:ring-offset-background transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          open || current ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="relative flex">
          <Icon className="size-5 shrink-0" aria-hidden="true" />
          {!seen && !current && (
            <span
              aria-hidden="true"
              className="bg-primary absolute -top-0.5 -right-1 size-2 rounded-full"
            />
          )}
        </span>
        <span dir={dir}>{current?.label ?? label}</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="motion-safe:animate-in motion-safe:fade-in absolute inset-x-0 bottom-full h-svh cursor-default bg-black/30 duration-150 md:hidden"
          />
          <div
            role="group"
            aria-label={label}
            className="border-border/60 bg-background motion-safe:animate-in motion-safe:fade-in absolute inset-x-0 bottom-full grid grid-cols-2 gap-2 rounded-t-2xl border border-b-0 p-3 duration-150 md:hidden"
          >
            {items.map((item) => {
              const ItemIcon = item.icon;
              const isCurrent = item.key === active;
              return (
                <SidebarLink
                  key={item.key}
                  href={item.href}
                  isActive={isCurrent}
                  fullLoad={item.fullLoad}
                  onClick={isCurrent ? () => setOpen(false) : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5 text-sm font-medium",
                    isCurrent
                      ? "border-primary/30 bg-brand-muted text-primary"
                      : "border-border/60 text-foreground active:bg-secondary",
                    "has-[[data-pending]]:border-primary/30 has-[[data-pending]]:bg-brand-muted",
                  )}
                >
                  <span
                    className={cn(
                      "text-primary flex size-9 shrink-0 items-center justify-center rounded-[10px]",
                      isCurrent ? "bg-background/70" : "bg-brand-muted",
                    )}
                  >
                    <ItemIcon className="size-5" aria-hidden="true" />
                  </span>
                  <span dir={dir} className="min-w-0">
                    {item.label}
                    {item.tag && (
                      <span className="text-muted-foreground block text-[11px] font-normal">
                        {item.tag}
                      </span>
                    )}
                  </span>
                </SidebarLink>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/**
 * One sidebar Link. `prefetch={false}` stays (see LearnSidebar's own
 * useDeferredPrefetch comment), which also turns off Next's hover/touch
 * prefetch — so warm the route on intent here instead — and the link lights up
 * the instant it is pressed (see LinkPendingMarker) rather than sitting
 * unchanged until the next page arrives.
 *
 * `fullLoad` renders a plain link, so the browser loads the page anew. Video dictation needs it: its
 * routes alone are served with YouTube in the Content-Security-Policy (src/middleware.ts, needsYouTube),
 * and a policy belongs to the document that was loaded, not to the route shown in it. A soft
 * navigation from another page keeps that page's policy, which blocks the thumbnails and the player.
 */
function SidebarLink({
  href,
  isActive,
  className,
  fullLoad = false,
  onClick,
  children,
}: {
  href: string;
  isActive: boolean;
  className: string;
  fullLoad?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const intent = useIntentPrefetch(href);

  if (fullLoad) {
    return (
      <a
        href={href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "focus-visible:ring-ring focus-visible:ring-offset-background transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          className,
        )}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      {...intent}
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 has-[[data-pending]]:animate-pulse",
        className,
      )}
    >
      {children}
      <LinkPendingMarker />
    </Link>
  );
}
