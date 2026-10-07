"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setLaunchOffer } from "@/lib/admin/access-settings-actions";
import { MAX_BONUS_DAYS } from "@/lib/billing/launch-offer";
import { cn } from "@/lib/utils";

type Status = "off" | "running" | "ended";

const STATUS_LABEL: Record<Status, string> = {
  off: "No offer",
  running: "Offer is running",
  ended: "Offer has ended",
};

export function LaunchOfferForm({
  initialBonusDays,
  initialEndsOn,
  initialStatus,
}: {
  initialBonusDays: number;
  initialEndsOn: string | null;
  initialStatus: Status;
}) {
  const [bonusDays, setBonusDays] = useState(initialBonusDays > 0 ? String(initialBonusDays) : "");
  const [endsOn, setEndsOn] = useState(initialEndsOn ?? "");
  const [status, setStatus] = useState<Status>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function save(clear: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await setLaunchOffer({
        bonusDays: clear ? 0 : Number(bonusDays || 0),
        endsOn: clear ? "" : endsOn,
      });
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      if (clear) {
        setBonusDays("");
        setEndsOn("");
        setStatus("off");
      } else {
        setStatus("running");
      }
      setMessage({ kind: "success", text: result.success ?? "Saved." });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status</span>
        <Badge variant={status === "running" ? "default" : "muted"}>{STATUS_LABEL[status]}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Bonus days on every purchase
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_BONUS_DAYS}
            step={1}
            value={bonusDays}
            onChange={(event) => setBonusDays(event.target.value)}
            placeholder="e.g. 7"
            disabled={isPending}
          />
          <span className="text-muted-foreground text-xs font-normal">
            Extra days added on top of the plan the buyer picks, for example 7. The price does not
            change.
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Last day of the offer
          <Input
            type="date"
            value={endsOn}
            onChange={(event) => setEndsOn(event.target.value)}
            disabled={isPending}
          />
          <span className="text-muted-foreground text-xs font-normal">
            The final day anyone can still get the bonus. Click the calendar icon to pick it. The
            offer runs through the end of that day in UTC, which is 3 AM the next morning in
            Baghdad.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => save(false)} disabled={isPending}>
          {isPending ? "Saving…" : "Save offer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => save(true)}
          disabled={isPending || status === "off"}
        >
          Remove offer
        </Button>
      </div>

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
