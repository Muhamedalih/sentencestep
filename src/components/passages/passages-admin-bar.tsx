"use client";

import { useState, useTransition } from "react";
import { Eye, Globe2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setPassagesPublishedAction } from "@/lib/passages/actions";

/**
 * Shown to admins only, at the top of the Passages page. While the section is
 * in Admin preview it says so and offers the one button that opens it to every
 * learner; once it is
 * public it offers the way back. Publishing asks for a second click, because it
 * is the one thing on this page real learners will notice. Plain English like
 * the rest of the admin panel — learners never see this bar.
 */
export function PassagesAdminBar({ isPublic }: { isPublic: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function run(publish: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await setPassagesPublishedAction(publish);
      setConfirming(false);
      if (result.error) setMessage({ kind: "error", text: result.error });
      else if (result.success) setMessage({ kind: "success", text: result.success });
    });
  }

  return (
    <div className="border-border bg-muted/50 mb-8 flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="bg-brand-muted text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
          {isPublic ? (
            <Globe2 className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </span>
        <div className="text-sm">
          <p className="font-medium">
            {isPublic
              ? "Passages are live for everyone."
              : "Admin preview — only admins can see Passages."}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {confirming
              ? "Everyone will see this section. Publish now?"
              : isPublic
                ? "You can take it back to admins only at any time."
                : "Check the passages, then publish them to every learner with one click."}
          </p>
          {message && (
            <p
              className={message.kind === "success" ? "text-success mt-1" : "text-danger mt-1"}
              role="status"
            >
              {message.text}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {confirming ? (
          <>
            <Button type="button" size="sm" disabled={pending} onClick={() => run(true)}>
              {pending ? "Publishing…" : "Yes, publish to everyone"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </>
        ) : isPublic ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(false)}
          >
            {pending ? "Updating…" : "Back to admins only"}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={() => setConfirming(true)}>
            Publish to everyone
          </Button>
        )}
      </div>
    </div>
  );
}
