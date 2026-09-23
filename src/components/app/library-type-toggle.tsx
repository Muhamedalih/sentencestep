import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * The Library homepage's "Books / Novels" segmented toggle — two plain
 * links (not client tab state) since Books and Novels are two real routes
 * (/learn/library and /learn/library/novels) with their own server-fetched
 * data, same reasoning /learn's primary nav uses real routes instead of a
 * client-side switch. Admin-only for now (see both pages' own isAdmin()
 * gate): the Novels catalog is still being written, so a regular learner
 * never sees this at all — same rollout pattern Stories used while it was
 * being rebuilt (see learn-sidebar.tsx).
 */
export function LibraryTypeToggle({ active }: { active: "books" | "novels" }) {
  const { t, dir } = useLocale();

  return (
    <div
      dir={dir}
      className="bg-muted inline-flex w-fit items-center gap-1 rounded-full p-1 text-sm font-medium"
    >
      <Link
        href="/learn/library"
        aria-current={active === "books" ? "page" : undefined}
        className={cn(
          "rounded-full px-4 py-1.5 transition-colors",
          active === "books"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t.bookLibrary.booksTabLabel}
      </Link>
      <Link
        href="/learn/library/novels"
        aria-current={active === "novels" ? "page" : undefined}
        className={cn(
          "rounded-full px-4 py-1.5 transition-colors",
          active === "novels"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t.bookLibrary.novelsTabLabel}
      </Link>
    </div>
  );
}
