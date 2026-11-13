import Link from "next/link";

import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";
import { wordsHubStrings } from "@/lib/words-hub/strings";
import { tabHref, type WordsTab } from "@/lib/words-hub/tabs";

/**
 * The head of the one Words page («الكلمات», the wordsPage permission): the title, and under the
 * same title the tabs Topics, Core and Saved. With a single tab there is no bar at all. A server
 * component of plain links: switching a tab is a page load, so each tab is an address that can be
 * opened, shared and gone back to.
 */
export function WordsHubHeader({
  active,
  tabs,
  locale,
}: {
  active: WordsTab;
  tabs: readonly WordsTab[];
  locale: SupportLocale | null;
}) {
  const s = wordsHubStrings(locale);
  const labels: Record<WordsTab, string> = {
    groups: s.tabGroups,
    core: s.tabCore,
    map: s.tabMap,
    saved: s.tabSaved,
  };
  return (
    <div className="mb-3.5 flex flex-col gap-3 md:mb-5 md:min-h-[52px] md:flex-row md:items-center md:justify-between md:gap-4">
      <h1 className="text-left text-2xl leading-[1.2] font-semibold tracking-[-0.01em] md:text-[28px]">
        <span dir="auto">{s.title}</span>
      </h1>
      {tabs.length > 1 && (
        <nav
          aria-label={s.tabsLabel}
          className="bg-muted flex rounded-[10px] p-[3px] md:inline-flex"
        >
          {tabs.map((tab) => (
            <Link
              key={tab}
              href={tabHref(tab)}
              prefetch={false}
              aria-current={active === tab ? "page" : undefined}
              className={cn(
                "flex-1 rounded-lg px-3.5 py-1.5 text-center text-[13px] font-semibold transition-colors duration-150 md:flex-none",
                active === tab
                  ? "bg-brand-muted text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span dir="auto">{labels[tab]}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
