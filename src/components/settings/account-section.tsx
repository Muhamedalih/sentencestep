import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { AccessState } from "@/lib/billing/types";

export function AccountSection({
  t,
  email,
  access,
  memberSince,
}: {
  t: Dictionary;
  email: string;
  access: AccessState;
  /** ISO date string, or null if unavailable — falls back to omitting the row entirely rather than showing a broken date. */
  memberSince: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.accountHeading}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">{t.auth.emailLabel}</span>
          <span className="font-medium">{email}</span>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">{t.settings.planLabel}</span>
          <div className="flex items-center gap-2">
            <Badge variant={access.isPremium ? "default" : "muted"}>
              {access.isPremium ? t.common.premium : t.common.freePlan}
            </Badge>
            {access.isPremium ? (
              <ManageBillingButton />
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/upgrade">{t.common.upgrade}</Link>
              </Button>
            )}
          </div>
        </div>

        {memberSince && (
          <p className="text-muted-foreground text-sm">
            {t.settings.memberSinceLabel.replace(
              "{date}",
              new Date(memberSince).toLocaleDateString(),
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
