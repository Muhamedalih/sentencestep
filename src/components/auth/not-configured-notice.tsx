"use client";

import { ServerOff } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";

/** Shown instead of the sign-in/sign-up form when no Supabase project is linked yet — see isSupabaseConfigured(). */
export function NotConfiguredNotice() {
  const { t } = useLocale();

  return (
    <Card>
      <CardHeader>
        <div className="bg-muted text-muted-foreground mb-2 flex size-11 items-center justify-center rounded-lg">
          <ServerOff className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">{t.auth.notConfiguredHeading}</CardTitle>
        <CardDescription>{t.auth.notConfiguredBody}</CardDescription>
      </CardHeader>
    </Card>
  );
}
