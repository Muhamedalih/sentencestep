import type { PassageTone } from "@/lib/passages/types";

/**
 * The look of a passage on its poster. There are no photographs or drawings:
 * each passage gets a colour of its own — warm for the funny ones, cool for the
 * serious ones, violet for the inspiring ones — so the list reads as a wall of
 * distinct posters with the title as the picture, and nothing childish. The
 * mood is carried by the hue alone; it is never spelled out as a label.
 *
 * Deterministic (the same passage always gets the same poster) and pure, so it
 * is a unit test. Never yellow or amber.
 */

/** Two stops per palette: top-left and bottom-right of a diagonal gradient. White text stays readable on every one. */
const PALETTES: Record<PassageTone, readonly (readonly [string, string])[]> = {
  funny: [
    ["#ea580c", "#9f1239"],
    ["#f43f5e", "#7f1d1d"],
    ["#f97316", "#7c2d12"],
  ],
  serious: [
    ["#0284c7", "#1e3a8a"],
    ["#0d9488", "#134e4a"],
    ["#475569", "#0f172a"],
  ],
  inspiring: [
    ["#7c3aed", "#312e81"],
    ["#4f46e5", "#1e1b4b"],
    ["#a21caf", "#4c1d95"],
  ],
};

export interface PosterArt {
  /** The two stops, for a small accent (a dot beside the title in the reader). */
  from: string;
  to: string;
  /** A ready CSS background-image: a soft light from the top-right corner, a shade at the bottom for the title, over the diagonal gradient. */
  backgroundImage: string;
}

export function posterArtFor(tone: PassageTone, order: number): PosterArt {
  const palettes = PALETTES[tone];
  const [from, to] = palettes[Math.abs(order - 1) % palettes.length] ?? palettes[0]!;
  return {
    from,
    to,
    backgroundImage: [
      "radial-gradient(90% 65% at 100% 0%, rgba(255,255,255,0.22), rgba(255,255,255,0) 60%)",
      "linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0) 55%)",
      `linear-gradient(155deg, ${from}, ${to})`,
    ].join(", "),
  };
}

/**
 * What goes over a passage's own picture (see background.ts) on a poster: a soft shade at the
 * top for the number and the badge, a deeper one at the bottom for the title, so white text
 * reads on any picture — a bright one included. The generated colours need no such help, they
 * are chosen so white text works on them.
 */
export const PICTURE_SHADE = [
  "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.44) 40%, rgba(0,0,0,0) 72%)",
  "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0) 28%)",
].join(", ");

/** Colours for a character's name above their sentences — one per character in the order they first speak, so a dialogue reads as a script. */
const SPEAKER_CLASSES = [
  "text-violet-600 dark:text-violet-400",
  "text-sky-600 dark:text-sky-400",
  "text-rose-600 dark:text-rose-400",
  "text-emerald-600 dark:text-emerald-400",
] as const;

export function speakerClassFor(index: number): string {
  return SPEAKER_CLASSES[Math.abs(index) % SPEAKER_CLASSES.length] ?? SPEAKER_CLASSES[0];
}
