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
      <div className="border-border bg-card flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3">
        <p className="text-sm">
          <strong>See it as someone in Egypt</strong>
          <span className="text-muted-foreground"> (only you, this browser, one hour)</span>
        </p>
        {/* Plain <a>, not <Link>: a prefetch would switch the view on by itself. */}
        {/* eslint-disable @next/next/no-html-link-for-pages */}
        <a
          href="/api/egypt-view?mode=now"
          className="text-sm font-medium underline underline-offset-4"
        >
          Current: lock page
        </a>
        <a
          href="/api/egypt-view?mode=popup"
          className="text-sm font-medium underline underline-offset-4"
        >
          Before: pop-up
        </a>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
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
