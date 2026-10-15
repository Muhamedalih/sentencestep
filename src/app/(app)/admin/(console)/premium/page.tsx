import type { Metadata } from "next";

import { GrantPremiumForm } from "@/components/admin/grant-premium-form";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Give Premium",
};

export default function AdminPremiumPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Give Premium</h1>
        <p className="text-muted-foreground mt-1">
          Add free Premium days to any account, whether or not they have ever subscribed. Use it to
          make up for a failed payment or as a gift.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add days</CardTitle>
          <CardDescription>
            Days are added on top of any Premium the account still has; otherwise they start now.
            The account must already exist, so someone who has not signed up yet needs to do that
            first. Every grant is recorded in the Audit log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GrantPremiumForm />
        </CardContent>
      </Card>
    </div>
  );
}
