import { ServerOff } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Shown instead of admin content screens when no Supabase project is linked — mirrors src/components/auth/not-configured-notice.tsx. */
export function NotConfiguredNotice() {
  return (
    <Card>
      <CardHeader>
        <div className="bg-muted text-muted-foreground mb-2 flex size-11 items-center justify-center rounded-lg">
          <ServerOff className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">Nothing to manage yet</CardTitle>
        <CardDescription>
          This environment isn&apos;t connected to a Supabase project, so there&apos;s no content
          database for the admin panel to read or write. See{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">supabase/README.md</code> to link
          one.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
