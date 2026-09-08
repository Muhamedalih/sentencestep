import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { LessonFontSettingsForm } from "@/components/admin/lesson-font-settings-form";
import { getLessonFontSettings } from "@/lib/admin/lesson-font-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Fonts",
};

export default async function AdminLessonFontsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const settings = await getLessonFontSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Fonts</h1>
        <p className="text-muted-foreground mt-1">
          The font used for the sentence a learner types, per section — Normal lessons, Stories,
          Conversation, Book Reading, Word Lists, and Fix Your Mistakes.
        </p>
      </div>
      <LessonFontSettingsForm initial={settings} />
    </div>
  );
}
