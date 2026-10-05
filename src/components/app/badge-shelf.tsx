import { BadgeMedal } from "@/components/app/badge-medal";
import { Progress } from "@/components/ui/progress";
import type { BadgeShelfItem } from "@/lib/features/badge-display";
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import { dirFor, isSupportLocale } from "@/lib/i18n/locales";

/**
 * The grid of badges on the Achievements page: earned ones with their date,
 * locked ones with a progress bar. Presentational (no hooks, no server
 * imports) — the page hands it the already-built shelf and dictionary.
 */
export function BadgeShelf({
  shelf,
  t,
  locale,
}: {
  shelf: BadgeShelfItem[];
  t: Dictionary;
  locale: string | null;
}) {
  const dir = locale && isSupportLocale(locale) ? dirFor(locale) : "ltr";
  const dateFormat = new Intl.DateTimeFormat(locale ?? "en", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shelf.map((item) => {
        const text = t.badges.items[item.badge.id];
        return (
          <li
            key={item.badge.id}
            className="border-border/60 bg-card/60 flex items-start gap-4 rounded-2xl border p-4"
          >
            <BadgeMedal group={item.badge.group} earned={item.earned} />
            <div className="min-w-0 flex-1" dir={dir}>
              <div className="flex items-center gap-2">
                <h2
                  className={
                    item.earned
                      ? "truncate text-base font-semibold"
                      : "text-muted-foreground truncate text-base font-semibold"
                  }
                >
                  {text.name}
                </h2>
                {item.isNew && (
                  <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs font-bold tracking-wide uppercase sm:text-[10px]">
                    {t.badges.newTag}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-sm">{text.description}</p>
              {item.earned && item.earnedAt ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  {t.badges.earnedOn.replace("{date}", dateFormat.format(new Date(item.earnedAt)))}
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={item.progress.fraction * 100} className="h-1.5 flex-1" />
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums" dir="ltr">
                    {t.badges.progress
                      .replace("{current}", String(item.progress.current))
                      .replace("{target}", String(item.progress.target))}
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
