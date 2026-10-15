import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { FreeAccessToggle } from "@/components/admin/free-access-toggle";
import { LaunchOfferForm } from "@/components/admin/launch-offer-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessSettings } from "@/lib/billing/access-settings-queries";
import { isOfferActive } from "@/lib/billing/launch-offer";
import { getLaunchOffer } from "@/lib/billing/launch-offer-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Free access",
};

export default async function AdminFreeAccessPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const [{ freeForAll }, offer] = await Promise.all([getAccessSettings(), getLaunchOffer()]);
  const offerStatus = offer ? (isOfferActive(offer, new Date()) ? "running" : "ended") : "off";

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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Launch offer</CardTitle>
          <CardDescription>
            A number of bonus days added to every purchase until a last day (through the end of that
            day, UTC). It is shown on the upgrade page, applied when someone starts a payment, and
            never changes what a plan costs. Nobody can buy while everything is free, except an
            account you have excluded to try the paid flow. Leave it off, or remove it, for no
            offer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LaunchOfferForm
            initialBonusDays={offer?.bonusDays ?? 0}
            initialEndsOn={offer?.endsOn ?? null}
            initialStatus={offerStatus}
          />
        </CardContent>
      </Card>
    </div>
  );
}
