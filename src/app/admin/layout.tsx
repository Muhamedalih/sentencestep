import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { isAdmin, isEditorOrAdmin } from "@/lib/admin/access";
import { countNewProblemReports } from "@/lib/admin/reports-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/lib/supabase/auth-actions";

/** Belt-and-suspenders alongside robots.ts's `disallow: /admin` — a crawler that ignores robots.txt still gets an explicit noindex here. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Defense in depth: src/middleware.ts already gates every /admin/* request
 * with a real 401/403 before any page code runs. This re-check means the
 * admin area is never reachable purely because of a future middleware
 * matcher change — it fails the same way (a plain "access denied" message,
 * no admin data rendered) if that first layer is ever misconfigured.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [authorized, fullAdmin] = await Promise.all([isEditorOrAdmin(), isAdmin()]);
  // Best-effort only — a nav badge is decorative, never worth taking down
  // the entire admin shell over (e.g. before problem_reports' migration has
  // been applied to this environment's database yet). Editors never see
  // this at all — Reports is one of the admin-only areas (see middleware's
  // ADMIN_ONLY_SEGMENTS), so the count would be noise to them anyway.
  const newReportsCount =
    fullAdmin && isSupabaseConfigured() ? await countNewProblemReports().catch(() => 0) : 0;

  if (!authorized) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Access denied</h1>
        <p className="text-muted-foreground text-sm">
          You don&apos;t have permission to view this area.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/learn">Back to SentenceStep</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/admin" aria-label="SentenceStep admin" className="shrink-0">
              <Logo />
            </Link>
            <nav
              className="hidden items-center gap-5 overflow-x-auto text-sm font-medium whitespace-nowrap md:flex"
              aria-label="Admin"
            >
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/content"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Content
              </Link>
              <Link
                href="/admin/levels"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Levels
              </Link>
              <Link
                href="/admin/library"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Library
              </Link>
              <Link
                href="/admin/library/categories"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Categories
              </Link>
              <Link
                href="/admin/word-lists"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Word Lists
              </Link>
              <Link
                href="/admin/translations"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Translations
              </Link>
              {fullAdmin && (
                <>
                  <Link
                    href="/admin/lesson-completion"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Lesson completion
                  </Link>
                  <Link
                    href="/admin/color-settings"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Color settings
                  </Link>
                  <Link
                    href="/admin/voice"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Voice
                  </Link>
                  <Link
                    href="/admin/typing-sound"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Typing sound
                  </Link>
                  <Link
                    href="/admin/onboarding-card"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Onboarding card
                  </Link>
                  <Link
                    href="/admin/lesson-fonts"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Fonts
                  </Link>
                  <Link
                    href="/admin/reports"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    Reports
                    {newReportsCount > 0 && <Badge variant="secondary">{newReportsCount}</Badge>}
                  </Link>
                  <Link
                    href="/admin/audit-log"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Audit log
                  </Link>
                  <Link
                    href="/admin/users"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Users
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/learn"
              className="text-muted-foreground hover:text-foreground text-sm font-medium whitespace-nowrap transition-colors"
            >
              Exit admin
            </Link>
            <ThemeToggle />
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
