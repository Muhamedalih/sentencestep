import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { TypingSoundSettingsForm } from "@/components/admin/typing-sound-settings-form";
import { getTypingSoundSettings } from "@/lib/admin/typing-sound-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Typing sound",
};

export default async function AdminTypingSoundPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const settings = await getTypingSoundSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Typing sound</h1>
        <p className="text-muted-foreground mt-1">
          The feedback sound every learner hears on each correct keystroke, mistake, and sentence
          completion.
        </p>
      </div>
      <TypingSoundSettingsForm initial={settings} />
    </div>
  );
}
