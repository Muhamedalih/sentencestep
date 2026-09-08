import type { Metadata } from "next";

import { LessonColorSettingsCustomizer } from "@/components/admin/lesson-color-settings-customizer";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { getLessonColorSettings } from "@/lib/admin/lesson-color-settings-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Color settings",
};

export default async function AdminColorSettingsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const settings = await getLessonColorSettings();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Color settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize specific colors in the lesson player (typing, illustrations, conversation,
          rewards) without editing code. Anything left as &quot;Default&quot; keeps the app&apos;s
          original design; changes apply to every learner as soon as you save, with no redeploy
          needed.
        </p>
      </div>
      <LessonColorSettingsCustomizer initial={settings} />
    </div>
  );
}
