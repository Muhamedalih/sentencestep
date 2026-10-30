import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { isAdmin } from "@/lib/admin/access";
import { countNewInboundEmails } from "@/lib/admin/inbox-queries";
import { countNewAppRatings } from "@/lib/admin/ratings-queries";
import { countNewProblemReports } from "@/lib/admin/reports-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/lib/supabase/auth-actions";

/**
 * The admin console: the navigation bar and the page frame around every
 * admin PAGE. The access check, `force-dynamic` and noindex live one level up
 * (admin/layout.tsx) and cover every route under /admin; this layout is only
 * for the pages that are part of the console. The previews of a draft lesson,
 * book section or word group sit in the sibling `(preview)` group instead,
 * because they are the learner's screen and must not carry the admin bar.
 */
export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const fullAdmin = await isAdmin();
  // Best-effort only — a nav badge is decorative, never worth taking down
  // the entire admin shell over (e.g. before problem_reports' migration has
  // been applied to this environment's database yet). Editors never see
  // this at all — Reports is one of the admin-only areas (see middleware's
  // ADMIN_ONLY_SEGMENTS), so the count would be noise to them anyway.
  // Inbox is the same story (support mail, admin-only, and its migration may
  // not be applied yet), and the counts are independent, so they run
  // together rather than one after the other on every admin request.
  const [newReportsCount, newInboxCount, newRatingsCount] =
    fullAdmin && isSupabaseConfigured()
      ? await Promise.all([
          countNewProblemReports().catch(() => 0),
          countNewInboundEmails().catch(() => 0),
          countNewAppRatings().catch(() => 0),
        ])
      : [0, 0, 0];

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
                    href="/admin/passages"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Passages
                  </Link>
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full page load on purpose: only /admin/video is served with YouTube in its CSP (see SidebarLink's fullLoad) */}
                  <a
                    href="/admin/video"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Video
                  </a>
                  <Link
                    href="/admin/lesson-completion"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Lesson completion
                  </Link>
                  <Link
                    href="/admin/free-access"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Free access
                  </Link>
                  <Link
                    href="/admin/payments"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Payments
                  </Link>
                  <Link
                    href="/admin/binance-pay"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Binance Pay
                  </Link>
                  <Link
                    href="/admin/premium"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Give Premium
                  </Link>
                  <Link
                    href="/admin/features"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                  <Link
                    href="/admin/permissions"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Permissions
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
                    href="/admin/ratings"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    Ratings
                    {newRatingsCount > 0 && <Badge variant="secondary">{newRatingsCount}</Badge>}
                  </Link>
                  <Link
                    href="/admin/inbox"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    Inbox
                    {newInboxCount > 0 && <Badge variant="secondary">{newInboxCount}</Badge>}
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
