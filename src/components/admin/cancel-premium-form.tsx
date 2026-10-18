"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { cancelPremiumByEmail } from "@/lib/admin/premium-grant-actions";

/** The "Cancel Premium" form: looks up the account by email and ends its Premium through cancelPremiumByEmail (service-role, admin-only). */
export function CancelPremiumForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!window.confirm(`End Premium for ${email.trim()} now?`)) return;
    startTransition(async () => {
      const result = await cancelPremiumByEmail(email);
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
          <label htmlFor="cancel-email" className="text-xs font-medium">
            User email
          </label>
          <input
            id="cancel-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="border-input bg-background h-9 w-64 rounded-lg border px-3 text-sm"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          {isPending ? "Saving…" : "Cancel Premium"}
        </Button>
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
