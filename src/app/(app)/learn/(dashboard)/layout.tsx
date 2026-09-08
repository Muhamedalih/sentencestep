import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";
import { LearnSidebar } from "@/components/app/learn-sidebar";
import { ReportProblemButton } from "@/components/app/report-problem-button";
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
 */
export default async function LearnDashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const savedCount = user ? await fetchMySavedSentencesCount(user.id) : 0;

  return (
    <div className="app-shell bg-background flex min-h-svh flex-col">
      <AppHeader user={user} savedCount={savedCount} />
      <div className="flex flex-1 flex-col md:flex-row">
        <LearnSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      {/* Guests have no email to follow up on — see submitProblemReport and problem_reports' RLS insert policy. */}
      {user?.email && <ReportProblemButton />}
    </div>
  );
}
