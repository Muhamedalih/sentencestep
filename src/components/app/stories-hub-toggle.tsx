import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * The Stories/Ordinary Lessons segmented toggle — shown at the top of both
 * /learn/stories and /learn/normal now that the sidebar merges what used to
 * be two separate nav items ("Stories" and "Ordinary Lessons") into one
 * "Stories" entry (see learn-sidebar.tsx). Two plain links to the two real,
 * unchanged routes, same reasoning as LibraryTypeToggle: each side has its
 * own server-fetched page, not client tab state. Admin-only for now (see
 * both pages' own isAdmin() gate) — Stories itself is still admin-only while
 * it's being rebuilt, so a regular learner never sees this toggle at all and
 * keeps their existing direct "Ordinary Lessons" nav item untouched.
 */
export function StoriesHubToggle({ active }: { active: "simplified" | "longer" }) {
  const { t, dir } = useLocale();

  return (
    <div
      dir={dir}
      className="bg-muted inline-flex w-fit items-center gap-1 rounded-full p-1 text-sm font-medium"
    >
      <Link
        href="/learn/stories"
        aria-current={active === "simplified" ? "page" : undefined}
        className={cn(
          "rounded-full px-4 py-1.5 transition-colors",
          active === "simplified"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t.storiesHub.simplifiedTab}
      </Link>
      <Link
        href="/learn/normal"
        aria-current={active === "longer" ? "page" : undefined}
        className={cn(
          "rounded-full px-4 py-1.5 transition-colors",
          active === "longer"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t.storiesHub.longerTab}
      </Link>
    </div>
  );
}
