import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A native `<input type="checkbox">` styled as a sliding switch — no extra
 * dependency, so it keeps working uncontrolled inside plain `<form action>`
 * submissions exactly like the checkbox it replaces (same `name`/
 * `defaultChecked` props, same submitted value).
 */
function Switch({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input type="checkbox" className={cn("peer sr-only", className)} {...props} />
      <span className="border-border bg-muted peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background absolute inset-0 rounded-full border transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2" />
      <span className="pointer-events-none absolute start-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
    </label>
  );
}

export { Switch };
