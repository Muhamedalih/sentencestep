"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A password `<Input>` with a show/hide toggle — every other prop (name,
 * required, minLength, autoComplete, aria-invalid…) passes straight through
 * to the underlying input exactly as a plain password field would. The
 * toggle button sits inside the field's own end padding, mirroring the
 * "end-0"/logical-property idiom already used for AccountMenu's popover
 * rather than a hardcoded left/right side.
 */
export function PasswordInput({
  className,
  showLabel,
  hideLabel,
  ...props
}: React.ComponentProps<"input"> & { showLabel: string; hideLabel: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pe-10", className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 end-0 flex w-10 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
