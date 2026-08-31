import { NextResponse } from "next/server";

import { getAccessState } from "@/lib/billing/access";
import { getEmailPreferences } from "@/lib/email/preferences";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  fetchProfileAvatarId,
  fetchProfileCreatedAt,
  fetchProfileDailyGoal,
  fetchProfileStartingLevel,
} from "@/lib/supabase/queries/profile";
import {
  fetchDailyProgress,
  fetchStreak,
  fetchUserProgress,
  fetchXp,
} from "@/lib/supabase/queries/progress";
import { todayLocalISODate } from "@/lib/progress/streak";

/**
 * Settings' "Download my data" button — every query here goes through the
 * ordinary RLS-scoped client (see createClient() inside each of these), the
 * same client and the same "auth.uid() = user_id" policies that already
 * scope this learner to their own rows everywhere else in the app, so this
 * can never leak another account's data. Scoped to the core account/
 * learning-progress fields described in Settings rather than a literal dump
 * of every table this user has rows in (saved sentences, individual mistake
 * records, book reading position) — accurate about what it includes, not a
 * claim of exhaustiveness.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const todayISO = todayLocalISODate();
  const [
    avatarId,
    dailyGoal,
    startingLevel,
    createdAt,
    rows,
    streak,
    xp,
    dailyProgress,
    access,
    emailPreferences,
  ] = await Promise.all([
    fetchProfileAvatarId(user.id),
    fetchProfileDailyGoal(user.id),
    fetchProfileStartingLevel(user.id),
    fetchProfileCreatedAt(user.id),
    fetchUserProgress(user.id),
    fetchStreak(user.id),
    fetchXp(user.id),
    fetchDailyProgress(user.id, todayISO),
    getAccessState(),
    getEmailPreferences(user.id),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      displayName: user.displayName,
      memberSince: createdAt,
      avatarId,
    },
    settings: {
      dailyGoal,
      startingLevel,
      emailPreferences,
    },
    plan: {
      plan: access.plan,
      status: access.status,
      expiresAt: access.expiresAt,
    },
    progress: {
      xp,
      streak,
      dailyProgress,
      lessonCompletions: rows.map((row) => ({
        lessonId: row.lesson_id,
        mode: row.mode,
        accuracy: row.accuracy,
        attemptCount: row.attempt_count,
        completedAt: row.completed_at,
      })),
    },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="sentencestep-account-data.json"',
    },
  });
}
