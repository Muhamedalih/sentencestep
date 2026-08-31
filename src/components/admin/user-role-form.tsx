"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { setUserRoleByEmail } from "@/lib/admin/users-actions";
import type { AdminRole } from "@/lib/admin/users-queries";

/** The Users page's "grant a role" form — looks up a user by email and sets their profiles.role, entirely through setUserRoleByEmail (service-role, admin-only). */
export function UserRoleForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await setUserRoleByEmail(email, role);
      if (result.error) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      setMessage({ text: result.success ?? "Done.", isError: false });
      setEmail("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium">
          User email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          className="border-input bg-background h-9 w-64 rounded-lg border px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-xs font-medium">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(event) => setRole(event.target.value as AdminRole)}
          className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
        >
          <option value="editor">Editor — content authoring only</option>
          <option value="admin">Admin — full access</option>
        </select>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving…" : "Grant role"}
      </Button>
      {message && (
        <span
          role="status"
          className={`text-xs ${message.isError ? "text-danger" : "text-muted-foreground"}`}
        >
          {message.text}
        </span>
      )}
    </form>
  );
}
