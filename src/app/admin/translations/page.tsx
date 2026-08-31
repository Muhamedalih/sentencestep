import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { BulkGenerateControl } from "@/components/admin/bulk-generate-control";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listEnabledLocales } from "@/lib/admin/translation-queries";
import type { EnabledLocaleOption } from "@/lib/admin/translation-queries";
import { listTranslationDashboardRows } from "@/lib/admin/translation-dashboard-queries";
import type { DashboardFilters } from "@/lib/admin/translation-dashboard-queries";
import type { DerivedTranslationState } from "@/lib/translation/completeness";
import { isSupportLocale } from "@/lib/i18n/locales";
import type { SupportLocale } from "@/lib/i18n/locales";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface SupportedLocaleOption extends EnabledLocaleOption {
  code: SupportLocale;
}

function toSupportedLocaleOptions(locales: EnabledLocaleOption[]): SupportedLocaleOption[] {
  return locales.filter((l): l is SupportedLocaleOption => isSupportLocale(l.code));
}

export const metadata: Metadata = {
  title: "Translations",
};

interface TranslationsSearchParams {
  locale?: string;
  status?: string;
  stale?: string;
  q?: string;
}

function isDashboardStatus(
  value: string | undefined,
): value is NonNullable<DashboardFilters["status"]> {
  return (
    value === "approved" || value === "ai_generated" || value === "failed" || value === "missing"
  );
}

const STATE_BADGE: Record<
  DerivedTranslationState,
  { variant: "default" | "secondary" | "success" | "muted" | "outline"; className?: string }
> = {
  APPROVED: { variant: "success" },
  NEEDS_REVIEW: { variant: "default" },
  STALE: { variant: "secondary" },
  MISSING: { variant: "muted" },
  FAILED: { variant: "outline", className: "text-danger border-danger/40 bg-danger/10" },
};

export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: Promise<TranslationsSearchParams>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const params = await searchParams;
  // Only locales the app code actually recognizes today — a locale can
  // exist in the database (mid Phase 6/7 onboarding) before SupportLocale's
  // compile-time union is widened to include it; nothing here can safely
  // act on one until code catches up.
  const enabledLocales = toSupportedLocaleOptions(await listEnabledLocales());
  if (enabledLocales.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Translations</h1>
        <p className="text-muted-foreground">No support locale is enabled yet.</p>
      </div>
    );
  }

  const requestedLocale = params.locale;
  const activeLocale =
    requestedLocale &&
    isSupportLocale(requestedLocale) &&
    enabledLocales.some((l) => l.code === requestedLocale)
      ? requestedLocale
      : enabledLocales[0]!.code;

  const filters: DashboardFilters = {
    locale: activeLocale,
    status: isDashboardStatus(params.status) ? params.status : undefined,
    staleOnly: params.stale === "1",
    search: params.q?.trim() || undefined,
  };

  const { rows, truncated } = await listTranslationDashboardRows(filters);
  const hasActiveFilters = Boolean(filters.status || filters.staleOnly || filters.search);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Translations</h1>
          <p className="text-muted-foreground mt-1">
            {rows.length} lesson{rows.length === 1 ? "" : "s"} for this locale
          </p>
        </div>
        <BulkGenerateControl locale={activeLocale} />
      </div>

      {truncated && (
        <p className="border-border bg-muted/50 text-muted-foreground rounded-lg border px-4 py-2.5 text-sm">
          Showing only the most recently updated lessons — narrow your search to find one outside
          this list.
        </p>
      )}

      <Card>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="q" className="text-xs font-medium">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Lesson title…"
                className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="locale" className="text-xs font-medium">
                Locale
              </label>
              <select
                id="locale"
                name="locale"
                defaultValue={activeLocale}
                className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
              >
                {enabledLocales.map((locale) => (
                  <option key={locale.code} value={locale.code}>
                    {locale.displayName} ({locale.nativeName})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className="text-xs font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={params.status ?? ""}
                className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
              >
                <option value="">All</option>
                <option value="approved">Fully approved</option>
                <option value="ai_generated">Has AI drafts</option>
                <option value="failed">Has failures</option>
                <option value="missing">Has missing fields</option>
              </select>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="stale"
                value="1"
                defaultChecked={filters.staleOnly}
                className="accent-primary size-4"
              />
              Stale only
            </label>
            <button
              type="submit"
              className="border-input bg-secondary text-secondary-foreground h-9 rounded-lg border px-4 text-sm font-medium"
            >
              Apply
            </button>
            {hasActiveFilters && (
              <Link
                href={`/admin/translations?locale=${activeLocale}`}
                className="text-muted-foreground h-9 px-2 text-sm underline-offset-2 hover:underline"
              >
                Clear
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Lesson</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Stale</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  No lessons match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = STATE_BADGE[row.state];
                return (
                  <tr key={row.lessonId} className="hover:bg-muted/30">
                    <td className="max-w-[20rem] truncate px-4 py-3 font-medium">
                      <Link
                        href={`/admin/translations/${row.lessonId}/${activeLocale}`}
                        className="hover:underline"
                      >
                        {row.lessonTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.summary.approved} / {row.summary.total} approved
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.summary.stale > 0 ? row.summary.stale : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant} className={badge.className}>
                        {row.state.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/translations/${row.lessonId}/${activeLocale}`}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
