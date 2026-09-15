import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { FreeAccessToggle } from "@/components/admin/free-access-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessSettings } from "@/lib/billing/access-settings-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Free access",
};

export default async function AdminFreeAccessPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { freeForAll } = await getAccessSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Free access</h1>
        <p className="text-muted-foreground mt-1">
          Temporarily unlock every lesson and word list for everyone, with no subscribe button shown
          anywhere in the app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sitewide promotion</CardTitle>
          <CardDescription>
            While this is on, every visitor is treated as Premium — locked lessons, locked word
            lists, and the checkout button all disappear. No subscription is created or changed for
            anyone. Turning it back off with this same button instantly restores the normal
            subscription system exactly as it was.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FreeAccessToggle initialEnabled={freeForAll} />
        </CardContent>
      </Card>
    </div>
  );
}
