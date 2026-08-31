import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";
import { LearnSidebar } from "@/components/app/learn-sidebar";
import { ReportProblemButton } from "@/components/app/report-problem-button";
import { StartingLevelOnboarding } from "@/components/app/starting-level-onboarding";
import { getAccessState } from "@/lib/billing/access";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchMySavedSentencesCount } from "@/lib/supabase/queries/saved-sentences";
import { fetchXp } from "@/lib/supabase/queries/progress";

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
 */
export default async function LearnDashboardLayout({ children }: { children: ReactNode }) {
  const [user, access] = await Promise.all([getCurrentUser(), getAccessState()]);
  // Only fetched for a signed-in learner — AccountMenu (which needs both)
  // never mounts for a guest, see AppHeader.
  const [xp, savedCount] = user
    ? await Promise.all([fetchXp(user.id), fetchMySavedSentencesCount(user.id)])
    : [0, 0];

  return (
    <div className="app-shell bg-background flex min-h-svh flex-col">
      <StartingLevelOnboarding />
      <AppHeader user={user} access={access} xp={xp} savedCount={savedCount} />
      <div className="flex flex-1 flex-col md:flex-row">
        <LearnSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      {/* Guests have no email to follow up on — see submitProblemReport and problem_reports' RLS insert policy. */}
      {user?.email && <ReportProblemButton />}
    </div>
  );
}
