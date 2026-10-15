"use client";

import { useCallback, useRef, useState } from "react";
import type { ComponentProps, PointerEvent, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The one button of the Passages screens, so that every press feels the same:
 * a solid-but-soft surface (a gentle top-lit gradient for the main action, quiet
 * tints for the rest), and a press that is felt — the button sinks and springs
 * back past its size (`.passage-btn` in globals.css), and a soft ring spreads
 * from the exact spot that was pressed. On a screen with a keyboard a small
 * key cap ("↵") says which key does the same thing; a touch screen shows the
 * arrow instead.
 */

export type PassageButtonVariant = "primary" | "soft" | "quiet" | "outline";
export type PassageButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<PassageButtonVariant, string> = {
  primary:
    "text-primary-foreground bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_84%,white)_0%,var(--primary)_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_1px_2px_rgb(0_0_0/0.3),0_8px_18px_-12px_color-mix(in_oklab,var(--primary)_50%,transparent)] hover:brightness-[1.07]",
  soft: "text-primary bg-primary/12 ring-1 ring-inset ring-primary/25 hover:bg-primary/18",
  quiet: "text-foreground bg-foreground/[0.07] hover:bg-foreground/[0.12]",
  outline: "text-foreground ring-1 ring-inset ring-border hover:bg-foreground/[0.06]",
};

const SIZES: Record<PassageButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[0.82rem] pointer-coarse:h-10",
  md: "h-10 gap-2 rounded-xl px-4 text-sm pointer-coarse:h-11",
  lg: "h-12 gap-2.5 rounded-xl px-6 text-[0.95rem]",
};

const BASE =
  "passage-btn relative isolate inline-flex items-center justify-center overflow-hidden font-semibold whitespace-nowrap outline-none select-none focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45";

export function passageButtonClass(
  variant: PassageButtonVariant = "primary",
  size: PassageButtonSize = "md",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/** The ring that spreads from the pressed spot. Pure CSS animation; each ring removes itself when it has finished. */
function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const start = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.4;
    const id = nextId.current++;
    setRipples((current) => [
      ...current,
      { id, x: event.clientX - rect.left, y: event.clientY - rect.top, size },
    ]);
  }, []);

  const layer = (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="passage-ripple absolute rounded-full bg-current"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
          onAnimationEnd={() => setRipples((current) => current.filter((r) => r.id !== ripple.id))}
        />
      ))}
    </span>
  );

  return { start, layer };
}

function KeyCap({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden rounded-md bg-[color-mix(in_oklab,currentColor_16%,transparent)] px-1.5 py-1 font-sans text-[0.72rem] leading-none font-semibold pointer-fine:inline-flex">
      {children}
    </kbd>
  );
}

interface CommonProps {
  variant?: PassageButtonVariant;
  size?: PassageButtonSize;
  /** A key that does the same thing, shown as a key cap on screens with a keyboard (the arrow icon, if given, shows on touch screens only). */
  keyHint?: string;
  /** Shown after the label; with a `keyHint` it is replaced by the key cap on screens with a keyboard. */
  trailingIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = CommonProps & Omit<ComponentProps<"button">, keyof CommonProps>;

export function PassageButton({
  variant = "primary",
  size = "md",
  keyHint,
  trailingIcon,
  className,
  children,
  type = "button",
  onPointerDown,
  disabled,
  ...rest
}: ButtonProps) {
  const ripple = useRipple();
  return (
    <button
      type={type}
      disabled={disabled}
      onPointerDown={(event) => {
        if (!disabled) ripple.start(event);
        onPointerDown?.(event);
      }}
      className={passageButtonClass(variant, size, className)}
      {...rest}
    >
      {ripple.layer}
      {children}
      {keyHint && <KeyCap>{keyHint}</KeyCap>}
      {trailingIcon && (
        <span className={cn("flex items-center", keyHint && "pointer-fine:hidden")}>
          {trailingIcon}
        </span>
      )}
    </button>
  );
}

type LinkProps = CommonProps &
  Omit<ComponentProps<typeof Link>, keyof CommonProps | "href"> & { href: string };

export function PassageLinkButton({
  variant = "primary",
  size = "md",
  keyHint,
  trailingIcon,
  className,
  children,
  href,
  onPointerDown,
  ...rest
}: LinkProps) {
  const ripple = useRipple();
  return (
    <Link
      href={href}
      onPointerDown={(event) => {
        ripple.start(event);
        onPointerDown?.(event);
      }}
      className={passageButtonClass(variant, size, className)}
      {...rest}
    >
      {ripple.layer}
      {children}
      {keyHint && <KeyCap>{keyHint}</KeyCap>}
      {trailingIcon && (
        <span className={cn("flex items-center", keyHint && "pointer-fine:hidden")}>
          {trailingIcon}
        </span>
      )}
    </Link>
  );
}
