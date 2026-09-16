import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, KeyRound, SlidersHorizontal, UserRound } from "lucide-react";

import { AccountSection } from "@/components/settings/account-section";
import { DailyGoalForm } from "@/components/settings/daily-goal-form";
import { DangerZone } from "@/components/settings/danger-zone";
import { EmailPreferencesForm } from "@/components/settings/email-preferences-form";
import { PasswordForm } from "@/components/settings/password-form";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { StartingLevelForm } from "@/components/settings/starting-level-form";
import { TwoFactorSettings } from "@/components/settings/two-factor-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessState } from "@/lib/billing/access";
import { getEmailPreferences } from "@/lib/email/preferences";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";
import {
  fetchProfileCountry,
  fetchProfileCreatedAt,
  fetchProfileDailyGoal,
  fetchProfileStartingLevel,
} from "@/lib/supabase/queries/profile";
import { fetchAttemptCount, fetchStreak, fetchXp } from "@/lib/supabase/queries/progress";
import { fetchWordProgress } from "@/lib/supabase/queries/word-progress";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Settings",
};

// Reads live account state (profile fields, plan, service-role availability)
// on every request — same reasoning as /upgrade's own dynamic export.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 sm:py-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t.settings.signInHeading}</CardTitle>
            <CardDescription>{t.settings.signInSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login?next=/learn/settings">{t.common.signIn}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [
    preferences,
    dailyGoal,
    startingLevel,
    createdAt,
    country,
    access,
    xp,
    streak,
    sessionCount,
    wordsLearned,
  ] = await Promise.all([
    getEmailPreferences(user.id),
    fetchProfileDailyGoal(user.id),
    fetchProfileStartingLevel(user.id),
    fetchProfileCreatedAt(user.id),
    fetchProfileCountry(user.id),
    getAccessState(),
    fetchXp(user.id),
    fetchStreak(user.id),
    fetchAttemptCount(user.id),
    fetchWordProgress(user.id),
  ]);

  return (
    <div className="max-w-4xl px-6 py-16 sm:py-24 md:max-w-5xl md:px-10 md:py-20">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.settings.heading}</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {t.settings.signedInAs.replace("{email}", user.email)}
        </p>
      </div>

      <SettingsTabs
        defaultTab="profile"
        tabs={[
          {
            id: "profile",
            label: t.settings.tabProfile,
            icon: <UserRound />,
            content: (
              <AccountSection
                t={t}
                locale={locale}
                userId={user.id}
                displayName={user.displayName}
                email={user.email}
                access={access}
                memberSince={createdAt}
                country={country}
                xp={xp}
                streak={streak}
                sessionCount={sessionCount}
                wordsLearnedCount={wordsLearned.length}
              />
            ),
          },
          {
            id: "security",
            label: t.settings.tabSecurity,
            icon: <KeyRound />,
            content: (
              <>
                <PasswordForm />
                <TwoFactorSettings />
              </>
            ),
          },
          {
            id: "preferences",
            label: t.settings.tabPreferences,
            icon: <SlidersHorizontal />,
            content: (
              <>
                <DailyGoalForm dailyGoal={dailyGoal} />
                <StartingLevelForm startingLevel={startingLevel} />
                <EmailPreferencesForm preferences={preferences} />
              </>
            ),
          },
          {
            id: "danger-zone",
            label: t.settings.tabDangerZone,
            icon: <AlertTriangle />,
            tone: "danger",
            content: <DangerZone canDeleteAccount={isServiceRoleConfigured()} />,
          },
        ]}
      />
    </div>
  );
}
