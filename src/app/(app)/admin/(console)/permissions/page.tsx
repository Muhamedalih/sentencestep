import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { PermissionsForm } from "@/components/admin/permissions-form";
import {
  getRolloutConfig,
  isRolloutPreviewActive,
  rolloutsTableReady,
} from "@/lib/rollouts/queries";
import { reminderSendsPerRun } from "@/lib/session-end/reminder";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Permissions",
};

// Always the live rows, never a build-time cache.
export const dynamic = "force-dynamic";

export default async function AdminPermissionsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const [config, previewActive, tableReady] = await Promise.all([
    getRolloutConfig({ fresh: true }),
    isRolloutPreviewActive(),
    rolloutsTableReady(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Every new feature ships here and starts as <strong>Admins only</strong>: nobody but you
          sees it, even though the code is live. When you are happy with it, give it to specific
          people by email to try, and then to everyone. A change takes effect as soon as you save.
          Anything we build from now on is added to this page.
        </p>
      </div>
      <PermissionsForm
        initial={config}
        previewActive={previewActive}
        remindersServerOn={reminderSendsPerRun(process.env.SESSION_REMINDER_MAX_PER_RUN) > 0}
        tableReady={tableReady}
      />
    </div>
  );
}
