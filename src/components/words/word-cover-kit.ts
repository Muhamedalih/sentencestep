import type { CSSProperties } from "react";

/**
 * What every cover drawing is painted with (see word-cover-art.tsx): seven tones, set as CSS
 * variables on the cover, so a scene and its colours are separate things.
 *
 *   bg    the ground          tint   a sun, a halo or a ground band, a step from the ground
 *   ink   the darkest detail  main   the main object          alt    the second object
 *   soft  light shapes (faces, paper, clouds)                 pop    one accent
 */
export type Tone = "bg" | "tint" | "ink" | "main" | "alt" | "soft" | "pop";
export type Palette = Record<Tone, string>;

export const fill = (tone: Tone): CSSProperties => ({ fill: `var(--wc-${tone})` });
export const stroke = (tone: Tone): CSSProperties => ({ stroke: `var(--wc-${tone})` });

/** bg, tint, ink, main, alt, soft, pop. */
export function palette([bg, tint, ink, main, alt, soft, pop]: readonly string[]): Palette {
  return { bg, tint, ink, main, alt, soft, pop } as Palette;
}
