import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { isEditorOrAdmin } from "@/lib/admin/access";

/**
 * Every admin page is per-request by nature (it is gated on the caller's
 * session), so none of them may be attempted at build time. Pages like
 * /admin/free-access and /admin/color-settings read their settings through the
 * anonymous client, which touches no cookies, so `next build` started their
 * database reads during "Generating static pages" and a slow Supabase answer
 * there stalled the build past its 60-second per-page limit — three attempts,
 * then a failed deploy. Declared once here instead of on each page, so a new
 * admin page can't reintroduce it.
 */
export const dynamic = "force-dynamic";

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
 *
 * It deliberately draws nothing else. The admin bar and page frame belong to
 * the `(console)` route group (admin/(console)/layout.tsx), and the learner's
 * screen for previewing a draft belongs to `(preview)` — each is a sibling
 * group so a page picks its own frame instead of every /admin page inheriting
 * the bar.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isEditorOrAdmin())) {
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

  return children;
}
