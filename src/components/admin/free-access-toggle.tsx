"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setFreeForAll } from "@/lib/admin/access-settings-actions";
import { cn } from "@/lib/utils";

export function FreeAccessToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function toggle() {
    const next = !enabled;
    setMessage(null);
    startTransition(async () => {
      const result = await setFreeForAll(next);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setEnabled(next);
      setMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status</span>
        <Badge variant={enabled ? "default" : "muted"}>
          {enabled ? "Everything is free right now" : "Normal subscriptions"}
        </Badge>
      </div>

      <Button
        type="button"
        variant={enabled ? "outline" : "default"}
        onClick={toggle}
        disabled={isPending}
        className="w-fit"
      >
        {isPending
          ? "Saving…"
          : enabled
            ? "End promotion — restore subscriptions"
            : "Make everything free"}
      </Button>

      {message && (
        <p
          role={message.kind === "error" ? "alert" : undefined}
          className={cn(
            "text-sm",
            message.kind === "error" ? "text-danger" : "text-muted-foreground",
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
