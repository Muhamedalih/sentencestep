"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { setClassicHomeForEveryoneAction } from "@/lib/rollouts/actions";

/**
 * Admin-only line at the foot of the classic Home: says who gets this page now and, with one button,
 * moves every learner to it or sends them back to the previous Home (the "classicHome" permission's
 * access level, the same switch the Permissions page holds).
 */
export function ClassicHomeSwitch({ everyone }: { everyone: boolean }) {
  const { t, dir } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await setClassicHomeForEveryoneAction(!everyone);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="border-border text-muted-foreground mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-dashed px-4 py-3 text-sm">
      <Users className="size-4 shrink-0" aria-hidden="true" />
      <span dir={dir}>
        {t.quests.classicSwitchLabel.replace(
          "{state}",
          everyone ? t.quests.classicSwitchEveryone : t.quests.classicSwitchAdmins,
        )}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className="border-border hover:bg-muted focus-visible:ring-ring text-foreground ms-auto inline-flex h-9 cursor-pointer items-center rounded-lg border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 disabled:opacity-60"
      >
        <span dir="auto">
          {everyone ? t.quests.classicSwitchToAdmins : t.quests.classicSwitchToEveryone}
        </span>
      </button>
      {error && (
        <p className="text-destructive w-full text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
