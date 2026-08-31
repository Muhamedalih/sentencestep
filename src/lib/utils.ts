import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * A small, stable (non-cryptographic) hash — the same string always picks
 * the same index into a `modulo`-sized set, so a per-user choice (a lesson
 * illustration, an avatar color) never changes across reloads/sessions
 * without needing to store it anywhere. Shared by lesson-illustration.tsx
 * and initials-avatar.tsx rather than each keeping its own copy.
 */
export function stableIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash) % modulo;
}
