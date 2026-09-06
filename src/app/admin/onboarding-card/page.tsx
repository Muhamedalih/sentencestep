import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { OnboardingCardSettingsForm } from "@/components/admin/onboarding-card-settings-form";
import { getOnboardingCardSettings } from "@/lib/admin/onboarding-card-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Onboarding card",
};

export default async function AdminOnboardingCardPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const settings = await getOnboardingCardSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Onboarding card</h1>
        <p className="text-muted-foreground mt-1">
          The cover card every first-time learner sees right after picking their language and level,
          before their opening lesson starts.
        </p>
      </div>
      <OnboardingCardSettingsForm initial={settings} />
    </div>
  );
}
