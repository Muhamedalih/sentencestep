"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { grantPremiumByEmail } from "@/lib/admin/premium-grant-actions";
import { MAX_GRANT_DAYS, MIN_GRANT_DAYS } from "@/lib/admin/premium-grant";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
];

/** The "Give Premium" form: looks up the account by email and adds days through grantPremiumByEmail (service-role, admin-only). */
export function GrantPremiumForm() {
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("30");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await grantPremiumByEmail(email, Number(days));
      if (result.error) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      setMessage({ text: result.success ?? "Done.", isError: false });
      setEmail("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="grant-email" className="text-xs font-medium">
            User email
          </label>
          <input
            id="grant-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="border-input bg-background h-9 w-64 rounded-lg border px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="grant-days" className="text-xs font-medium">
            Days of Premium
          </label>
          <input
            id="grant-days"
            type="number"
            required
            min={MIN_GRANT_DAYS}
            max={MAX_GRANT_DAYS}
            step={1}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className="border-input bg-background h-9 w-28 rounded-lg border px-3 text-sm"
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Give Premium"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => setDays(String(preset.days))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              days === String(preset.days)
                ? "border-primary bg-primary/5 font-medium"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {preset.label} ({preset.days})
          </button>
        ))}
      </div>

      {message && (
        <p
          role="status"
          className={`text-sm ${message.isError ? "text-danger" : "text-muted-foreground"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
