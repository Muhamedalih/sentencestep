import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";
import { DashboardChrome } from "@/components/app/dashboard-chrome";
import { LearnSidebar } from "@/components/app/learn-sidebar";
import { ReportProblemButton } from "@/components/app/report-problem-button";
import { isAdmin } from "@/lib/admin/access";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchMySavedSentencesCount } from "@/lib/supabase/queries/saved-sentences";

/**
 * The dashboard chrome (header + sidebar) for every /learn/* page except
 * the lesson player itself. This is a Next.js route group — the
 * "(dashboard)" segment is invisible in the URL, so /learn, /learn/[mode],
 * /learn/settings, and /learn/word-lists are unaffected and still resolve
 * to the same paths as before.
 *
 * /learn/[mode]/[lessonId] deliberately lives outside this group (see that
 * route's page.tsx) so the lesson player can render truly full-viewport,
 * with no header or sidebar — see src/app/learn/layout.tsx, the shared
 * ancestor both this layout and the lesson route sit under, which now only
 * provides context (auth/voice/typing-sound), never this chrome.
 *
 * StartingLevelOnboarding used to mount here; it's now root-mounted (see
 * src/app/layout.tsx) alongside FirstTimeLanguagePicker instead, since it's
 * the second step of one linear language→level→lesson flow a brand-new
 * guest hits at "/" — it self-gates on pathname now, so it no longer needs
 * to live inside this specific layout to only ever fire once.
 *
 * DashboardChrome hides both header and sidebar above md: specifically on
 * /learn/settings, so that page reads as its own focused desktop screen
 * instead of sitting inside the same header+sidebar shell as every other
 * /learn/* page — a deliberate one-route exception, not a general escape
 * hatch. Below md:, nothing changes: DashboardChrome only ever toggles a
 * wrapper's md:hidden, never AppHeader/LearnSidebar's own mobile markup.
 */
export default async function LearnDashboardLayout({ children }: { children: ReactNode }) {
  // getCurrentUser() is React cache()-memoized (LearnLayout already resolved it
  // for this request), so awaiting it here costs nothing — and it lets the
  // three reads below all start together. isAdmin() runs unconditionally
  // (matching every other isAdmin() call site in the app, e.g. the Home
  // dashboard page.tsx) rather than being gated behind `user` — it has its own
  // non-production dev-cookie override that works without a real session.
  // None of the three depends on another (the saved-items count and the
  // progress need only user.id), so they used to wait on isAdmin's role lookup
  // for no reason, adding a full round trip to every dashboard page.
  const user = await getCurrentUser();
  const [isAdminUser, savedCount, initialProgress] = await Promise.all([
    isAdmin(),
    user ? fetchMySavedSentencesCount(user.id) : 0,
    user ? fetchProgressCached(todayLocalISODate()) : undefined,
  ]);

  return (
    <div className="app-shell bg-background flex min-h-svh flex-col">
      <DashboardChrome
        header={<AppHeader user={user} savedCount={savedCount} initialProgress={initialProgress} />}
        sidebar={<LearnSidebar isAdminUser={isAdminUser} />}
      >
        {children}
      </DashboardChrome>
      {/* Guests have no email to follow up on — see submitProblemReport and problem_reports' RLS insert policy. */}
      {user?.email && <ReportProblemButton />}
    </div>
  );
}
