/**
 * The colours of the Home cards (permission "homeCards"), all in this one file so they can be changed
 * without touching a layout. Each card is one diagonal gradient of two or three neighbouring hues,
 * dark at the corner where the title sits and bright at the opposite one, read with white text. The
 * `accent` of a card is a light tone of its own hue, used for the small art on it (lines, ribbon, ring).
 */
export interface CardColors {
  /** The card's background: a CSS gradient. */
  background: string;
  /** The hairline round the card. */
  edge: string;
  /** Small print on the card (the line under the title, the «next» label). */
  soft: string;
  /** A light tone of the card's hue, for the art on it. */
  accent: string;
}

export const HOME_CARD_COLORS = {
  /** Passages: deep navy, royal blue, sky. */
  passages: {
    background: "linear-gradient(135deg,#0b1d4a 0%,#1d4ed8 52%,#38bdf8 100%)",
    edge: "rgba(147,197,253,0.35)",
    soft: "rgba(255,255,255,0.74)",
    accent: "#bfe0ff",
  },
  /** Stories: deep violet, purple, raspberry. */
  stories: {
    background: "linear-gradient(135deg,#2a0a5e 0%,#7c3aed 50%,#db2777 100%)",
    edge: "rgba(216,180,254,0.38)",
    soft: "rgba(255,255,255,0.76)",
    accent: "#fbcfe8",
  },
  /** Video: deep pine, teal, mint. */
  video: {
    background: "linear-gradient(135deg,#04302c 0%,#0f766e 48%,#34d399 100%)",
    edge: "rgba(110,231,183,0.38)",
    soft: "rgba(255,255,255,0.76)",
    accent: "#a7f3d0",
  },
  /** Words: deep indigo into the site's own brand hue. */
  words: {
    background: "linear-gradient(145deg,#1b1744 0%,#3b36a8 55%,#6366f1 100%)",
    edge: "rgba(165,180,252,0.38)",
    soft: "rgba(255,255,255,0.74)",
    accent: "#c7d2fe",
  },
} as const satisfies Record<string, CardColors>;

export type HomeCardColorKey = keyof typeof HOME_CARD_COLORS;
